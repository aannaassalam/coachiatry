"use client";
import React, { useEffect, useState } from "react";
import {
  //   Dialog,
  //   DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  //   DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog"; // import your wrapper
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "../ui/form";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { Button } from "@/components/ui/button";
import { Archivo, Lato } from "next/font/google";
import { IoMdClose } from "react-icons/io";
import { Separator } from "../ui/separator";
import { Textarea } from "../ui/textarea";
import { FaPen } from "react-icons/fa";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import moment from "moment";
import { Calendar } from "../ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../ui/select";
import { Combobox } from "../ui/combobox";
import Image from "next/image";
import assets from "@/json/assets";
import Link from "next/link";
const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo" });
const lato = Lato({
  display: "swap",
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["100", "300", "400", "700", "900"]
});

export default function ScheduleMessageModal({
  selectedMessage
}: {
  selectedMessage?: {
    message: string;
    time: string;
    date: Date;
    repeat: string;
  };
}) {
  const schema = yup.object().shape({
    message: yup.string().required("Message is required"),
    date: yup.date().required("Scheduled Date is required"),
    frequency: yup.string().default(""),
    time: yup.string().default("")
  });

  const form = useForm<yup.InferType<typeof schema>>({
    resolver: yupResolver(schema),
    defaultValues: {
      message: selectedMessage
        ? selectedMessage.message
        : "Hey Riya, just checking in on your journaling habit this week. Let me  know how it's going 😊  \nHave you had at least 3 deep-breath moments today?” ",
      date: selectedMessage ? selectedMessage.date : undefined,
      frequency: "",
      time: selectedMessage ? selectedMessage.time : "12:00"
    }
  });

  const onSubmit = (data: yup.InferType<typeof schema>) => {
    console.log({ ...data });
  };

  const [editMessage, setEditMessage] = useState(false);
  const times = React.useMemo(() => {
    const slots: string[] = [];
    for (let h = 0; h < 24; h++) {
      for (const m of [0, 30]) {
        slots.push(moment({ hour: h, minute: m }).format("HH:mm"));
      }
    }
    return slots;
  }, []);
  const frequency = [
    { label: "Daily", value: "daily" },
    { label: "Weekly", value: "weekly" },
    { label: "Monthly", value: "monthly" },
    { label: "Yearly", value: "yearly" }
  ];
  useEffect(() => {
    if (selectedMessage) {
      form.reset({
        message: selectedMessage.message,
        date: selectedMessage.date,
        frequency: selectedMessage.repeat, // or selectedMessage.frequency if you rename
        time: selectedMessage.time
      });
    }
  }, [selectedMessage, form]);
  return (
    <DialogContent
      className={`${archivo.variable} ${lato.variable} sm:max-w-xl p-0`}
      showCloseButton={false}
    >
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
                      <pre className="text-gray-900 font-lato text-sm whitespace-pre-line">
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
            <div className="grid grid-cols-3 gap-4 my-5">
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
                      Repeat
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
      <div className="flex items-center gap-2 px-4 pb-2 mt-2">
        <Image
          src={assets.icons.alertTriangle}
          width={18}
          height={18}
          alt="alert"
        />
        <p className="font-lato text-sm text-gray-600">
          This message will be sent automatically to <strong>Riya</strong> at
          the selected time.
        </p>
      </div>
      <Separator />
      {/* Footer */}
      <DialogFooter className="pb-4 px-4 flex items-center !justify-between">
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <div className="flex gap-2">
          <Link href="/chat/scheduled-messages">
            <Button variant="outline">View All Scheduled</Button>
          </Link>
          <Button>{selectedMessage ? "Update" : "Create"}</Button>
        </div>
      </DialogFooter>
    </DialogContent>
  );
}
