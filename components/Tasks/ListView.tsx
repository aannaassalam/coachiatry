//  @typescript-eslint/no-unused-vars
import { getAllStatuses } from "@/external-api/functions/status.api";
import { getAllTasks } from "@/external-api/functions/task.api";
import assets from "@/json/assets";
import { sanitizeFilters } from "@/lib/functions/_helpers.lib";
import { cn } from "@/lib/utils";
import { Filter } from "@/typescript/interface/common.interface";
import { Task } from "@/typescript/interface/task.interface";
import { useQueries } from "@tanstack/react-query";
import Image from "next/image";
import {
  parseAsArrayOf,
  parseAsJson,
  parseAsString,
  useQueryState
} from "nuqs";
import { useState } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "../ui/collapsible";
import { NO_GROUP } from "./GroupByControl";
import TasksTable from "./TasksTable";
import { ColumnKey, getGroups, sortTasks } from "./tableColumns";

function ListView({ onAddTask }: { onAddTask: (statusId?: string) => void }) {
  const [openIndexes, setOpenIndexes] = useState<number[]>([0]);

  const [sort] = useQueryState(
    "sort",
    parseAsArrayOf(parseAsString.withDefault("")).withDefault([])
  );
  const [group] = useQueryState("group", parseAsString.withDefault("status"));
  const [groupDir] = useQueryState(
    "groupDir",
    parseAsString.withDefault("asc")
  );
  const [values] = useQueryState<Filter[]>(
    "filters",
    parseAsJson<Filter[]>((v) =>
      Array.isArray(v) ? (v as Filter[]) : null
    ).withDefault([
      { selectedKey: "", selectedOperator: "", selectedValue: "" }
    ])
  );

  const validatedFilters = sanitizeFilters(values);

  const [
    { data: tasks = [], isLoading },
    { data: status = [], isLoading: isStatusLoading }
  ] = useQueries({
    queries: [
      {
        // Sort is applied client-side (sortTasks), so it's intentionally NOT
        // part of the key or the request — toggling sort never refetches the
        // (already in-memory) list. Only filters change what we fetch.
        queryKey: ["tasks", validatedFilters],
        queryFn: () => getAllTasks({ filter: validatedFilters }),
        placeholderData: (prev: Task[] | undefined) => prev,
        staleTime: 60 * 1000
      },
      {
        queryKey: ["status"],
        queryFn: getAllStatuses
      }
    ]
  });

  // Sort in memory, then bucket into the chosen grouping (Status by default).
  // When grouping is removed, render a single flat, createdAt-sorted list.
  const sortedTasks = sortTasks(tasks, sort);
  const groups =
    group === NO_GROUP
      ? []
      : getGroups(sortedTasks, group as ColumnKey, groupDir, status);

  const handleToggle = (idx: number, isOpen: boolean) => {
    setOpenIndexes((prev) =>
      isOpen ? [...prev, idx] : prev.filter((i) => i !== idx)
    );
  };

  return (
    <div className="py-4 flex flex-col gap-6">
      {isStatusLoading || isLoading ? (
        <div className="space-y-4 px-8.5">
          <div className="space-y-2">
            <div className="w-25 h-8 bg-gray-200/70 animate-pulse rounded-md" />
            <div className="space-y-1">
              <div className="!h-[44px] bg-gray-200/70 animate-pulse rounded-md" />
              <div className="!h-[44px] bg-gray-200/70 animate-pulse rounded-md" />
              <div className="!h-[44px] bg-gray-200/70 animate-pulse rounded-md" />
              <div className="!h-[44px] bg-gray-200/70 animate-pulse rounded-md" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="w-25 h-8 bg-gray-200/70 animate-pulse rounded-md" />
            <div className="space-y-1">
              <div className="!h-[44px] bg-gray-200/70 animate-pulse rounded-md" />
              <div className="!h-[44px] bg-gray-200/70 animate-pulse rounded-md" />
              <div className="!h-[44px] bg-gray-200/70 animate-pulse rounded-md" />
              <div className="!h-[44px] bg-gray-200/70 animate-pulse rounded-md" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="w-25 h-8 bg-gray-200/70 animate-pulse rounded-md" />
            <div className="space-y-1">
              <div className="!h-[44px] bg-gray-200/70 animate-pulse rounded-md" />
              <div className="!h-[44px] bg-gray-200/70 animate-pulse rounded-md" />
              <div className="!h-[44px] bg-gray-200/70 animate-pulse rounded-md" />
              <div className="!h-[44px] bg-gray-200/70 animate-pulse rounded-md" />
            </div>
          </div>
        </div>
      ) : group === NO_GROUP ? (
        <div className="max-md:w-[94vw] max-sm:w-[92vw] max-md:overflow-auto scrollbar-hide">
          <TasksTable
            tasks={sortedTasks}
            isLoading={isLoading}
            onAddTask={onAddTask}
          />
        </div>
      ) : (
        groups.map((_group, id) => (
          <Collapsible
            key={_group.key}
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
                className="p-1 pl-3 rounded-sm inline-flex items-center gap-2.5"
                style={{ backgroundColor: _group.bg ?? "#F3F4F6" }}
              >
                <h5
                  className="text-sm font-medium leading-5"
                  style={{ color: _group.text ?? "#4B5563" }}
                >
                  {_group.label}
                </h5>
                <Badge
                  variant="counter"
                  style={{ backgroundColor: _group.text ?? "#4B5563" }}
                >
                  {_group.tasks.length}
                </Badge>
              </div>
              {_group.statusId && (
                <Button
                  variant="ghost"
                  className="text-gray-400 text-[12px] self-end"
                  size="sm"
                  onClick={() => onAddTask(_group.statusId)}
                >
                  <Image
                    src={assets.icons.plus}
                    alt="add"
                    width={14}
                    height={14}
                  />
                  Add Task
                </Button>
              )}
            </div>
            <CollapsibleContent className="pl-7 data-[state=closed]:animate-slideUp data-[state=open]:animate-slideDown max-md:w-[94vw] max-sm:w-[92vw] max-md:overflow-auto scrollbar-hide max-sm:pl-0">
              <TasksTable
                tasks={_group.tasks}
                isLoading={isLoading}
                onAddTask={onAddTask}
              />
            </CollapsibleContent>
          </Collapsible>
        ))
      )}
    </div>
  );
}

export default ListView;
