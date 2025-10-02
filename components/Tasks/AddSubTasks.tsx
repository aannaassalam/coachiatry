"use client";
import { X } from "lucide-react";
import { Input } from "../ui/input";

import React from "react";
import assets from "@/json/assets";
import { Button } from "../ui/button";
import Image from "next/image";
import { Task } from "@/typescript/interface/tasks.interface";
import { Checkbox } from "../ui/checkbox";
import { cn } from "@/lib/utils";

interface SubtaskListProps {
  subtasks: string[];
  onChange: (subtasks: string[]) => void;
  selectedTask?: Task;
}

export default function SubtaskList({
  subtasks,
  onChange,
  selectedTask
}: SubtaskListProps) {
  const dummyTasks = [
    "This is a subtask 1",
    "This is a subtask 2",
    "This is a subtask 3"
  ];
  const handleAdd = () => {
    onChange([...subtasks, ""]);
  };

  const handleRemove = (index: number) => {
    const updated = subtasks.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleChange = (index: number, value: string) => {
    const updated = [...subtasks];
    updated[index] = value;
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-medium text-base text-gray-500 font-lato">
          Subtasks
        </p>
      </div>

      {subtasks.length === 0 && dummyTasks.length === 0 && (
        <p className="text-sm text-gray-500">No subtasks yet.</p>
      )}

      <div className="space-y-2">
        {selectedTask ? (
          <>
            {dummyTasks.map((subtask, index) => (
              <label
                key={index}
                className=" block p-2 border-1 border-gray-100 hover:bg-gray-100 transition-all duration-200 rounded-[8px] cursor-pointer font-lato font-normal text-gray-900"
              >
                <Checkbox
                  className={cn(
                    "w-4 h-4 mr-4 group-hover:mr-1 transition-all duration-200"
                  )}
                />
                {subtask}
              </label>
            ))}
          </>
        ) : (
          <>
            {subtasks.map((subtask, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={subtask}
                  onChange={(e) => handleChange(index, e.target.value)}
                  placeholder={`Subtask ${index + 1}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemove(index)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </>
        )}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAdd}
        className="text-gray-500 text-[12px]"
      >
        <Image src={assets.icons.plus} alt="add" width={14} height={14} />
        Add Subtask
      </Button>
    </div>
  );
}
