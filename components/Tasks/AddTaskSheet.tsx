"use client";

import { CalendarIcon, Download, X } from "lucide-react";
import React, { useEffect } from "react";
import { IoIosShareAlt } from "react-icons/io";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from "../ui/sheet";
import { Input } from "../ui/input";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "../ui/form";
import { Textarea } from "../ui/textarea";
import SubtaskList from "./AddSubTasks";
import { Combobox } from "../ui/combobox";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import moment from "moment";
import { cn } from "@/lib/utils";
import { DateTimePicker } from "../ui/date-time-picker";

export default function AddTaskSheet({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [subtasks, setSubtasks] = React.useState<string[]>([]);
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
    reminder: yup.string().default("")
  });

  const form = useForm<yup.InferType<typeof schema>>({
    resolver: yupResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      priority: "",
      category: "",
      dueDate: undefined,
      status: "",
      frequency: "",
      minutesDuration: "",
      hoursDuration: "",
      reminder: ""
    }
  });

  const onSubmit = (data: yup.InferType<typeof schema>) => {
    console.log({ ...data, subtasks });
  };
  const dropDownOptions = {
    priority: [
      {
        label: "Low",
        value: "low",
        bgColor: "bg-green-100",
        textColor: "text-green-600/90",
        dotColor: "bg-green-600/90"
      },
      {
        label: "Medium",
        value: "medium",
        bgColor: "bg-amber-200/40",
        textColor: "text-amber-600/80",
        dotColor: "bg-amber-600/80"
      },
      {
        label: "High",
        value: "high",
        bgColor: "bg-red-100/80",
        textColor: "text-red-600/80",
        dotColor: "bg-red-600/80"
      }
    ],
    category: [
      { label: "Health", value: "health" },
      { label: "Fitness", value: "fitness" },
      { label: "Goal", value: "goal" }
    ],
    status: [
      { label: "Todo", value: "todo" },
      { label: "Struggling", value: "struggling" },
      { label: "Overdue", value: "overdue" },
      { label: "Completed", value: "completed" }
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
  console.log(form.getValues("dueDate"));
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="lg:max-w-2xl gap-0">
        <SheetHeader className="border-b p-6 flex-row items-center justify-between">
          <SheetTitle className="font-archivo font-semibold text-xl text-gray-900">
            Add New Task
          </SheetTitle>
          <SheetClose className="cursor-pointer">
            <X />
          </SheetClose>
        </SheetHeader>
        <div className="flex-1 p-6 py-4 inline-flex flex-col overflow-auto">
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
                <SubtaskList subtasks={subtasks} onChange={setSubtasks} />
                <div className="grid grid-cols-2 space-y-2 gap-3 pt-4 mt-4 border-t border-gray-100 items-start">
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
                            isBadge={true}
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
                            options={dropDownOptions.category}
                            placeholder="Select category"
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
                                  "w-full justify-between text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
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
                            options={dropDownOptions.status}
                            placeholder="Select status"
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
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="reminder"
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
        </div>
        <SheetFooter className="pt-4 px-4.5 pb-5 border-t">
          <div className="flex gap-3">
            <Button variant="outline">Cancel</Button>
            <Button
              variant="outline"
              className="border-primary ml-auto py-2 px-2.5 text-primary"
            >
              <IoIosShareAlt className="size-5" />
            </Button>
            <Button className="gap-2">
              <Download />
              Download
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
