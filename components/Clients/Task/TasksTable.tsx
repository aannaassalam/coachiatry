import AssigneeList from "@/components/Tasks/AssigneeList";
import ColumnSortControl from "@/components/Tasks/ColumnSortControl";
import { useTableLayout } from "@/components/Tasks/TableLayoutContext";
import {
  ACTIONS_COLUMN_WIDTH,
  ColumnKey,
  getTaskTableGeometry
} from "@/components/Tasks/tableColumns";
import { useRowVirtualizer } from "@/components/Tasks/useRowVirtualizer";
import PriorityFlag from "@/components/Tasks/PriorityFlag";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  assignToggle,
  deleteTask,
  getTask,
  markSubtaskAsCompleted
} from "@/external-api/functions/task.api";
import assets from "@/json/assets";
import { cn } from "@/lib/utils";
import { queryClient } from "@/pages/_app";
import { Task } from "@/typescript/interface/task.interface";
import { User } from "@/typescript/interface/user.interface";
import { useMutation } from "@tanstack/react-query";
import { ChevronsUpDown, Ellipsis, Pencil, Trash } from "lucide-react";
import { useSession } from "next-auth/react";
import moment from "moment";
import Image from "next/image";
import { parseAsJson, parseAsString, useQueryState } from "nuqs";
import React, { useEffect, useState } from "react";
import DeleteDialog from "../../DeleteDialog";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Checkbox } from "../../ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { SmartAvatar } from "../../ui/smart-avatar";
import AddTaskSheet from "./AddTaskSheet";
import StatusBox from "./StatusBox";
import { useParams } from "next/navigation";
import { Filter } from "@/typescript/interface/common.interface";
import { sanitizeFilters } from "@/lib/functions/_helpers.lib";

export const SubTasksTable = ({
  subTasks,
  taskId,
  colSpan
}: {
  subTasks: { _id: string; title: string; completed: boolean }[];
  taskId: string;
  colSpan: number;
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

      // List queries are keyed with filters/sort/userId, so patch every cached
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
        colSpan={colSpan}
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

function TasksTable({
  tasks,
  isLoading
}: {
  tasks: Task[];
  isLoading: boolean;
}) {
  const { userId } = useParams();
  const { data: session } = useSession();
  const currentUserId = session?.user?._id;
  const [openTasksIndex, setOpenTasksIndex] = useState<string[]>([]);
  const [statusBoxIndex, setStatusBoxIndex] = useState<string | null>(null);
  const [openAssignFor, setOpenAssignFor] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useQueryState(
    "task",
    parseAsString.withDefault("")
  );
  const [selectedStatusId, setSelectedStatusId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

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

  // Column widths / visibility, shared across every group's table.
  const { visibleColumns, widthStyle, hasCustomWidths } = useTableLayout();
  const columns = visibleColumns.filter(
    (key) => key !== "status" || showStatus
  );
  const { colSpan, colStyle, tableMinWidth, tableWidth } = getTaskTableGeometry(
    columns,
    widthStyle,
    // Fill the container until the user sets widths of their own.
    { fill: !hasCustomWidths }
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
        queryKey: ["tasks", validatedFilters, userId]
      });

      const previousResponse = queryClient.getQueryData<Task[]>([
        "tasks",
        validatedFilters,
        userId
      ]);

      // Remove the deleted task from cache
      const updatedTasks = previousResponse?.filter((task) => task._id !== id);

      queryClient.setQueryData(
        ["tasks", validatedFilters, userId],
        updatedTasks
      );
      return { previousResponse };
    },
    meta: {
      invalidateQueries: ["tasks", validatedFilters, userId]
    }
  });

  const tasksKey = ["tasks", validatedFilters, userId];

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
      await queryClient.cancelQueries({ queryKey: tasksKey });

      const previousResponse = queryClient.getQueryData<Task[]>(tasksKey);

      const updatedTasks = previousResponse?.map((t) => {
        if (t._id !== taskId) return t;
        const current = Array.isArray(t.assignedTo) ? t.assignedTo : [];
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

      queryClient.setQueryData(tasksKey, updatedTasks);
      return { previousResponse };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(tasksKey, context?.previousResponse);
    },
    onSuccess: () => {
      // Assigning may have created a matching status column for the assignee
      // (server-side) — refresh columns so a newly-added one shows up.
      queryClient.invalidateQueries({ queryKey: ["status"] });
    },
    meta: {
      invalidateQueries: tasksKey
    }
  });

  // Progressive rendering: only the first chunk of a large group mounts; the
  // rest load as the user scrolls. Small groups render in full.
  const { renderedTasks, hasMore, sentinelRef } = useRowVirtualizer(tasks);

  /**
   * One cell per column key. Driving the body off the same ordered key list as
   * the header is what makes hiding a column a single-source change.
   */
  const renderCell = (key: ColumnKey, task: Task) => {
    switch (key) {
      case "name":
        return (
          <TableCell
            key={key}
            className={cn(
              "font-medium text-sm leading-5 font-lato tracking-[-0.05px] relative overflow-hidden",
              task.subtasks && task.subtasks.length <= 0 && "pl-[42px]"
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
                      "size-4 shrink-0 rounded-full mr-3 flex items-center justify-center",
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
                        statusBoxIndex === task._id ? null : task._id
                      );
                    }}
                  >
                    <div className="h-3.5 w-3.5 rounded-full border-1 border-white bg-transparent" />
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
              <p
                className="flex-1 truncate"
                title={task.title}
                onClick={() => {
                  setSelectedTask(task._id);
                  setIsOpen(true);
                }}
              >
                {task.title}
              </p>
            </div>
          </TableCell>
        );

      case "owner":
        return (
          <TableCell key={key} className="tracking-[-0.05px] overflow-hidden">
            <div className="flex min-w-0 items-center gap-2">
              <SmartAvatar
                src={task?.user?.photo}
                name={task?.user?.fullName}
                key={task?.user?.updatedAt}
                className="size-5 shrink-0"
                textSize="text-[10px]"
              />
              <span className="font-lato font-medium text-sm text-gray-700 truncate">
                {task?.user?.fullName ?? "-"}
              </span>
            </div>
          </TableCell>
        );

      case "assignedTo":
        return (
          <TableCell key={key} className="tracking-[-0.05px] overflow-hidden">
            {(() => {
              const assignees = Array.isArray(task.assignedTo)
                ? task.assignedTo
                : [];

              return (
                // Assignees — editable by the owner's management
                // hierarchy (coach / manager / admin). The backend
                // re-validates on toggle.
                <Popover
                  open={openAssignFor === task._id}
                  onOpenChange={(open) =>
                    setOpenAssignFor(open ? task._id : null)
                  }
                >
                  <PopoverTrigger asChild>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      disabled={isAssigning}
                      className="[all:unset] !flex !items-center !gap-2 !max-w-full disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {assignees.length === 0 ? (
                        <span className="font-lato font-medium text-sm text-gray-400">
                          Unassigned
                        </span>
                      ) : assignees.length === 1 ? (
                        <div className="flex min-w-0 items-center gap-2">
                          <SmartAvatar
                            src={assignees[0]?.photo}
                            name={assignees[0]?.fullName}
                            key={assignees[0]?.updatedAt}
                            className="size-5 shrink-0"
                            textSize="text-[10px]"
                          />
                          <span className="font-lato font-medium text-sm text-gray-700 truncate">
                            {assignees[0]?._id === currentUserId
                              ? "me"
                              : assignees[0]?.fullName}
                          </span>
                        </div>
                      ) : (
                        <div className="flex min-w-0 items-center gap-2">
                          <div className="flex shrink-0 items-center">
                            {assignees.slice(0, 2).map((u, i) => (
                              <div key={u._id} className={cn(i > 0 && "-ml-2")}>
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
                          <span className="font-lato font-medium text-sm text-gray-700 truncate">
                            {assignees.length} people
                          </span>
                        </div>
                      )}
                      <ChevronsUpDown
                        size={14}
                        color="#777"
                        className="shrink-0"
                      />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-72 p-0"
                    onClick={(e) => e.stopPropagation()}
                  >
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
            })()}
          </TableCell>
        );

      case "dueDate":
        return (
          <TableCell
            key={key}
            className="font-lato text-sm text-gray-600 tracking-[-0.05px]"
          >
            {task.dueDate ? moment(task.dueDate).format("DD-MM-YYYY") : "-"}
          </TableCell>
        );

      case "category":
        return (
          <TableCell key={key} className="tracking-[-0.05px] overflow-hidden">
            <Badge
              className="max-w-full rounded-full py-0.5 px-2 flex items-center gap-1.5 font-archivo font-medium text-xs leading-4.5"
              style={{
                backgroundColor: task.category.color.bg,
                color: task.category.color.text
              }}
              key={task.category?.title}
            >
              <div
                className="size-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: task.category.color.text }}
              ></div>
              <span className="truncate">{task.category?.title}</span>
            </Badge>
          </TableCell>
        );

      case "priority":
        return (
          <TableCell key={key} className="tracking-[-0.05px] capitalize">
            <div className="flex items-center gap-2">
              <PriorityFlag priority={task.priority.toLocaleLowerCase()} />
              {task.priority}
            </div>
          </TableCell>
        );

      case "status":
        return (
          <TableCell key={key} className="tracking-[-0.05px] overflow-hidden">
            <Badge
              className="max-w-full rounded-full py-0.5 px-2 font-archivo font-medium text-xs leading-4.5"
              style={{
                backgroundColor: task.status.color.bg,
                color: task.status.color.text
              }}
            >
              <span className="truncate">{task.status.title}</span>
            </Badge>
          </TableCell>
        );

      default:
        return null;
    }
  };

  return (
    <div className="mt-2 w-full tasksTable">
      {tasks.length != 0 && (
        <Table
          style={{
            overflow: "visible",
            minWidth: tableMinWidth,
            width: tableWidth
          }}
          className="table-fixed !overflow-visible table-container"
        >
          {/* Fixed layout + explicit widths is what makes the columns
              resizable; see getTaskTableGeometry for why the first column is
              left width-less. */}
          <colgroup>
            {columns.map((key) => (
              <col key={key} style={colStyle(key)} />
            ))}
            <col style={{ width: ACTIONS_COLUMN_WIDTH }} />
          </colgroup>
          <TableHeader className="">
            <TableRow className="group/head hover:bg-transparent !border-b-1 !border-gray-100">
              {columns.map((key) => (
                <TableHead
                  key={key}
                  // Lets ColumnResizer map rendered header cells back to
                  // column keys when it freezes the layout for a drag.
                  data-column-key={key}
                  className={cn(
                    "relative text-xs tracking-[-0.05px]",
                    key === "name" ? "text-gray-500" : "text-gray-400"
                  )}
                >
                  <ColumnSortControl columnKey={key} />
                </TableHead>
              ))}
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <TableRow
                  key={idx}
                  className="!h-[44px] bg-gray-50 animate-pulse"
                />
              ))
            ) : (
              <>
                {renderedTasks.map((task) => (
                  <React.Fragment key={task._id}>
                    <TableRow
                      className="!h-[44px] hover:bg-gray-50 !border-b-1 !border-gray-100 cursor-pointer"
                      onClick={() => {
                        setSelectedTask(task._id);
                        setIsOpen(true);
                      }}
                      onMouseEnter={() => prefetchOnMouseEnter(task._id)}
                    >
                      {columns.map((key) => renderCell(key, task))}
                      <TableCell className="">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="hover:bg-secondary"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Ellipsis className="text-gray-500" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="p-1 w-30"
                            collisionPadding={20}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              className="cursor-pointer flex items-center gap-2 w-full [&>span]:justify-start"
                              onClick={() => {
                                setSelectedTask(task._id);
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
                          colSpan={colSpan}
                        />
                      )}
                  </React.Fragment>
                ))}
                {hasMore && (
                  <tr ref={sentinelRef} aria-hidden>
                    <td
                      colSpan={colSpan}
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
          setTimeout(() => {
            setSelectedTask(null);
            setSelectedStatusId(null);
          }, 200);
        }}
        selectedTask={selectedTask}
        editing={!!selectedTask}
        predefinedStatus={selectedStatusId}
        key="coach-table"
      />
    </div>
  );
}

export default TasksTable;
