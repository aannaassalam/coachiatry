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
  assignToggle,
  deleteTask,
  getTask,
  markSubtaskAsCompleted
} from "@/external-api/functions/task.api";
import assets from "@/json/assets";
import { formatDateOrEmpty } from "@/lib/functions/_helpers.lib";
import { cn } from "@/lib/utils";
import { queryClient } from "@/pages/_app";
import { Task } from "@/typescript/interface/task.interface";
import { useMutation } from "@tanstack/react-query";
import { ChevronsUpDown, Ellipsis, Pencil, Trash } from "lucide-react";
import Image from "next/image";
import {
  parseAsArrayOf,
  parseAsJson,
  parseAsString,
  useQueryState
} from "nuqs";
import React, { useEffect, useState } from "react";
import AssigneeList from "./AssigneeList";
import ColumnSortControl from "./ColumnSortControl";
import { useRowVirtualizer } from "./useRowVirtualizer";
import DeleteDialog from "../DeleteDialog";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { SmartAvatar } from "../ui/smart-avatar";
import PriorityFlag from "./PriorityFlag";
import StatusBox from "./StatusBox";
import { useSession } from "next-auth/react";
import { Filter } from "@/typescript/interface/common.interface";
import { sanitizeFilters } from "@/lib/functions/_helpers.lib";
import { User } from "@/typescript/interface/user.interface";

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

  useEffect(() => {
    setLocalCompleted(
      Object.fromEntries(subTasks.map((s) => [s._id, s.completed ?? false]))
    );
  }, [subTasks]);

  const { mutate } = useMutation({
    mutationFn: markSubtaskAsCompleted,
    onMutate: async ({ task_id, subtask_id }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });

      // List queries are keyed with filters/sort, so patch every cached
      // ["tasks"] entry (an exact ["tasks"] write would be a no-op).
      const snapshots = queryClient.getQueriesData<Task[]>({
        queryKey: ["tasks"]
      });
      for (const [key, data] of snapshots) {
        if (!Array.isArray(data)) continue;
        queryClient.setQueryData<Task[]>(
          key,
          data.map((task) =>
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
          )
        );
      }
      return { snapshots };
    },
    onError: (_err, _vars, context) => {
      for (const [key, data] of context?.snapshots ?? []) {
        queryClient.setQueryData(key, data);
      }
    },
    meta: {
      invalidateQueries: ["tasks"]
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
        colSpan={8}
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
  isLoading,
  onAddTask
}: {
  tasks: Task[];
  isLoading: boolean;
  /** Lifted up to pages/tasks.tsx so there's a single shared AddTaskSheet. */
  onAddTask?: (statusId?: string) => void;
}) {
  const { data } = useSession();
  const [openTasksIndex, setOpenTasksIndex] = useState<string[]>([]);
  const [statusBoxIndex, setStatusBoxIndex] = useState<string | null>(null);
  const [openAssignFor, setOpenAssignFor] = useState<string | null>(null);

  const [, setSelectedTask] = useQueryState(
    "task",
    parseAsString.withDefault("")
  );

  // Each group is already a single status, so the Status column is only useful
  // (and only shown) when the list is grouped by something else.
  const [group] = useQueryState("group", parseAsString.withDefault("status"));
  const showStatus = group !== "status";
  const [values] = useQueryState<Filter[]>(
    "filters",
    parseAsJson<Filter[]>((v) =>
      Array.isArray(v) ? (v as Filter[]) : null
    ).withDefault([
      { selectedKey: "", selectedOperator: "", selectedValue: "" }
    ])
  );

  const validatedFilters = sanitizeFilters(values);

  const prefetchOnMouseEnter = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: ["task", id],
      queryFn: () => getTask(id),
      staleTime: 5 * 60 * 1000
    });
  };

  const { mutate, isPending } = useMutation({
    mutationFn: deleteTask,
    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: ["tasks", validatedFilters]
      });

      const previousResponse = queryClient.getQueryData<Task[]>([
        "tasks",
        validatedFilters
      ]);

      // Remove the deleted task from cache
      const updatedTasks = previousResponse?.filter((task) => task._id !== id);

      queryClient.setQueryData(["tasks", validatedFilters], updatedTasks);
      return { previousResponse };
    },
    meta: {
      invalidateQueries: ["tasks"]
    }
  });

  const { mutate: assign, isPending: isAssigning } = useMutation({
    mutationFn: ({
      taskId,
      coachId
    }: {
      taskId: string;
      coachId: string;
      coachUser?: User;
    }) => assignToggle({ taskId, coachId }),
    onMutate: async ({ taskId, coachId, coachUser }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });

      const snapshots = queryClient.getQueriesData<Task[]>({
        queryKey: ["tasks"]
      });

      const applyUpdate = (old: Task[] | undefined) =>
        old?.map((t) => {
          if (t._id !== taskId) return t;
          const current = Array.isArray(t.assignedTo)
            ? t.assignedTo
            : t.assignedTo
              ? [t.assignedTo as unknown as User]
              : [];
          const alreadyIn = current.some((u) => u._id === coachId);
          return {
            ...t,
            assignedTo: alreadyIn
              ? current.filter((u) => u._id !== coachId)
              : coachUser
                ? [...current, coachUser]
                : current
          };
        });

      for (const [key] of snapshots) {
        queryClient.setQueryData<Task[]>(key, applyUpdate);
      }

      return { snapshots };
    },
    onError: (_err, _vars, context) => {
      for (const [key, data] of context?.snapshots ?? []) {
        queryClient.setQueryData(key, data);
      }
    },
    onSuccess: () => {
      // Assigning may have created a matching status column for the assignee
      // (server-side) — refresh columns so a newly-added one shows up.
      queryClient.invalidateQueries({ queryKey: ["status"] });
    },
    meta: {
      invalidateQueries: ["tasks"]
    }
  });

  // Progressive rendering: only the first chunk of a large group mounts; the
  // rest load as the user scrolls (see useRowVirtualizer). Small groups render
  // in full (renderedTasks === tasks).
  const { renderedTasks, hasMore, sentinelRef } = useRowVirtualizer(tasks);
  const colCount = showStatus ? 8 : 7;

  return (
    <div className="mt-2 w-full tasksTable">
      {tasks.length != 0 && (
        <Table
          style={{ overflow: "visible" }}
          className="w-full !overflow-visible table-container"
        >
          <TableHeader className="">
            <TableRow className="hover:bg-transparent !border-b-1 !border-gray-100">
              <TableHead className="text-xs text-gray-500 min-w-[200px]">
                <ColumnSortControl columnKey="name" />
              </TableHead>
              <TableHead className="text-xs text-gray-400 tracking-[-0.05px]">
                <ColumnSortControl columnKey="assignedTo" />
              </TableHead>
              <TableHead className="text-xs text-gray-400 tracking-[-0.05px]">
                <ColumnSortControl columnKey="dueDate" />
              </TableHead>
              <TableHead className="text-xs text-gray-400 tracking-[-0.05px]">
                <ColumnSortControl columnKey="owner" />
              </TableHead>
              <TableHead className="text-xs text-gray-400 tracking-[-0.05px]">
                <ColumnSortControl columnKey="category" />
              </TableHead>
              <TableHead className="text-xs text-gray-400 tracking-[-0.05px]">
                <ColumnSortControl columnKey="priority" />
              </TableHead>
              {showStatus && (
                <TableHead className="text-xs text-gray-400 tracking-[-0.05px]">
                  <ColumnSortControl columnKey="status" />
                </TableHead>
              )}
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
              : (
                <>
                  {renderedTasks.map((task) => (
                  <React.Fragment key={task._id}>
                    <TableRow
                      className="!h-[44px] hover:bg-gray-50 !border-b-1 !border-gray-100 cursor-pointer"
                      onClick={() => setSelectedTask(task._id)}
                      onMouseEnter={() => prefetchOnMouseEnter(task._id)}
                    >
                      <TableCell
                        className={cn(
                          "font-medium text-sm leading-5 font-lato tracking-[-0.05px] relative",
                          task.subtasks &&
                            task.subtasks.length <= 0 &&
                            "pl-[42px] max-sm:pl-2"
                        )}
                      >
                        <div className="flex items-center">
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
                                className={cn(
                                  "size-4 rounded-full mr-3 flex items-center justify-center",
                                  {
                                    "border-2 border-gray-300 border-dotted":
                                      task.status.title === "Todo"
                                  }
                                )}
                                style={{
                                  backgroundColor:
                                    task.status.title === "Todo"
                                      ? "white"
                                      : task.status.color.text
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setStatusBoxIndex(
                                    statusBoxIndex === task._id
                                      ? null
                                      : task._id
                                  );
                                }}
                              >
                                <div className="size-3.5 rounded-full border-1 border-white bg-transparent" />
                              </div>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-[245px] p-0 relative left-[111px] max-sm:left-[50px]"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <StatusBox
                                taskId={task._id}
                                selectedStatus={task.status._id}
                              />
                            </PopoverContent>
                          </Popover>
                          <p className="flex-1">{task.title}</p>
                        </div>
                      </TableCell>
                      <TableCell
                        className="tracking-[-0.05px]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {(() => {
                          const currentUserId = data?.user?._id;
                          const isOwner = task.user?._id === currentUserId;
                          const assignees = Array.isArray(task.assignedTo)
                            ? task.assignedTo
                            : task.assignedTo
                              ? [task.assignedTo as unknown as User]
                              : [];
                          // Anyone in the owner's management hierarchy can edit
                          // — in the personal list that's the owner plus anyone
                          // currently assigned (assignees always come from the
                          // owner's tree). The backend re-validates on toggle.
                          const isAssignee = assignees.some(
                            (u) => u._id === currentUserId
                          );
                          const canEdit = isOwner || isAssignee;

                          const assigneeDisplay = (
                            <div className="flex items-center gap-2">
                              {assignees.length === 0 ? (
                                <span className="font-lato font-medium text-sm text-gray-400">
                                  Unassigned
                                </span>
                              ) : assignees.length === 1 ? (
                                <>
                                  <SmartAvatar
                                    src={assignees[0]?.photo}
                                    name={assignees[0]?.fullName}
                                    key={assignees[0]?.updatedAt}
                                    className="size-5"
                                    textSize="text-[10px]"
                                  />
                                  <span className="font-lato font-medium text-sm text-gray-700">
                                    {assignees[0]?._id === data?.user?._id
                                      ? "me"
                                      : assignees[0]?.fullName}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <div className="flex items-center">
                                    {assignees.slice(0, 2).map((u, i) => (
                                      <div
                                        key={u._id}
                                        className={cn(i > 0 && "-ml-2")}
                                      >
                                        <SmartAvatar
                                          src={u.photo}
                                          name={u.fullName}
                                          key={u.updatedAt}
                                          className="size-5 ring-1 ring-white"
                                          textSize="text-[10px]"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                  <span className="font-lato font-medium text-sm text-gray-700">
                                    {assignees.length} people
                                  </span>
                                </>
                              )}
                              {canEdit && (
                                <ChevronsUpDown size={14} color="#777" />
                              )}
                            </div>
                          );

                          if (canEdit) {
                            return (
                              <Popover
                                open={openAssignFor === task._id}
                                onOpenChange={(open) =>
                                  setOpenAssignFor(open ? task._id : null)
                                }
                              >
                                <PopoverTrigger asChild>
                                  <button
                                    className="[all:unset] !flex !items-center !gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                                    disabled={isAssigning}
                                  >
                                    {assigneeDisplay}
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-72 p-0">
                                  <AssigneeList
                                    taskId={task._id}
                                    assignees={assignees}
                                    currentUserId={currentUserId}
                                    onToggle={(u) =>
                                      assign({
                                        taskId: task._id,
                                        coachId: u._id,
                                        coachUser: u
                                      })
                                    }
                                  />
                                </PopoverContent>
                              </Popover>
                            );
                          }

                          // Non-owner: grayed out, hover tooltip shows assignees
                          return (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-2 opacity-50 cursor-not-allowed">
                                  {assigneeDisplay}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="p-2">
                                {assignees.length === 0 ? (
                                  <p className="text-xs">No one assigned</p>
                                ) : (
                                  <div className="space-y-1.5">
                                    {assignees.map((u) => (
                                      <div
                                        key={u._id}
                                        className="flex items-center gap-2"
                                      >
                                        <SmartAvatar
                                          src={u.photo}
                                          name={u.fullName}
                                          className="size-4"
                                          textSize="text-[8px]"
                                        />
                                        <span className="text-xs">
                                          {u._id === data?.user?._id
                                            ? "me"
                                            : u.fullName}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="font-lato text-sm text-gray-600 tracking-[-0.05px]">
                        {formatDateOrEmpty(task.dueDate, "DD-MM-YYYY") || "-"}
                      </TableCell>
                      <TableCell className="tracking-[-0.05px]">
                        <div className="flex items-center gap-2">
                          <SmartAvatar
                            src={task.user?.photo}
                            name={task.user?.fullName}
                            key={task.user?.updatedAt}
                            className="size-5"
                            textSize="text-[10px]"
                          />
                          <span className="font-lato font-medium text-sm text-gray-700">
                            {task.user?._id === data?.user?._id
                              ? "me"
                              : task.user?.fullName || "-"}
                          </span>
                        </div>
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
                      <TableCell className="tracking-[-0.05px capitalize">
                        <div className="flex items-center gap-2">
                          <PriorityFlag
                            priority={task.priority.toLocaleLowerCase()}
                          />
                          {task.priority}
                        </div>
                      </TableCell>
                      {showStatus && (
                        <TableCell className="tracking-[-0.05px]">
                          <Badge
                            className="rounded-full py-0.5 px-2 font-archivo font-medium text-xs leading-4.5"
                            style={{
                              backgroundColor: task.status.color.bg,
                              color: task.status.color.text
                            }}
                          >
                            {task.status.title}
                          </Badge>
                        </TableCell>
                      )}
                      <TableCell
                        className=""
                        onClick={(e) => e.stopPropagation()}
                      >
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
                              onClick={() => setSelectedTask(task._id)}
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
                  {hasMore && (
                    <tr ref={sentinelRef} aria-hidden>
                      <td
                        colSpan={colCount}
                        style={{ height: 1, padding: 0, border: 0 }}
                      />
                    </tr>
                  )}
                </>
              )}
          </TableBody>
        </Table>
      )}
      <Button
        variant="ghost"
        className="text-gray-400 text-[12px] mt-2"
        size="sm"
        onClick={() => onAddTask?.(tasks[0]?.status?._id)}
      >
        <Image src={assets.icons.plus} alt="add" width={14} height={14} />
        Add Task
      </Button>
    </div>
  );
}

export default TasksTable;
