"use client";

import { cn } from "@/lib/utils";
import { yupResolver } from "@hookform/resolvers/yup";
import { CalendarIcon, X } from "lucide-react";
import moment from "moment";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { Textarea } from "../ui/textarea";
import SubtaskList from "./AddSubTasks";

import { getAllCategories } from "@/external-api/functions/category.api";
import { getAllStatuses } from "@/external-api/functions/status.api";
import { addTask, editTask } from "@/external-api/functions/task.api";
import { Subtask, Task } from "@/typescript/interface/task.interface";
import { useMutation, useQueries } from "@tanstack/react-query";
import { FaBell } from "react-icons/fa";
import { Switch } from "../ui/switch";

const schema = yup.object().shape({
  title: yup.string().required("Title is required"),
  description: yup.string().required("Description is required"),
  priority: yup.string().required("Priority is required"),
  category: yup.string().required("Category is required"),
  dueDate: yup.date().required("Due date is required"),
  status: yup.string().required("Status is required"),
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
  selectedTask?: Task | null;
  editing?: boolean;
  predefinedStatus?: string | null;
  predefinedDueDate?: string | null;
  disabledAll?: boolean;
}) {
  const [
    { data: categories, isLoading: isCategoryLoading, isFetching },
    { data: statuses, isLoading: isStatusLoading, isFetching: isStatusFetching }
  ] = useQueries({
    queries: [
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
    },
    meta: {
      invalidateQueries: ["tasks"]
    }
  });

  const form = useForm<yup.InferType<typeof schema>>({
    resolver: yupResolver(schema),
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
    },
    disabled: isPending || isEditPending || disabledAll
  });

  useEffect(() => {
    form.reset({
      title: "",
      description: "",
      priority: "low",
      category: "",
      dueDate: predefinedDueDate ? new Date(predefinedDueDate) : undefined,
      status: predefinedStatus ?? "",
      frequency: "",
      minutesDuration: "",
      hoursDuration: "",
      remindBefore: "",
      subtasks: []
    });
  }, [predefinedStatus, predefinedDueDate, form]);

  const onSubmit = (data: yup.InferType<typeof schema>) => {
    const finalData = {
      ...data,
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
    if (selectedTask && editing) {
      editMutate({ task_id: selectedTask._id, data: finalData });
    } else {
      mutate(finalData);
    }
  };

  useEffect(() => {
    if (selectedTask && editing) {
      form.reset({
        title: selectedTask.title,
        description: selectedTask.description,
        priority: selectedTask.priority,
        category: selectedTask.category._id,
        dueDate: selectedTask.dueDate
          ? new Date(selectedTask.dueDate)
          : undefined,
        status: selectedTask.status._id,
        frequency: selectedTask.frequency || "",
        minutesDuration: selectedTask.taskDuration
          ? (selectedTask.taskDuration % 60).toString().padStart(2, "0")
          : "",
        hoursDuration: selectedTask.taskDuration
          ? Math.floor(selectedTask.taskDuration / 60)
              .toString()
              .padStart(2, "0")
          : "",
        remindBefore: selectedTask.remindBefore
          ? selectedTask.remindBefore.toString().padStart(2, "0")
          : "",
        subtasks: selectedTask.subtasks as Subtask[]
      });
    }
  }, [selectedTask, form, editing]);

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
            {disabledAll ? "View Task" : editing ? "Edit Task" : "Add New Task"}
          </SheetTitle>
          <SheetClose className="cursor-pointer">
            <X />
          </SheetClose>
        </SheetHeader>
        <div className="flex-1 p-6 py-4 inline-flex flex-col overflow-auto max-sm:p-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base text-gray-500">
                        Task Title
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Enter Task Title"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
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
                    render={({ field }) => (
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
                            disabled={disabledAll || isPending || isEditPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
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
                            disabled={disabledAll || isPending || isEditPending}
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
                            disabled={disabledAll || isPending || isEditPending}
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
                              <div className="grid grid-cols-[1fr_auto] max-w-max">
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
                              <div className="grid grid-cols-[1fr_auto] max-w-max">
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
                  {!selectedTask && (
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
                  )}
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

                <label className="text-sm cursor-pointer font-lato text-gray-500 flex justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    <FaBell />
                    Send reminder via chat
                  </div>
                  <Switch
                    disabled={disabledAll || isPending || isEditPending}
                  />
                </label>
              </div>
            </form>
          </Form>
        </div>
        {!disabledAll && (
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
