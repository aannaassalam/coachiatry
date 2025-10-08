//  @typescript-eslint/no-unused-vars
import { getAllStatuses } from "@/external-api/functions/status.api";
import { getAllTasks } from "@/external-api/functions/task.api";
import assets from "@/json/assets";
import { sanitizeFilters } from "@/lib/functions/_helpers.lib";
import { cn } from "@/lib/utils";
import { Filter } from "@/typescript/interface/common.interface";
import { Status } from "@/typescript/interface/status.interface";
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
import AddTaskSheet from "./AddTaskSheet";
import TasksTable from "./TasksTable";

function ListView() {
  const [openIndexes, setOpenIndexes] = useState<number[]>([0]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

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

  const statusList = [
    {
      title: "Todo",
      titleColor: "text-primary",
      bgColor: "bg-gray-200",
      accentColor: "bg-primary",
      priority: -9999
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
      accentColor: "bg-green-600/90",
      priority: 9999
    }
  ];

  const [
    { data: tasks = [], isLoading },
    { data: status = [], isLoading: isStatusLoading }
  ] = useQueries({
    queries: [
      {
        queryKey: ["tasks", sort, validatedFilters],
        queryFn: () =>
          getAllTasks({
            sort: sort.join(","),
            filter: validatedFilters
          }),
        placeholderData: (prev: Task[] | undefined) => prev
      },
      {
        queryKey: ["status"],
        queryFn: getAllStatuses,
        select: (data: Status[]) => {
          const reformedData = data
            .map((_item) => {
              const foundItem = statusList.find(
                (_status) => _status.title === _item.title
              );
              return foundItem ? { ..._item, ...foundItem } : null;
            })
            .filter(Boolean);
          return reformedData;
        }
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
                  className={cn(
                    "p-1 pl-3 rounded-sm inline-flex items-center gap-2.5",
                    _status?.bgColor
                  )}
                >
                  <h5
                    className={cn(
                      "text-sm font-medium leading-5",
                      _status?.titleColor
                    )}
                  >
                    {_status?.title}
                  </h5>
                  <Badge variant="counter" className={_status?.accentColor}>
                    {
                      tasks?.filter(
                        (task) => task.status.title === _status?.title
                      ).length
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
              <CollapsibleContent className="pl-7 data-[state=closed]:animate-slideUp data-[state=open]:animate-slideDown max-md:w-[94vw] max-md:overflow-auto scrollbar-hide">
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
      />
    </div>
  );
}

export default ListView;
