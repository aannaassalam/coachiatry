"use client";

import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Calendar as Clock } from "lucide-react";
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

  // Generate time slots every 30 minutes
  const times = React.useMemo(() => {
    const slots: string[] = [];
    for (let h = 0; h < 24; h++) {
      for (const m of [0, 30]) {
        slots.push(moment({ hour: h, minute: m }).format("HH:mm"));
      }
    }
    return slots;
  }, []);

  return (
    <div className="w-auto p-3 space-y-3">
      <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <Select value={time} onValueChange={(val) => setTime(val)}>
          <SelectTrigger className="w-full">
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
      </div>
    </div>
  );
}
