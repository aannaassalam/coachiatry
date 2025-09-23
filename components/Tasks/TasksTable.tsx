import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Checkbox } from "../ui/checkbox";
import { Task } from "@/typescript/interface/common.interface";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";
import { Ellipsis } from "lucide-react";
import moment from "moment";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import assets from "@/json/assets";
import Image from "next/image";
import StatusBox from "./StatusBox";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent
} from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
const CategoryTagColorMap: Record<string, Record<string, string>> = {
  Health: {
    bg: "bg-amber-200/40",
    text: "text-amber-600/80",
    dotColor: "bg-amber-600/80"
  },
  Fitness: {
    bg: "bg-green-100",
    text: "text-green-600/90",
    dotColor: "bg-green-600/90"
  },
  Goal: {
    text: "text-red-600/80",
    bg: "bg-red-100/80",
    dotColor: "bg-red-600/80"
  }
};
// const CategoryColor: Record<string, string> = {
//   Health: "text-[#F16A24]",
//   Fitness: "text-green-600/90",
//   Goal: "text-red-600/80"
// };
const SubTasksTable = ({
  subTasks
}: {
  subTasks: { title: string; isCompleted: boolean }[];
}) => {
  return subTasks.map((subTasks, idx) => (
    <TableRow
      key={idx}
      className="!h-[44px] !border-b-1 !border-gray-100 w-full hover:!bg-transparent"
    >
      <TableCell
        colSpan={7}
        className="font-medium text-sm leading-5 flex items-center font-lato tracking-[-0.05px]  pl-10 my-auto w-full"
      >
        <Checkbox className="bg-white mt-[-3px]" />
        <span className="ml-3 text-sm font-lato text-gray-600 font-medium">
          {subTasks.title}
        </span>
      </TableCell>
    </TableRow>
  ));
};
const RenderTableSortingIcon = () => {
  const [sortBy, setSortBy] = useState<"none" | "asc" | "dsc">("none");

  const handleClick = () => {
    if (sortBy === "none") setSortBy("asc");
    else if (sortBy === "asc") setSortBy("dsc");
    else setSortBy("none");
  };
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          onClick={handleClick}
          className={cn(
            "opacity-0 flex items-center justify-center rounded-sm p-[6px] ml-2 hover:bg-gray-100 transition-all duration-200 mr-2 group-hover:opacity-100",
            sortBy !== "none" && "bg-gray-100 opacity-100"
          )}
        >
          <Image
            src={
              sortBy === "none" ? assets.icons.tableSort : assets.icons.arrowUp
            }
            alt="sort"
            width={8}
            height={sortBy === "none" ? 12 : 9}
            className={cn(
              sortBy === "dsc" ? "rotate-180" : "rotate-0",
              "transition-all duration-200"
            )}
          />
        </div>
      </TooltipTrigger>
      <TooltipContent>
        {sortBy === "none"
          ? "Sort"
          : sortBy === "asc"
            ? "Ascending"
            : "Descending"}
      </TooltipContent>
    </Tooltip>
  );
};
function TasksTable({ tasks }: { tasks: Task[] }) {
  const [openTasksIndex, setOpenTasksIndex] = useState<number[]>([]);
  const [statusBoxIndex, setStatusBoxIndex] = useState<number>(-1);
  return (
    <div className="mt-2 w-full tasksTable">
      {tasks.length != 0 && (
        <Table
          style={{ overflow: "visible" }}
          className="w-full !overflow-visible table-container"
        >
          <TableHeader className="">
            <TableRow className="hover:bg-transparent !border-b-1 !border-gray-100">
              <TableHead className="text-xs text-gray-500 min-w-[200px] flex items-center group">
                Name
                <RenderTableSortingIcon />
              </TableHead>
              <TableHead className="text-xs text-gray-400 tracking-[-0.05px]">
                Assigned to
              </TableHead>
              <TableHead className="text-xs text-gray-400 tracking-[-0.05px]">
                Teams
              </TableHead>
              <TableHead className="text-xs text-gray-400 tracking-[-0.05px] flex items-center group">
                Due Date
                <RenderTableSortingIcon />
              </TableHead>
              <TableHead className="text-xs text-gray-400 tracking-[-0.05px]">
                Category
              </TableHead>
              <TableHead className="text-xs text-gray-400 tracking-[-0.05px] flex items-center group">
                Priority
                <RenderTableSortingIcon />
              </TableHead>
              <TableHead className="text-xs text-gray-400 tracking-[-0.05px] !w-[20px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task, index) => (
              <>
                <TableRow
                  key={index}
                  className="!h-[44px] hover:bg-gray-50 !border-b-1 !border-gray-100"
                >
                  <TableCell
                    className={cn(
                      "font-medium text-sm leading-5 flex items-center font-lato tracking-[-0.05px] relative",
                      task.subTasks.length <= 0 && "pl-[42px]"
                    )}
                  >
                    {task.subTasks && task.subTasks.length > 0 && (
                      <div
                        className="flex items-center justify-center rounded-sm p-2 hover:bg-gray-100 transition-all duration-200 mr-2"
                        onClick={() =>
                          setOpenTasksIndex((prev) => {
                            if (prev.includes(index)) {
                              return prev.filter((i) => i !== index);
                            } else {
                              return [...prev, index];
                            }
                          })
                        }
                      >
                        <Image
                          src={assets.icons.triangle}
                          width={10}
                          height={5}
                          alt="triangle"
                          className={cn(
                            openTasksIndex.includes(index)
                              ? "rotate-360"
                              : "rotate-270",
                            "transition-all duration-200 shrink-0"
                          )}
                        />
                      </div>
                    )}

                    <Popover>
                      <PopoverTrigger asChild>
                        <Image
                          src={assets.icons.taskCircle}
                          alt="task"
                          width={24}
                          height={24}
                          className="inline mr-3 cursor-pointer"
                          onClick={() =>
                            setStatusBoxIndex(
                              statusBoxIndex === index ? -1 : index
                            )
                          }
                        />
                      </PopoverTrigger>
                      <PopoverContent className="w-[245px] p-0 relative left-[111px]">
                        <StatusBox />
                      </PopoverContent>
                    </Popover>
                    {task.title}
                  </TableCell>
                  <TableCell className="tracking-[-0.05px]">
                    <div className="flex items-center gap-2">
                      <Avatar className="size-5">
                        <AvatarImage src={assets.avatar} alt="AH" />
                        <AvatarFallback>AH</AvatarFallback>
                      </Avatar>
                      <span className="font-lato font-medium text-sm text-gray-700">
                        {task.assignedTo}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="tracking-[-0.05px]">
                    <div className="flex -space-x-2">
                      <Avatar className="size-6 border-2 border-white">
                        <AvatarImage src={assets.avatar} alt="AH" />
                        <AvatarFallback>AH</AvatarFallback>
                      </Avatar>
                      <Avatar className="size-6 border-2 border-white">
                        <AvatarImage src={assets.avatar} alt="AH" />
                        <AvatarFallback>AH</AvatarFallback>
                      </Avatar>
                      <Avatar className="size-6 border-2 border-white">
                        <AvatarImage src={assets.avatar} alt="AH" />
                        <AvatarFallback>AH</AvatarFallback>
                      </Avatar>
                    </div>
                  </TableCell>
                  <TableCell className="font-lato text-sm text-gray-600 tracking-[-0.05px]">
                    {moment(task.dueDate).format("DD-MM-YYYY")}
                  </TableCell>
                  <TableCell className="tracking-[-0.05px]">
                    <Badge
                      className={cn(
                        "rounded-full py-0.5 px-2 flex items-center gap-1.5 font-archivo font-medium text-xs leading-4.5",
                        CategoryTagColorMap[task.category].bg,
                        CategoryTagColorMap[task.category].text
                      )}
                    >
                      <div
                        className={cn(
                          "size-1.5 rounded-full",
                          CategoryTagColorMap[task.category].dotColor
                        )}
                      ></div>
                      {task.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="tracking-[-0.05px]">
                    <Badge
                      className={cn(
                        "rounded-full py-0.5 px-2 flex items-center gap-1.5 font-archivo font-medium text-xs leading-4.5",
                        CategoryTagColorMap[task.category].bg,
                        CategoryTagColorMap[task.category].text
                      )}
                    >
                      <div
                        className={cn(
                          "size-1.5 rounded-full",
                          CategoryTagColorMap[task.category].dotColor
                        )}
                      ></div>
                      {task.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:bg-secondary"
                    >
                      <Ellipsis className="text-gray-500" />
                    </Button>
                  </TableCell>
                </TableRow>
                {task.subTasks &&
                  task.subTasks.length > 0 &&
                  openTasksIndex.includes(index) && (
                    <SubTasksTable subTasks={task.subTasks} />
                  )}
              </>
            ))}
          </TableBody>
        </Table>
      )}
      <Button
        variant="ghost"
        className="text-gray-400 text-[12px] mt-2"
        size="sm"
      >
        <Image src={assets.icons.plus} alt="add" width={14} height={14} />
        Add Task
      </Button>
    </div>
  );
}

export default TasksTable;
