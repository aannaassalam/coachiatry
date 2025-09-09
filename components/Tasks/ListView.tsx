import React, { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "../ui/collapsible";
import Image from "next/image";
import assets from "@/json/assets";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import TasksTable from "./TasksTable";

function ListView() {
  const [tasks, setTasks] = useState([
    {
      title: "Complete 1500 steps",
      subTasks: [
        {
          title: "Go to the Gym",
          isCompleted: false
        },
        {
          title: "Cook Dinner",
          isCompleted: false
        }
      ],
      dueDate: new Date(),
      priority: "Medium",
      status: "Todo",
      assignedTo: "John Nick",
      category: "Health"
    },
    {
      title: "This is a very Hard Task",
      subTasks: [
        {
          title: "Go to the Gym",
          isCompleted: false
        },
        {
          title: "Cook Dinner",
          isCompleted: false
        }
      ],
      dueDate: new Date(),
      priority: "Low",
      status: "Todo",
      assignedTo: "John Nick",
      category: "Fitness"
    },
    {
      title: "This is an Overdue Hard Task",
      subTasks: [
        {
          title: "Go to the Gym",
          isCompleted: false
        },
        {
          title: "Cook Dinner",
          isCompleted: false
        }
      ],
      dueDate: new Date(),
      priority: "High",
      status: "Todo",
      assignedTo: "John Nick",
      category: "Goal"
    },
    {
      title: "This is a very Hard Task",
      subTasks: [
        {
          title: "Go to the Gym",
          isCompleted: false
        },
        {
          title: "Cook Dinner",
          isCompleted: false
        }
      ],
      dueDate: new Date(),
      priority: "Low",
      status: "Struggling",
      assignedTo: "John Nick",
      category: "Fitness"
    },
    {
      title: "This is an Overdue Hard Task",
      subTasks: [
        {
          title: "Go to the Gym",
          isCompleted: false
        },
        {
          title: "Cook Dinner",
          isCompleted: false
        }
      ],
      dueDate: new Date(),
      priority: "High",
      status: "Overdue",
      assignedTo: "John Nick",
      category: "Goal"
    }
  ]);
  const statusList = [
    {
      title: "Todo",
      titleColor: "text-primary",
      bgColor: "bg-gray-200",
      accentColor: "bg-primary"
    },
    {
      title: "Struggling",
      titleColor: "text-orange-600/80",
      bgColor: "bg-orange-200/60",
      accentColor: "bg-orange-600/80"
    },
    {
      title: "Overdue",
      titleColor: "text-red-600/80",
      bgColor: "bg-red-100/80",
      accentColor: "bg-red-600/80"
    },
    {
      title: "Completed",
      titleColor: "text-green-600/90",
      bgColor: "bg-green-100",
      accentColor: "bg-green-600/90"
    }
  ];
  const [openIndexes, setOpenIndexes] = useState<number[]>([]);

  const handleToggle = (idx: number, isOpen: boolean) => {
    setOpenIndexes((prev) =>
      isOpen ? [...prev, idx] : prev.filter((i) => i !== idx)
    );
  };
  return (
    <div className="py-4 flex flex-col gap-6">
      {statusList.map((status, id) => (
        <Collapsible
          key={id}
          open={openIndexes.includes(id)}
          onOpenChange={(isOpen) => handleToggle(id, isOpen)}
          className="w-full"
        >
          <div className="flex items-center gap-2">
            <CollapsibleTrigger className="flex items-center justify-center rounded-sm p-2 hover:bg-gray-100 transition-all duration-200">
              <Image
                src={assets.icons.triangle}
                width={10}
                height={5}
                alt="triangle"
                className={cn(
                  openIndexes.includes(id) ? "rotate-360" : "rotate-270",
                  "transition-all duration-200"
                )}
              />
            </CollapsibleTrigger>
            <div
              className={cn(
                "p-1 pl-3 rounded-sm inline-flex items-center gap-2.5",
                status.bgColor
              )}
            >
              <h5
                className={cn(
                  "text-sm font-medium leading-5",
                  status.titleColor
                )}
              >
                {status.title}
              </h5>
              <Badge variant="counter" className={status.accentColor}>
                {tasks.filter((task) => task.status === status.title).length}
              </Badge>
            </div>
            <Button
              variant="ghost"
              className="text-gray-400 text-[12px] self-end"
              size="sm"
            >
              <Image src={assets.icons.plus} alt="add" width={14} height={14} />
              Add Task
            </Button>
          </div>
          <CollapsibleContent className="pl-7 data-[state=closed]:animate-slideUp data-[state=open]:animate-slideDown">
            <TasksTable
              tasks={tasks.filter((task) => task.status === status.title)}
            />
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
}

export default ListView;
