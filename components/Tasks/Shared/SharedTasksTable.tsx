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
import { User } from "@/typescript/interface/user.interface";
import assets from "@/json/assets";
import { formatDateOrEmpty } from "@/lib/functions/_helpers.lib";
import { cn } from "@/lib/utils";
import { Task } from "@/typescript/interface/task.interface";
import Image from "next/image";
import React, { useState } from "react";
import { Badge } from "../../ui/badge";
import { Checkbox } from "../../ui/checkbox";
import { SmartAvatar } from "../../ui/smart-avatar";
import AddTaskSheet from "../AddTaskSheet";
import ColumnSortControl from "../ColumnSortControl";
import PriorityFlag from "../PriorityFlag";
import { useTableLayout } from "../TableLayoutContext";
import { ColumnKey, getTaskTableGeometry } from "../tableColumns";
import { parseAsString, useQueryState } from "nuqs";

export const SubTasksTable = ({
  subTasks,
  colSpan
}: {
  subTasks: { _id: string; title: string; completed: boolean }[];
  colSpan: number;
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
        colSpan={colSpan}
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
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Each group is already a single status, so the Status column is only useful
  // (and only shown) when the list is grouped by something else.
  const [group] = useQueryState("group", parseAsString.withDefault("status"));
  const showStatus = group !== "status";

  // Same resizable / hideable / reorderable columns as the editable tables.
  const { visibleColumns, widthStyle, hasCustomWidths } = useTableLayout();
  const columns = visibleColumns.filter(
    (key) => key !== "status" || showStatus
  );
  const { colSpan, colStyle, tableMinWidth, tableWidth } = getTaskTableGeometry(
    columns,
    widthStyle,
    {
      // Read-only: no row-actions menu, so no trailing column.
      hasActionsColumn: false,
      // Fill the container until the user sets widths of their own.
      fill: !hasCustomWidths
    }
  );

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
                    setOpenTasksIndex((prev) =>
                      prev.includes(task._id)
                        ? prev.filter((i) => i !== task._id)
                        : [...prev, task._id]
                    );
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
                className={cn("size-4 shrink-0 rounded-full mr-3", {
                  "border-2 border-gray-300 border-dotted":
                    task.status.title === "Todo"
                })}
                style={{
                  backgroundColor:
                    task.status.title === "Todo"
                      ? "white"
                      : task.status.color.text
                }}
              />
              <p
                className="flex-1 truncate"
                title={task.title}
                onClick={() => {
                  setSelectedTask(task);
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
              />
              <span className="font-lato font-medium text-sm text-gray-700 truncate">
                {task?.user?.fullName ?? "-"}
              </span>
            </div>
          </TableCell>
        );

      case "assignedTo": {
        // Display only — a shared viewer has no permission to reassign, so this
        // is deliberately plain text/avatars with no popover or toggle. Full
        // opacity rather than a greyed-out control: it reads as information, not
        // as something disabled.
        const assignees = Array.isArray(task.assignedTo)
          ? task.assignedTo
          : task.assignedTo
            ? [task.assignedTo as unknown as User]
            : [];

        const display = (
          <div className="flex min-w-0 items-center gap-2">
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
                  className="size-5 shrink-0"
                />
                <span className="font-lato font-medium text-sm text-gray-700 truncate">
                  {assignees[0]?.fullName}
                </span>
              </>
            ) : (
              <>
                <div className="flex shrink-0 items-center">
                  {assignees.slice(0, 2).map((u, i) => (
                    <div key={u._id} className={cn(i > 0 && "-ml-2")}>
                      <SmartAvatar
                        src={u.photo}
                        name={u.fullName}
                        key={u.updatedAt}
                        className="size-5 ring-1 ring-white"
                      />
                    </div>
                  ))}
                </div>
                <span className="font-lato font-medium text-sm text-gray-700 truncate">
                  {assignees.length} people
                </span>
              </>
            )}
          </div>
        );

        return (
          <TableCell key={key} className="tracking-[-0.05px] overflow-hidden">
            {assignees.length > 1 ? (
              <Tooltip>
                <TooltipTrigger asChild>{display}</TooltipTrigger>
                <TooltipContent side="bottom" className="p-2">
                  <div className="space-y-1.5">
                    {assignees.map((u) => (
                      <div key={u._id} className="flex items-center gap-2">
                        <SmartAvatar
                          src={u.photo}
                          name={u.fullName}
                          className="size-4"
                        />
                        <span className="text-xs">{u.fullName}</span>
                      </div>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            ) : (
              display
            )}
          </TableCell>
        );
      }

      case "dueDate":
        return (
          <TableCell
            key={key}
            className="font-lato text-sm text-gray-600 tracking-[-0.05px]"
          >
            {formatDateOrEmpty(task.dueDate, "DD-MM-YYYY") || "-"}
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
          <colgroup>
            {columns.map((key) => (
              <col key={key} style={colStyle(key)} />
            ))}
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
                      {columns.map((key) => renderCell(key, task))}
                    </TableRow>
                    {task.subtasks &&
                      task.subtasks.length > 0 &&
                      openTasksIndex.includes(task._id) && (
                        <SubTasksTable
                          subTasks={task.subtasks}
                          colSpan={colSpan}
                        />
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
