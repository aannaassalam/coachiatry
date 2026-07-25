"use client";

import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { isBefore, startOfDay } from "date-fns";
import moment from "moment";
import * as React from "react";

interface DateTimePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
}

export function DateTimePicker({ value, onChange }: DateTimePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(value);
  const [time, setTime] = React.useState(
    value ? moment(value).format("HH:mm") : "08:00"
  );
  const today = startOfDay(new Date());

  React.useEffect(() => {
    if (date) {
      const [hours, minutes] = time.split(":").map(Number);
      const newDate = new Date(date);
      newDate.setHours(hours, minutes);
      onChange(newDate);
    } else {
      onChange(undefined);
    }
  }, [date, time, onChange]);

  return (
    <div className="w-auto p-3 space-y-3">
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        disabled={(date) => isBefore(date, today)}
      />
      <Input
        type="time"
        value={time}
        // Ignore the clear: the parent needs an hh:mm to build a Date from.
        onChange={(e) => e.target.value && setTime(e.target.value)}
      />
    </div>
  );
}
