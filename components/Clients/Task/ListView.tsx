//  @typescript-eslint/no-unused-vars
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";
import { getAllStatusesByCoach } from "@/external-api/functions/status.api";
import { getAllTasksByCoach } from "@/external-api/functions/task.api";
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
import AddTaskSheet from "./AddTaskSheet";
import TasksTable from "./TasksTable";

function ListView() {
  const [openIndexes, setOpenIndexes] = useState<number[]>([0]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const { id: userId } = useParams();

  const [sort] = useQueryState(
    "sort",
    parseAsArrayOf(parseAsString.withDefault("")).withDefault([])
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
        queryKey: ["tasks", sort, validatedFilters, userId],
        queryFn: () =>
          getAllTasksByCoach({
            sort: sort.join(","),
            filter: validatedFilters,
            userId: userId as string
          }),
        placeholderData: (prev: Task[] | undefined) => prev
      },
      {
        queryKey: ["status", userId],
        queryFn: () => getAllStatusesByCoach(userId as string)
      }
    ]
  });

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
      ) : (
        status
          .sort((a, b) => (a?.priority || 0) - (b?.priority || 0))
          .map((_status, id) => (
            <Collapsible
              key={_status?._id}
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
                  style={{ backgroundColor: _status?.color?.bg }}
                >
                  <h5
                    className="text-sm font-medium leading-5"
                    style={{ color: _status?.color?.text }}
                  >
                    {_status?.title}
                  </h5>
                  <Badge
                    variant="counter"
                    style={{ backgroundColor: _status?.color?.text }}
                  >
                    {
                      tasks?.filter((task) => task.status._id === _status?._id)
                        .length
                    }
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  className="text-gray-400 text-[12px] self-end"
                  size="sm"
                  onClick={() => {
                    setIsOpen(true);
                    setSelectedStatus(_status?._id as string);
                  }}
                >
                  <Image
                    src={assets.icons.plus}
                    alt="add"
                    width={14}
                    height={14}
                  />
                  Add Task
                </Button>
              </div>
              <CollapsibleContent className="pl-7 data-[state=closed]:animate-slideUp data-[state=open]:animate-slideDown max-md:w-[94vw] max-sm:w-[92vw] max-md:overflow-auto scrollbar-hide">
                <TasksTable
                  tasks={
                    tasks?.filter((task) => task.status._id === _status?._id) ??
                    []
                  }
                  isLoading={isLoading}
                />
              </CollapsibleContent>
            </Collapsible>
          ))
      )}
      <AddTaskSheet
        open={isOpen}
        onOpenChange={(toggle) => {
          setIsOpen(toggle);
          setSelectedStatus(null);
        }}
        predefinedStatus={selectedStatus}
        key="coach"
      />
    </div>
  );
}

export default ListView;
