import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import assets from "@/json/assets";
import { cn } from "@/lib/utils";
import { Task } from "@/typescript/interface/task.interface";
import moment from "moment";
import Image from "next/image";
import React, { useState } from "react";
import { Badge } from "../../ui/badge";
import { Checkbox } from "../../ui/checkbox";
import { SmartAvatar } from "../../ui/smart-avatar";
import AddTaskSheet from "../AddTaskSheet";
import PriorityFlag from "../PriorityFlag";
import { RenderTableSortingIcon } from "../TasksTable";

export const SubTasksTable = ({
  subTasks
}: {
  subTasks: { _id: string; title: string; completed: boolean }[];
}) => {
  const [localCompleted] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(subTasks.map((s) => [s._id, s.completed ?? false]))
  );

  return subTasks.map((subTask) => (
    <TableRow
      key={subTask._id}
      className={cn(
        "!h-[44px] flex !border-b-1 !border-gray-100 w-full hover:!bg-transparent"
      )}
    >
      <TableCell
        colSpan={7}
        className="font-medium text-sm leading-5 font-lato tracking-[-0.05px] pl-10 my-auto w-full"
      >
        <label className="w-full flex items-center cursor-pointer select-none">
          <Checkbox
            checked={localCompleted[subTask._id]}
            className="bg-white mb-[-6px] cursor-pointer transition-all duration-150"
            disabled
          />
          <span
            className={cn("ml-3 text-sm font-lato text-gray-600 font-medium", {
              "line-through": localCompleted[subTask._id]
            })}
          >
            {subTask.title}
          </span>
        </label>
      </TableCell>
    </TableRow>
  ));
};

function SharedTasksTable({
  tasks,
  isLoading
}: {
  tasks: Task[];
  isLoading: boolean;
}) {
  const [openTasksIndex, setOpenTasksIndex] = useState<string[]>([]);
  const [statusBoxIndex, setStatusBoxIndex] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isOpen, setIsOpen] = useState(false);

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
                <RenderTableSortingIcon name="name" />
              </TableHead>
              <TableHead className="text-xs text-gray-400 tracking-[-0.05px]">
                Assigned to
              </TableHead>
              <TableHead className="text-xs text-gray-400 tracking-[-0.05px] flex items-center group">
                Due Date
                <RenderTableSortingIcon name="dueDate" />
              </TableHead>
              <TableHead className="text-xs text-gray-400 tracking-[-0.05px]">
                Category
              </TableHead>
              <TableHead className="text-xs text-gray-400 tracking-[-0.05px] flex items-center group">
                Priority
                {/* <RenderTableSortingIcon /> */}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, idx) => (
                  <TableRow
                    key={idx}
                    className="!h-[44px] bg-gray-50 animate-pulse"
                  />
                ))
              : tasks.map((task) => (
                  <React.Fragment key={task._id}>
                    <TableRow className="!h-[44px] hover:bg-gray-50 !border-b-1 !border-gray-100 cursor-pointer">
                      <TableCell
                        className={cn(
                          "font-medium text-sm leading-5 font-lato tracking-[-0.05px] relative",
                          task.subtasks &&
                            task.subtasks.length <= 0 &&
                            "pl-[42px]"
                        )}
                      >
                        <div className="flex items-center ">
                          {task.subtasks && task.subtasks.length > 0 && (
                            <div
                              className="flex items-center justify-center rounded-sm p-2 hover:bg-gray-100 transition-all duration-200 mr-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenTasksIndex((prev) => {
                                  if (prev.includes(task._id)) {
                                    return prev.filter((i) => i !== task._id);
                                  } else {
                                    return [...prev, task._id];
                                  }
                                });
                              }}
                            >
                              <Image
                                src={assets.icons.triangle}
                                width={10}
                                height={5}
                                alt="triangle"
                                className={cn(
                                  openTasksIndex.includes(task._id)
                                    ? "rotate-360"
                                    : "rotate-270",
                                  "transition-all duration-200 shrink-0"
                                )}
                              />
                            </div>
                          )}
                          <div
                            className={cn("size-4 rounded-full mr-3", {
                              "border-2 border-gray-300 border-dotted":
                                task.status.title === "Todo"
                            })}
                            style={{
                              backgroundColor:
                                task.status.title === "Todo"
                                  ? "white"
                                  : task.status.color.text
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setStatusBoxIndex(
                                statusBoxIndex === task._id ? null : task._id
                              );
                            }}
                          />
                          <p
                            className="flex-1"
                            onClick={() => {
                              setSelectedTask(task);
                              setIsOpen(true);
                            }}
                          >
                            {task.title}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="tracking-[-0.05px]">
                        <div className="flex items-center gap-2">
                          <SmartAvatar
                            src={task?.user?.photo}
                            name={task?.user?.fullName}
                            key={task?.user?.updatedAt}
                            className="size-5"
                          />
                          <span className="font-lato font-medium text-sm text-gray-700">
                            {task?.user?.fullName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-lato text-sm text-gray-600 tracking-[-0.05px]">
                        {moment(task.dueDate).format("DD-MM-YYYY")}
                      </TableCell>
                      <TableCell className="tracking-[-0.05px]">
                        <Badge
                          className="rounded-full py-0.5 px-2 flex items-center gap-1.5 font-archivo font-medium text-xs leading-4.5"
                          style={{
                            backgroundColor: task.category.color.bg,
                            color: task.category.color.text
                          }}
                          key={task.category?.title}
                        >
                          <div
                            className="size-1.5 rounded-full"
                            style={{
                              backgroundColor: task.category.color.text
                            }}
                          ></div>
                          {task.category?.title}
                        </Badge>
                      </TableCell>
                      <TableCell className="tracking-[-0.05px]">
                        <div className="flex gap-2 capitalize">
                          <PriorityFlag
                            priority={task.priority.toLocaleLowerCase()}
                          />
                          {task.priority}
                        </div>
                      </TableCell>
                    </TableRow>
                    {task.subtasks &&
                      task.subtasks.length > 0 &&
                      openTasksIndex.includes(task._id) && (
                        <SubTasksTable subTasks={task.subtasks} />
                      )}
                  </React.Fragment>
                ))}
          </TableBody>
        </Table>
      )}
      <AddTaskSheet
        open={isOpen}
        onOpenChange={(toggle) => {
          setIsOpen(toggle);
          setSelectedTask(null);
        }}
        selectedTask={selectedTask?._id}
        editing={!!selectedTask}
        disabledAll
      />
    </div>
  );
}

export default SharedTasksTable;
