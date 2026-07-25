import { getAllStatuses } from "@/external-api/functions/status.api";
import { getAllSharedTasks } from "@/external-api/functions/task.api";
import assets from "@/json/assets";
import { sanitizeFilters } from "@/lib/functions/_helpers.lib";
import { cn } from "@/lib/utils";
import { Filter } from "@/typescript/interface/common.interface";
import { Task } from "@/typescript/interface/task.interface";
import { useQueries } from "@tanstack/react-query";
import Image from "next/image";
import { useParams } from "next/navigation";
import {
  parseAsArrayOf,
  parseAsJson,
  parseAsString,
  useQueryState
} from "nuqs";
import { useState } from "react";
import { Badge } from "../../ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "../../ui/collapsible";
import { NO_GROUP } from "../GroupByControl";
import { ColumnKey, getGroups, sortTasks } from "../tableColumns";
import SharedTasksTable from "./SharedTasksTable";

function SharedListView() {
  const { shareId } = useParams();
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
        // Sort is applied client-side (sortTasks) exactly as in the personal
        // list, so it's deliberately not part of the key or the request. It also
        // fixes it: the old `sort` param forwarded UI column keys ("name") which
        // aren't the backend's field names ("title"), so it never took effect.
        queryKey: ["shared-tasks", shareId, validatedFilters],
        queryFn: () =>
          getAllSharedTasks({
            shareId: shareId?.toString() ?? "",
            filter: validatedFilters
          }),
        placeholderData: (prev: Task[] | undefined) => prev,
        enabled: !!shareId
      },
      {
        queryKey: ["status"],
        queryFn: getAllStatuses
      }
    ]
  });

  // Sort in memory, then bucket into the chosen grouping (Status by default) —
  // same helpers as the personal list, so Group by / Ungroup behave identically
  // here. Removing the grouping renders one flat list.
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
          {Array.from({ length: 3 }).map((_, block) => (
            <div key={block} className="space-y-2">
              <div className="w-25 h-8 bg-gray-200/70 animate-pulse rounded-md" />
              <div className="space-y-1">
                {Array.from({ length: 4 }).map((__, row) => (
                  <div
                    key={row}
                    className="!h-[44px] bg-gray-200/70 animate-pulse rounded-md"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : group === NO_GROUP ? (
        <div className="w-full min-w-0 overflow-x-auto">
          <SharedTasksTable tasks={sortedTasks} isLoading={isLoading} />
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
            </div>
            <CollapsibleContent className="pl-7 data-[state=closed]:animate-slideUp data-[state=open]:animate-slideDown w-full min-w-0 overflow-x-auto max-sm:pl-0">
              <SharedTasksTable tasks={_group.tasks} isLoading={isLoading} />
            </CollapsibleContent>
          </Collapsible>
        ))
      )}
    </div>
  );
}

export default SharedListView;
