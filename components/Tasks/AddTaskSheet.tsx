"use client";

import { cn } from "@/lib/utils";
import { yupResolver } from "@hookform/resolvers/yup";
import { CalendarIcon, X } from "lucide-react";
import moment from "moment";
import { useEffect, useState } from "react";
import { Resolver, useForm } from "react-hook-form";
import * as yup from "yup";
import { Button } from "../ui/button";
import { Combobox } from "../ui/combobox";
import { DateTimePicker } from "../ui/date-time-picker";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "../ui/form";
import { Input } from "../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from "../ui/sheet";
import { Skeleton } from "../ui/skeleton";
import { Textarea } from "../ui/textarea";
import SubtaskList from "./AddSubTasks";

import { getAllCategories } from "@/external-api/functions/category.api";
import { getAllStatuses } from "@/external-api/functions/status.api";
import { addTask, editTask, getTask } from "@/external-api/functions/task.api";
import { queryClient } from "@/pages/_app";
import { Subtask } from "@/typescript/interface/task.interface";
import { useMutation, useQueries } from "@tanstack/react-query";

const schema = yup.object().shape({
  title: yup.string().required("Title is required"),
  description: yup.string().default(""),
  priority: yup.string().default("low"),
  category: yup.string(),
  dueDate: yup.date(),
  status: yup.string(),
  frequency: yup.string().default(""),
  minutesDuration: yup.string().default(""),
  hoursDuration: yup.string().default(""),
  remindBefore: yup.string().default(""),
  subtasks: yup
    .array()
    .of(
      yup
        .object()
        .shape({
          title: yup
            .string()
            .required(
              "Please fill in this subtask or delete it if not needed."
            ),
          completed: yup.boolean().default(false)
        })
        .required()
    )
    .default([])
});

export default function AddTaskSheet({
  open,
  onOpenChange,
  selectedTask,
  editing,
  predefinedStatus,
  predefinedDueDate,
  disabledAll
}: {
  open: boolean;
  onOpenChange: (toggle: boolean) => void;
  selectedTask?: string;
  editing?: boolean;
  predefinedStatus?: string | null;
  predefinedDueDate?: string | null;
  disabledAll?: boolean;
}) {
  // Snapshot the inputs that drive the sheet's identity (edit vs add, which
  // task to load, which status to preselect) at the moment the sheet opens.
  // The parent clears these synchronously on close — without freezing them
  // here, the title would flip from "Edit Task" → "Add New Task" for the
  // duration of the slide-out animation, the data query would re-fire, and
  // re-renders during animation would cause the visible lag.
  const [snapshot, setSnapshot] = useState({
    selectedTask: selectedTask ?? "",
    editing: !!editing,
    predefinedStatus: predefinedStatus ?? null,
    predefinedDueDate: predefinedDueDate ?? null
  });

  useEffect(() => {
    if (!open) return;
    setSnapshot({
      selectedTask: selectedTask ?? "",
      editing: !!editing,
      predefinedStatus: predefinedStatus ?? null,
      predefinedDueDate: predefinedDueDate ?? null
    });
  }, [open, selectedTask, editing, predefinedStatus, predefinedDueDate]);

  const effectiveSelectedTask = snapshot.selectedTask;
  const effectiveEditing = snapshot.editing;
  const effectivePredefinedStatus = snapshot.predefinedStatus;
  const effectivePredefinedDueDate = snapshot.predefinedDueDate;

  const [
    { data, isLoading },
    { data: categories, isLoading: isCategoryLoading, isFetching },
    { data: statuses, isLoading: isStatusLoading, isFetching: isStatusFetching }
  ] = useQueries({
    queries: [
      {
        queryKey: ["task", effectiveSelectedTask],
        queryFn: () => getTask(effectiveSelectedTask),
        enabled: !!effectiveSelectedTask
      },
      {
        queryKey: ["categories"],
        queryFn: getAllCategories
      },
      {
        queryKey: ["status"],
        queryFn: getAllStatuses
      }
    ]
  });

  const { mutate, isPending } = useMutation({
    mutationFn: addTask,
    onSuccess: () => {
      form.reset({
        title: "",
        description: "",
        priority: "low",
        category: "",
        dueDate: undefined,
        status: "",
        frequency: "",
        minutesDuration: "",
        hoursDuration: "",
        remindBefore: "",
        subtasks: []
      });
      onOpenChange(false);
    },
    meta: {
      invalidateQueries: ["tasks"]
    }
  });

  const { mutate: editMutate, isPending: isEditPending } = useMutation({
    mutationFn: editTask,
    onSuccess: () => {
      form.reset({
        title: "",
        description: "",
        priority: "low",
        category: "",
        dueDate: undefined,
        status: "",
        frequency: "",
        minutesDuration: "",
        hoursDuration: "",
        remindBefore: "",
        subtasks: []
      });
      onOpenChange(false);
      queryClient.invalidateQueries({
        queryKey: ["task", effectiveSelectedTask]
      });
    },
    meta: {
      invalidateQueries: ["tasks"]
    }
  });

  // @hookform/resolvers v5 + yup's mix of optional and defaulted fields in
  // this schema produces a Resolver<input> that doesn't match useForm's
  // expected Resolver<output>. Cast through to keep the typed form API while
  // the resolver still validates against the same yup schema at runtime.
  type TaskFormData = yup.InferType<typeof schema>;
  const form = useForm<TaskFormData>({
    resolver: yupResolver(schema) as unknown as Resolver<TaskFormData>,
    defaultValues: {
      title: "",
      description: "",
      priority: "low",
      category: "",
      dueDate: undefined,
      status: "",
      frequency: "",
      minutesDuration: "",
      hoursDuration: "",
      remindBefore: "",
      subtasks: []
    }
  });

  // Single source of truth for seeding the form. When the sheet is open we
  // either populate from the loaded task (edit) or reset to defaults (add).
  // Previously this was split across two useEffects: an open-effect that
  // reset to empty + Todo, and a separate data-effect that filled in task
  // data. On the second open of the same task, react-query returned cached
  // `data` (no change) so the data-effect's deps were stable and it never
  // re-ran — leaving the form stuck on the empty reset. Collapsing them here
  // ensures every transition to open=true re-applies the correct values.
  useEffect(() => {
    if (!open) return;
    if (effectiveEditing) {
      // Wait for the task data to land before populating; if it isn't here
      // yet the data-arrival pass below (same effect, different deps tick)
      // will fire once it does.
      if (!data) return;
      form.reset(
        {
          title: data.title,
          description: data.description,
          priority: data.priority,
          category: data.category._id,
          dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
          status: data.status._id,
          frequency: data.frequency || "",
          minutesDuration: data.taskDuration
            ? (data.taskDuration % 60).toString().padStart(2, "0")
            : "",
          hoursDuration: data.taskDuration
            ? Math.floor(data.taskDuration / 60)
                .toString()
                .padStart(2, "0")
            : "",
          remindBefore: data.remindBefore
            ? data.remindBefore.toString().padStart(2, "0")
            : "",
          subtasks: data.subtasks as Subtask[]
        },
        { keepDirty: false }
      );
      return;
    }
    // Add mode: prefer matching status / category _ids; fall back to the
    // literal labels so the form still has a sensible value before those
    // queries resolve.
    const todoStatus =
      statuses?.find((s) => s.title === "To do")?._id ?? "To do";
    const healthCategory =
      categories?.find((c) => c.title === "Health")?._id ?? "Health";
    form.reset(
      {
        title: "",
        description: "",
        priority: "low",
        category: healthCategory,
        dueDate: effectivePredefinedDueDate
          ? new Date(effectivePredefinedDueDate)
          : undefined,
        status: effectivePredefinedStatus ?? todoStatus,
        frequency: "",
        minutesDuration: "",
        hoursDuration: "",
        remindBefore: "",
        subtasks: []
      },
      { keepDirty: false }
    );
  }, [
    open,
    data,
    effectiveEditing,
    effectivePredefinedStatus,
    effectivePredefinedDueDate,
    statuses,
    categories,
    form
  ]);

  const onSubmit = (data: yup.InferType<typeof schema>) => {
    // The schema marks priority/status as optional, but the API contract
    // (TaskBody) requires both. Coerce to safe defaults at submit time so
    // partial form states still round-trip cleanly.
    const todoStatusId =
      statuses?.find((s) => s.title === "Todo")?._id ?? "Todo";
    const healthCategory =
      categories?.find((c) => c.title === "Health")?._id ?? "Health";
    const finalData = {
      ...data,
      priority: data.priority || "low",
      status: data.status || todoStatusId,
      category: data.category ?? healthCategory,
      remindBefore: data.remindBefore ? parseInt(data.remindBefore) : undefined,
      taskDuration: data.hoursDuration
        ? data.minutesDuration
          ? parseInt(data.hoursDuration) * 60 + parseInt(data.minutesDuration)
          : parseInt(data.hoursDuration) * 60
        : data.minutesDuration
          ? parseInt(data.minutesDuration)
          : undefined,
      frequency:
        data.frequency === "" || !data.frequency ? undefined : data.frequency
    };
    if (effectiveSelectedTask && effectiveEditing) {
      editMutate({ task_id: effectiveSelectedTask, data: finalData });
    } else {
      mutate(finalData);
    }
  };

  const dropDownOptions = {
    priority: [
      { label: "High", value: "high" },
      { label: "Medium", value: "medium" },
      { label: "Low", value: "low" }
    ],
    frequency: [
      { label: "Daily", value: "daily" },
      { label: "Weekly", value: "weekly" },
      { label: "Monthly", value: "monthly" },
      { label: "Yearly", value: "yearly" }
    ],
    hours: Array.from({ length: 24 }, (_, i) => {
      const label = i.toString().padStart(2, "0");
      return { label, value: label };
    }),
    minutes: Array.from({ length: 60 }, (_, i) => {
      const label = i.toString().padStart(2, "0");
      return { label, value: label };
    }),
    reminder: Array.from({ length: 60 }, (_, i) => {
      const label = i.toString().padStart(2, "0");
      return { label, value: label };
    })
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="lg:max-w-2xl gap-0 max-lg:!max-w-full max-lg:!w-full">
        <SheetHeader className="border-b p-6 max-sm:p-4 flex-row items-center justify-between">
          <SheetTitle className="font-archivo font-semibold text-xl text-gray-900">
            {disabledAll
              ? "View Task"
              : effectiveEditing
                ? "Edit Task"
                : "Add New Task"}
          </SheetTitle>
          <SheetClose className="cursor-pointer">
            <X />
          </SheetClose>
        </SheetHeader>
        {isLoading ? (
          <div className="flex-1 p-6 py-4 inline-flex flex-col overflow-auto max-sm:p-4">
            <div className="space-y-5">
              <div className="space-y-4">
                {/* Title */}
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20 bg-gray-200" />
                  <Skeleton className="h-9 w-full bg-gray-200" />
                </div>
                {/* Description */}
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32 bg-gray-200" />
                  <Skeleton className="h-32 w-full bg-gray-200" />
                </div>
                {/* Subtasks */}
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24 bg-gray-200" />
                  <Skeleton className="h-9 w-full bg-gray-200" />
                  <Skeleton className="h-9 w-full bg-gray-200" />
                </div>
                {/* Two-column metadata grid */}
                <div className="grid grid-cols-2 gap-3 pt-4 mt-4 border-t border-gray-100 max-sm:grid-cols-1 max-sm:gap-2">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <div key={idx} className="space-y-2">
                      <Skeleton className="h-3.5 w-20 bg-gray-200" />
                      <Skeleton className="h-9 w-full bg-gray-200" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <Skeleton className="h-4 w-48 mt-auto bg-gray-200" />
          </div>
        ) : (
          <div className="flex-1 p-6 py-4 inline-flex flex-col overflow-auto max-sm:p-4">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-5"
              >
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => {
                      return (
                        <FormItem>
                          <FormLabel className="text-base text-gray-500">
                            Task Title
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="Enter Task Title"
                              {...field}
                              disabled={
                                isPending || isEditPending || disabledAll
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base text-gray-500">
                          Task Description
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            rows={7}
                            placeholder="Enter Task Description"
                            {...field}
                            disabled={isPending || isEditPending || disabledAll}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <SubtaskList
                    disabled={disabledAll || isPending || isEditPending}
                  />
                  <div className="grid grid-cols-2 max-sm:grid-cols-1 max-sm:gap-2 space-y-2 gap-3 pt-4 mt-4 border-t border-gray-100 items-start">
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => {
                        return (
                          <FormItem>
                            <FormLabel className="text-sm text-gray-500">
                              Priority
                            </FormLabel>
                            <FormControl>
                              <Combobox
                                value={field.value}
                                onChange={field.onChange}
                                options={dropDownOptions.priority}
                                placeholder="Select priority"
                                isFlag={true}
                                disabled={
                                  disabledAll || isPending || isEditPending
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm text-gray-500">
                            Category
                          </FormLabel>
                          <FormControl>
                            <Combobox
                              value={field.value}
                              onChange={field.onChange}
                              isCategory
                              options={
                                categories?.map((cat) => {
                                  return {
                                    label: cat.title,
                                    value: cat._id,
                                    bgColor: cat?.color.bg,
                                    textColor: cat?.color.text,
                                    dotColor: cat?.color.text
                                  };
                                }) || []
                              }
                              isLoading={isCategoryLoading || isFetching}
                              placeholder="Select category"
                              isBadge={true}
                              disabled={
                                disabledAll || isPending || isEditPending
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm text-gray-500">
                            Due Date & Time
                          </FormLabel>
                          <FormControl>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-between text-left font-normal [&>span]:justify-between",
                                    !field.value && "text-muted-foreground"
                                  )}
                                  disabled={
                                    disabledAll || isPending || isEditPending
                                  }
                                >
                                  {field.value ? (
                                    moment(field.value).format(
                                      "MMM DD, YYYY, hh:mm A"
                                    )
                                  ) : (
                                    <span className="font-medium">
                                      Select date & time
                                    </span>
                                  )}
                                  <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="p-0" align="start">
                                <DateTimePicker
                                  value={
                                    field.value
                                      ? new Date(field.value)
                                      : undefined
                                  }
                                  onChange={field.onChange}
                                />
                              </PopoverContent>
                            </Popover>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm text-gray-500">
                            Status
                          </FormLabel>
                          <FormControl>
                            <Combobox
                              value={field.value}
                              onChange={field.onChange}
                              isStatus
                              options={
                                statuses?.map((status) => ({
                                  label: status.title,
                                  value: status._id
                                })) || []
                              }
                              isLoading={isStatusLoading || isStatusFetching}
                              placeholder="Select status"
                              disabled={
                                disabledAll || isPending || isEditPending
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="w-full flex flex-col">
                      <span className="text-sm text-gray-500 font-medium mb-2">
                        Task Duration
                      </span>
                      <div className="grid grid-cols-2 gap-3 items-start">
                        <FormField
                          control={form.control}
                          name="hoursDuration"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <div className="grid grid-cols-[1fr_auto] ">
                                  <Combobox
                                    value={field.value}
                                    onChange={field.onChange}
                                    options={dropDownOptions.hours}
                                    placeholder="Select"
                                    className="rounded-tr-none rounded-br-none "
                                    disabled={
                                      disabledAll || isPending || isEditPending
                                    }
                                  />
                                  <span className="text-xs border-1 shadow-xs border-gray-200 border-l-0 px-2 h-full bg-gray-200 rounded-tr-sm rounded-br-sm flex justify-center items-center">
                                    Hours
                                  </span>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="minutesDuration"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <div className="grid grid-cols-[1fr_auto] ">
                                  <Combobox
                                    value={field.value}
                                    onChange={field.onChange}
                                    options={dropDownOptions.minutes}
                                    placeholder="Select"
                                    className="rounded-tr-none rounded-br-none "
                                    disabled={
                                      disabledAll || isPending || isEditPending
                                    }
                                  />
                                  <span className="text-xs border-1 shadow-xs border-gray-200 border-l-0 px-2 h-full bg-gray-200 rounded-tr-sm rounded-br-sm flex justify-center items-center">
                                    Mins
                                  </span>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    <FormField
                      control={form.control}
                      name="frequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm text-gray-500">
                            Frequency
                          </FormLabel>
                          <FormControl>
                            <Combobox
                              value={field.value}
                              onChange={field.onChange}
                              options={dropDownOptions.frequency}
                              placeholder="Select frequency"
                              disabled={
                                disabledAll || isPending || isEditPending
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="remindBefore"
                      render={({ field }) => (
                        <FormItem className="max-w-full">
                          <FormLabel className="text-sm text-gray-500">
                            Reminder
                          </FormLabel>
                          <FormControl>
                            <div className="grid grid-cols-[1fr_auto] max-w-full">
                              <Combobox
                                value={field.value}
                                onChange={field.onChange}
                                options={dropDownOptions.minutes}
                                placeholder="Select"
                                className="rounded-tr-none rounded-br-none "
                                disabled={
                                  disabledAll || isPending || isEditPending
                                }
                              />
                              <span className="text-xs border-1 shadow-xs border-gray-200 border-l-0 px-2 h-full bg-gray-200 rounded-tr-sm rounded-br-sm flex justify-center items-center">
                                Mins
                              </span>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </form>
            </Form>
            <p className="mt-auto text-sm text-gray-500 font-lato">
              Created on: {moment(data?.createdAt).format("LLL")}
            </p>
          </div>
        )}
        {!disabledAll && !isLoading && (
          <SheetFooter className="pt-4 px-4.5 pb-5 border-t max-sm:p-4">
            <div className="flex gap-3">
              <SheetClose className="cursor-pointer" asChild>
                <Button variant="outline" disabled={isEditPending || isPending}>
                  Cancel
                </Button>
              </SheetClose>
              <Button
                className="gap-2 ml-auto"
                onClick={form.handleSubmit(onSubmit)}
                isLoading={isPending || isEditPending}
              >
                {editing ? "Update" : "Add Task"}
              </Button>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
