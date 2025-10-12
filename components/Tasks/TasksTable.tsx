import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip";
import {
  deleteTask,
  markSubtaskAsCompleted
} from "@/external-api/functions/task.api";
import assets from "@/json/assets";
import { cn } from "@/lib/utils";
import { queryClient } from "@/pages/_app";
import { Task } from "@/typescript/interface/task.interface";
import { useMutation } from "@tanstack/react-query";
import { Ellipsis, Pencil, Trash } from "lucide-react";
import moment from "moment";
import Image from "next/image";
import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs";
import React, { useState } from "react";
import DeleteDialog from "../DeleteDialog";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { SmartAvatar } from "../ui/smart-avatar";
import AddTaskSheet from "./AddTaskSheet";
import PriorityFlag from "./PriorityFlag";
import StatusBox from "./StatusBox";

export const SubTasksTable = ({
  subTasks,
  taskId
}: {
  subTasks: { _id: string; title: string; completed: boolean }[];
  taskId: string;
}) => {
  const [localCompleted, setLocalCompleted] = useState<Record<string, boolean>>(
    () => Object.fromEntries(subTasks.map((s) => [s._id, s.completed ?? false]))
  );

  const { mutate } = useMutation({
    mutationFn: markSubtaskAsCompleted,
    onMutate: async ({ task_id, subtask_id }) => {
      // Cancel ongoing queries to avoid overwrite
      await queryClient.cancelQueries({ queryKey: ["tasks"] });

      const previousResponse = queryClient.getQueryData<Task[]>(["tasks"]);

      // Update query cache immediately
      const updatedTasks = previousResponse?.map((task) =>
        task._id === task_id
          ? {
              ...task,
              subtasks: task?.subtasks?.map((subtask) =>
                subtask._id === subtask_id
                  ? { ...subtask, completed: !subtask.completed }
                  : subtask
              )
            }
          : task
      );

      queryClient.setQueryData(["tasks"], updatedTasks);
      return { previousResponse };
    }
  });

  const handleToggle = (id: string) => {
    setLocalCompleted((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));

    mutate({ task_id: taskId, subtask_id: id });
  };

  return subTasks.map((subTask) => (
    <TableRow
      key={subTask._id}
      className={cn(
        "!h-[44px] flex !border-b-1 !border-gray-100 w-full hover:!bg-transparent"
      )}
    >
      <TableCell
        colSpan={7}
        className="font-medium text-sm leading-5 flex items-center font-lato tracking-[-0.05px] pl-10 my-auto w-full"
      >
        <label
          className="w-full flex items-center cursor-pointer select-none"
          onClick={() => handleToggle(subTask._id)}
        >
          <Checkbox
            checked={localCompleted[subTask._id]}
            className="bg-white mb-[-6px] cursor-pointer transition-all duration-150"
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

export const RenderTableSortingIcon = ({ name }: { name: string }) => {
  const [sortBy, setSortBy] = useQueryState(
    "sort",
    parseAsArrayOf(parseAsString.withDefault("")).withDefault([])
  );

  const currentSortItem = Array.isArray(sortBy)
    ? sortBy.find((item) => typeof item === "string" && item.includes(name))
    : undefined;

  const handleClick = () => {
    setSortBy(
      (prev) => {
        const idx = prev.findIndex((item) => item.replace("-", "") === name);
        let next: string[];

        if (idx === -1) {
          next = [...prev, name]; // not sorted → ascending
        } else if (prev[idx] === name) {
          next = [...prev.slice(0, idx), `-${name}`, ...prev.slice(idx + 1)]; // ascending → descending
        } else {
          next = [...prev.slice(0, idx), ...prev.slice(idx + 1)]; // descending → remove sort
        }

        // only update if something actually changed
        if (
          prev.length === next.length &&
          prev.every((v, i) => v === next[i])
        ) {
          return prev;
        }

        return next;
      },
      { shallow: true }
    ); // 👈 if using nuqs, use shallow update to avoid extra pushState
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          onClick={handleClick}
          className={cn(
            "opacity-0 flex items-center justify-center rounded-sm p-[6px] ml-2 hover:bg-gray-100 transition-all duration-200 mr-2 group-hover:opacity-100 cursor-pointer",
            currentSortItem && "bg-gray-100 opacity-100"
          )}
        >
          <div className="relative w-[12px] h-[12px]">
            {/* Neutral Sort Icon */}
            <Image
              src={assets.icons.tableSort}
              alt="sort neutral"
              fill
              className={cn(
                "absolute transition-opacity duration-200",
                currentSortItem ? "opacity-0" : "opacity-100"
              )}
            />
            {/* Arrow Icon */}
            <Image
              src={assets.icons.arrowUp}
              alt="sort arrow"
              fill
              className={cn(
                "absolute transition-all duration-200 ease-in-out",
                !currentSortItem && "opacity-0 rotate-0",
                currentSortItem === name && "opacity-100 rotate-0",
                currentSortItem?.startsWith("-") && "opacity-100 rotate-180"
              )}
            />
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        {currentSortItem === undefined
          ? "Sort"
          : currentSortItem === name
            ? "Ascending"
            : "Descending"}
      </TooltipContent>
    </Tooltip>
  );
};

function TasksTable({
  tasks,
  isLoading
}: {
  tasks: Task[];
  isLoading: boolean;
}) {
  const [openTasksIndex, setOpenTasksIndex] = useState<string[]>([]);
  const [statusBoxIndex, setStatusBoxIndex] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedStatusId, setSelectedStatusId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: deleteTask,
    meta: {
      invalidateQueries: ["tasks"]
    }
  });

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
              <TableHead className="text-xs text-gray-400 tracking-[-0.05px] !w-[20px]"></TableHead>
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
                          "font-medium text-sm leading-5 flex items-center font-lato tracking-[-0.05px] relative",
                          task.subtasks &&
                            task.subtasks.length <= 0 &&
                            "pl-[42px]"
                        )}
                      >
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
                        <Popover>
                          <PopoverTrigger asChild>
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
                          </PopoverTrigger>
                          <PopoverContent className="w-[245px] p-0 relative left-[111px] max-sm:left-[50px]">
                            <StatusBox
                              taskId={task._id}
                              selectedStatus={task.status._id}
                            />
                          </PopoverContent>
                        </Popover>
                        <p
                          className="flex-1"
                          onClick={() => {
                            setSelectedTask(task);
                            setIsOpen(true);
                          }}
                        >
                          {task.title}
                        </p>
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
                            me
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
                      <TableCell className="tracking-[-0.05px] flex gap-2 capitalize">
                        <PriorityFlag
                          priority={task.priority.toLocaleLowerCase()}
                        />
                        {task.priority}
                      </TableCell>
                      <TableCell className="">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="hover:bg-secondary"
                            >
                              <Ellipsis className="text-gray-500" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="p-1 w-30"
                            collisionPadding={20}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              className="cursor-pointer flex items-center gap-2 w-full [&>span]:justify-start"
                              onClick={() => {
                                setSelectedTask(task);
                                setIsOpen(true);
                              }}
                            >
                              <Pencil />
                              Edit
                            </Button>
                            <DeleteDialog
                              onDelete={() => mutate(task._id)}
                              isLoading={isPending}
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                className="cursor-pointer flex items-center gap-2 w-full text-red-500 hover:text-red-500 hover:bg-red-50 [&>span]:justify-start"
                              >
                                <Trash />
                                Delete
                              </Button>
                            </DeleteDialog>
                          </PopoverContent>
                        </Popover>
                      </TableCell>
                    </TableRow>
                    {task.subtasks &&
                      task.subtasks.length > 0 &&
                      openTasksIndex.includes(task._id) && (
                        <SubTasksTable
                          subTasks={task.subtasks}
                          taskId={task._id}
                        />
                      )}
                  </React.Fragment>
                ))}
          </TableBody>
        </Table>
      )}
      <Button
        variant="ghost"
        className="text-gray-400 text-[12px] mt-2"
        size="sm"
        onClick={() => {
          setIsOpen(true);
          setSelectedStatusId(tasks[0]?.status?._id);
        }}
      >
        <Image src={assets.icons.plus} alt="add" width={14} height={14} />
        Add Task
      </Button>
      <AddTaskSheet
        open={isOpen}
        onOpenChange={(toggle) => {
          setIsOpen(toggle);
          setSelectedTask(null);
          setSelectedStatusId(null);
        }}
        selectedTask={selectedTask}
        editing={!!selectedTask}
        predefinedStatus={selectedStatusId}
      />
    </div>
  );
}

export default TasksTable;
