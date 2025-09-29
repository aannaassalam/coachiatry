import { cn } from "@/lib/utils";
import React from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Ellipsis, Plus } from "lucide-react";
import { Checkbox } from "../ui/checkbox";
import Image from "next/image";
import assets from "@/json/assets";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import PriorityFlag from "./PriorityFlag";
const TaskCard = () => {
  return (
    <div className="bg-white rounded-[8px] p-3.5 flex items-start overflow-hidden transition-all duration-200 group border-1 hover:border-primary">
      <Checkbox
        className={cn(
          "w-4 h-4 mr-4 -ml-8 transition-all duration-200 mt-1 group-hover:ml-0"
          //   isSelected && "mr-1"
        )}
        // onClick={() => handleSelect(id)}
      />
      <div className="flex flex-col gap-1">
        <p className="font-medium font-lato flex justify-between items-start">
          Journal One Positive Thought
          <Button
            variant="ghost"
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-all duration-200"
          >
            <Ellipsis />
          </Button>
        </p>
        <div className="flex mt-2 items-center gap-2">
          <div className="flex gap-2 items-center">
            <Image
              src={assets.icons.calendar}
              width={16}
              height={16}
              alt="calendar w-3 h-3"
            />
            <span className="text-xs">Start: Nov 12</span>
          </div>
          <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
          <div className="flex gap-1 items-center">
            <Avatar className="size-5">
              <AvatarImage src={assets.avatar} alt="AH" />
              <AvatarFallback>AH</AvatarFallback>
            </Avatar>
            <span className="text-xs text-gray-900 font-lato font-medium">
              John Nick
            </span>
          </div>
        </div>
        <div className="flex text-sm mt-2 gap-1">
          <PriorityFlag priority="high" />
          High
        </div>
      </div>
    </div>
  );
};
function WeekView() {
  const days = [
    {
      title: "Monday",
      titleColor: "text-orange-600/80",
      bgColor: "bg-orange-200/60",
      accentColor: "bg-orange-600/80"
    },
    {
      title: "Tuesday",
      titleColor: "text-[#9300A9]",
      bgColor: "bg-[#9300A91F]",
      accentColor: "bg-[#9300A9]"
    },
    {
      title: "Wednesday",
      titleColor: "text-[#4302E8]",
      bgColor: "bg-[#4302E81F]",
      accentColor: "bg-[#4302E8]"
    },
    {
      title: "Thursday",
      titleColor: "text-[#026AE8]",
      bgColor: "bg-[#026AE81F]",
      accentColor: "bg-[#026AE8]"
    },
    {
      title: "Friday",
      titleColor: "text-orange-600/80",
      bgColor: "bg-orange-200/60",
      accentColor: "bg-orange-600/80"
    },
    {
      title: "Saturday",
      titleColor: "text-[#9300A9]",
      bgColor: "bg-[#9300A91F]",
      accentColor: "bg-[#9300A9]"
    },
    {
      title: "Sunday",
      titleColor: "text-[#4302E8]",
      bgColor: "bg-[#4302E81F]",
      accentColor: "bg-[#4302E8]"
    }
  ];
  return (
    <div className="flex max-w-[74.5vw] gap-4 py-4 overflow-x-auto h-full scrollbar-hide">
      {days.map((day, index) => (
        <div
          className="p-3 bg-gray-100 rounded-[12px] flex flex-col gap-2.5 w-[312px] flex-shrink-0"
          key={index}
        >
          <div
            className={cn(
              "p-1 pl-3 rounded-sm inline-flex items-center gap-2.5 w-max",
              day.bgColor
            )}
          >
            <h5 className={cn("text-sm font-medium leading-5", day.titleColor)}>
              {day.title}
            </h5>
            <Badge variant="counter" className={day.accentColor}>
              2
            </Badge>
          </div>
          <Button
            variant="ghost"
            className="w-full bg-white hover:bg-white text-gray-500 group"
          >
            <Plus className="text-gray-500 group-hover:text-black" />
            Add Task
          </Button>
          {[1, 1, 1, 1].map((_, idx) => (
            <TaskCard key={idx} />
          ))}
        </div>
      ))}
    </div>
  );
}

export default WeekView;
