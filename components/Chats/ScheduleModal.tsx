"use client";
import { Button } from "@/components/ui/button";
import {
  DialogClose,
  //   Dialog,
  //   DialogTrigger,
  DialogContent,
  //   DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"; // import your wrapper
import {
  editScheduleMessage,
  scheduleMessage
} from "@/external-api/functions/message.api";
import assets from "@/json/assets";
import { cn } from "@/lib/utils";
import { yupResolver } from "@hookform/resolvers/yup";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarIcon } from "lucide-react";
import moment from "moment";
import Image from "next/image";
import Link from "next/link";
import { parseAsString, useQueryState } from "nuqs";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { FaPen } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import * as yup from "yup";
import { Calendar } from "../ui/calendar";
import { Combobox } from "../ui/combobox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "../ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../ui/select";
import { Separator } from "../ui/separator";
import { Textarea } from "../ui/textarea";

const schema = yup.object().shape({
  message: yup.string().required("Message is required"),
  date: yup.date().required("Scheduled Date is required"),
  frequency: yup.string().required("Please select a frequency"),
  time: yup.string().default("")
});

// "Once" is a one-time send (backend `none`).
const frequency = [
  { label: "Once", value: "none" },
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" }
];

// Next full hour, so the default is always in the future (avoids scheduling in
// the past and sending immediately).
const defaultTime = () =>
  moment().add(1, "hour").startOf("hour").format("HH:mm");

export default function ScheduleMessageModal({
  message = "",
  selectedMessage,
  receiverName,
  onClose,
  editing
}: {
  message?: string;
  selectedMessage?: {
    _id: string;
    message: string;
    time: string;
    date: Date;
    repeat: string;
  };
  receiverName: string;
  onClose: () => void;
  editing?: boolean;
}) {
  const [room] = useQueryState("room", parseAsString.withDefault(""));
  const [editMessage, setEditMessage] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: scheduleMessage,
    onSuccess: () => {
      form.reset();
      onClose();
    },
    meta: {
      invalidateQueries: ["scheduled-messages"]
    }
  });

  const { mutate: edit, isPending: isEditPending } = useMutation({
    mutationFn: editScheduleMessage,
    onSuccess: () => {
      form.reset();
      onClose();
    },
    meta: {
      invalidateQueries: ["scheduled-messages"]
    }
  });

  const form = useForm<yup.InferType<typeof schema>>({
    resolver: yupResolver(schema),
    defaultValues: {
      message: selectedMessage ? selectedMessage.message : message,
      date: selectedMessage ? selectedMessage.date : new Date(),
      frequency: selectedMessage ? selectedMessage.repeat : "none",
      time: selectedMessage ? selectedMessage.time : defaultTime()
    },
    disabled: isPending || isEditPending
  });

  const onSubmit = (data: yup.InferType<typeof schema>) => {
    // Combine the picked date + time in the user's LOCAL timezone, then convert
    // to an absolute UTC instant. moment(string) parses in local time and
    // toISOString() emits UTC, so the same wall-clock the user sees is what
    // gets scheduled — regardless of the server's timezone.
    const scheduledAt = moment(
      `${moment(data.date).format("YYYY-MM-DD")} ${data.time || "00:00"}`,
      "YYYY-MM-DD HH:mm"
    ).toISOString();

    if (moment(scheduledAt).valueOf() <= Date.now()) {
      toast.error("Scheduled time must be in the future");
      return;
    }

    if (editing) {
      edit({
        message: data.message,
        frequency: data.frequency,
        scheduledAt,
        messageId: selectedMessage?._id || ""
      });
    } else {
      mutate({
        message: data.message,
        frequency: data.frequency,
        scheduledAt,
        chatId: room
      });
    }
  };

  const times = React.useMemo(() => {
    const slots: string[] = [];
    for (let h = 0; h < 24; h++) {
      for (const m of [0, 15, 30, 45]) {
        slots.push(moment({ hour: h, minute: m }).format("HH:mm"));
      }
    }
    return slots;
  }, []);

  useEffect(() => {
    if (selectedMessage) {
      form.reset({
        message: selectedMessage.message,
        date: selectedMessage.date,
        frequency: selectedMessage.repeat, // or selectedMessage.frequency if you rename
        time: selectedMessage.time
      });
      return;
    }
    if (message) {
      form.reset({
        message,
        date: new Date(),
        frequency: "none",
        time: defaultTime()
      });
    }
  }, [selectedMessage, form, message]);

  return (
    <DialogContent className={`sm:max-w-xl p-0`} showCloseButton={false}>
      <DialogHeader className="gap-0">
        <DialogTitle className="text-xl p-4 py-3 font-semibold font-archivo flex items-center justify-between">
          Schedule Message
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {}}
              className="hover:bg-secondary p-2 aspect-square"
            >
              <IoMdClose />
            </Button>
          </DialogClose>
        </DialogTitle>
        <Separator />
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="px-4 mt-1">
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-gray-600 font-lato">
                    Message Preview
                  </FormLabel>
                  {editMessage ? (
                    <>
                      <FormControl className="bg-[#F1F1F3] p-3 rounded-xl">
                        <Textarea
                          placeholder="Enter Message Here"
                          {...field}
                          className="outline-none focus-visible:ring-neutral-50"
                        />
                      </FormControl>
                      <Button
                        size="sm"
                        onClick={() => setEditMessage(false)}
                        className="ml-auto"
                      >
                        Save
                      </Button>
                    </>
                  ) : (
                    <div className="rounded-xl bg-[#F1F1F3] p-3 flex gap-2 items-start justify-between">
                      <pre className="text-gray-900 font-lato text-sm whitespace-pre-line wrap-anywhere">
                        {field.value}
                      </pre>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditMessage(true)}
                        className="hover:bg-secondary p-2 aspect-square"
                      >
                        <FaPen className="size-3 text-primary" />
                      </Button>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-3 gap-4 my-5 max-sm:grid-cols-1">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-gray-500">
                      Date
                    </FormLabel>
                    <FormControl>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            spacebetween
                            className={cn(
                              "w-full justify-between text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              moment(field.value).format("MMM DD, YYYY")
                            ) : (
                              <span className="font-medium">Select date</span>
                            )}
                            <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              field.onChange(date);
                            }}
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
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-gray-500">
                      Time
                    </FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={(val) => field.onChange(val)}
                      >
                        <SelectTrigger className="w-full !h-[42px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {times.map((t) => (
                            <SelectItem key={t} value={t}>
                              {moment(t, "HH:mm").format("hh:mm A")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-gray-500">
                      Repeat <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Combobox
                        value={field.value}
                        onChange={field.onChange}
                        options={frequency}
                        placeholder="Select frequency"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Separator />
          </div>
        </form>
      </Form>
      <div className="flex items-center gap-2 px-4 pb-2 mt-2 max-sm:m-0 max-sm:pb-0">
        <Image
          src={assets.icons.alertTriangle}
          width={18}
          height={18}
          alt="alert"
        />
        <p className="font-lato text-sm text-gray-600">
          This message will be sent automatically to{" "}
          <strong>{receiverName}</strong> at the selected time.
        </p>
      </div>
      <Separator />
      {/* Footer */}
      <DialogFooter className="pb-4 px-4 flex items-center !justify-between max-sm:flex-row">
        <DialogClose asChild disabled={isPending || isEditPending}>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <div className="flex gap-2">
          {!editing && (
            <Link href="/chat?tab=scheduled">
              <Button variant="outline">View All Scheduled</Button>
            </Link>
          )}
          <Button
            onClick={form.handleSubmit(onSubmit)}
            isLoading={isPending || isEditPending}
            center
          >
            {editing ? "Update" : "Create"}
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  );
}
