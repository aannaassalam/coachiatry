import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip";
import assets from "@/json/assets";
import AppLayout from "@/layouts/AppLayout";
import { cn } from "@/lib/utils";
import { FileText, ListFilter, Trash2 } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";

function Transcripts() {
  const [transcriptions] = useState([
    {
      name: "Any mechanical keyboard enthusiasts in design?",
      date: "August 7, 2017",
      id: 1
    },
    {
      name: "How to design a product that can grow itself 10x in year:",
      date: "August 7, 2017",
      id: 2
    },
    {
      name: "Monthly Ops Meeting - Ronnie <> Jared",
      date: "May 31, 2015",
      id: 3
    },
    {
      name: "Meeting Discussion and Updates",
      date: "December 29, 2012",
      id: 4
    },
    {
      name: "Experiment idea to help power users",
      date: "April 28, 2016",
      id: 5
    },
    {
      name: "How to design a product that can grow itself 10x in year:",
      date: "August 7, 2017",
      id: 6
    },
    {
      name: "Meeting Discussion and Updates",
      date: "December 29, 2012",
      id: 7
    }
  ]);
  const [selected, setSelected] = useState<number[]>([]);
  const handleSelect = (id: number) => {
    setSelected((prev) =>
      prev.includes(id)
        ? selected.filter((_data) => _data !== id)
        : [...prev, id]
    );
  };
  console.log(selected);
  return (
    <AppLayout>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl leading-7 tracking-[-3%] font-semibold text-gray-900 mb-2">
          Transcriptions
        </h1>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" className="gap-1.5 font-semibold">
            <ListFilter />
            Filter
          </Button>
          <Button>Upload Transcript or Record</Button>
        </div>
      </div>
      <Separator />
      <p className="font-lato font-semibold text-base mt-3">Meetings</p>
      <div className="flex flex-col gap-3 mt-4">
        {transcriptions.map((data, id) => {
          const isSelected = selected.includes(id);
          return (
            <label
              key={id}
              className="overflow-hidden flex cursor-pointer items-center justify-between w-full rounded-lg hover:bg-gray-50 border-1 border-gray-50 px-4 py-2.5 transition-colors group"
            >
              {/* Left section */}
              <div
                className={cn(
                  "flex items-center gap-3 relative left-[-35px] transition-all duration-200 group-hover:left-0",
                  isSelected && "left-0"
                )}
              >
                <Checkbox
                  className={cn(
                    "w-4 h-4 mr-4 group-hover:mr-1 transition-all duration-200",
                    isSelected && "mr-1"
                  )}
                  onClick={() => handleSelect(id)}
                />
                <Avatar className="size-8">
                  <AvatarImage src={assets.avatar} alt="AH" />
                  <AvatarFallback>AH</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium font-lato text-gray-900">
                    {data.name}
                  </span>
                  <span className="text-sm font-lato text-gray-500">
                    {data.date}
                  </span>
                </div>
              </div>
              {/* Right actions */}
              <div
                className={cn(
                  "flex items-center text-gray-500 relative right-[-100px] group-hover:right-0 transition-all duration-200",
                  isSelected && "right-0"
                )}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href={`/transcripts/${data.id}`}>
                      <Button
                        variant="ghost"
                        className="px-2 hover:text-gray-700"
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>View Transcript</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" className="px-2 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete</TooltipContent>
                </Tooltip>
              </div>
            </label>
          );
        })}
      </div>
    </AppLayout>
  );
}

export default Transcripts;
