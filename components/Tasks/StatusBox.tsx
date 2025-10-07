"use client";
import { getAllStatuses } from "@/external-api/functions/status.api";
import { moveToStatus } from "@/external-api/functions/task.api";
import assets from "@/json/assets";
import { cn } from "@/lib/utils";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { Input } from "../ui/input";

const statuses = [
  { label: "Todo", color: "border-gray-400", dot: "border-2 border-dotted" },
  { label: "Struggling", color: "bg-orange-500" },
  { label: "Overdue", color: "bg-red-500" },
  { label: "Completed", color: "bg-green-500" }
];

function StatusBox({
  taskId,
  selectedStatus
}: {
  taskId: string;
  selectedStatus: string;
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const { data = [] } = useQuery({
    queryKey: ["status"],
    queryFn: getAllStatuses,
    select: (data) => {
      const reformedData = data
        .map((_item) => {
          const foundItem = statuses.find(
            (_status) => _status.label === _item.title
          );
          return foundItem
            ? { ..._item, ...foundItem, label: undefined }
            : null;
        })
        .filter(Boolean);
      return reformedData;
    }
  });

  // Filtered list based on search
  const filteredStatuses = useMemo(() => {
    return data?.filter((status) =>
      status?.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, data]);

  const { mutate } = useMutation({
    mutationFn: moveToStatus,
    meta: {
      invalidateQueries: ["tasks"]
    }
  });

  const completedStatus = data.find((status) => status?.title === "Completed");

  return (
    <div className="">
      {/* Search box */}
      <div className="p-2 border-b border-gray-200">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-md border border-gray-300 pl-8 pr-3 py-1.5 text-sm focus:outline-none"
          />
          <Image
            src={assets.icons.searchIcon}
            width={20}
            height={20}
            alt="search icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
          />
        </div>
      </div>

      {/* Status list */}
      <div className="p-2">
        <p className="px-2 text-xs font-medium text-gray-700 mt-2">Status</p>
        <ul className="mt-2 space-y-1">
          {filteredStatuses.length > 0 ? (
            <>
              {filteredStatuses
                .filter((status) => status?.title !== "Completed")
                .map((status) => (
                  <PopoverPrimitive.Close asChild key={status?._id}>
                    <>
                      {status?.title === "Completed" && (
                        <div className="w-full h-0.25 bg-gray-200 my-2"></div>
                      )}
                      <li
                        onClick={() =>
                          mutate({
                            task_id: taskId,
                            status: status?._id as string
                          })
                        }
                        className={cn(
                          "flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 hover:bg-gray-100 transition-all duration-200"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {status?.dot ? (
                            <div
                              className={cn(
                                "h-2.5 w-2.5 rounded-full",
                                status.dot,
                                status.color
                              )}
                            />
                          ) : (
                            <div
                              className={cn(
                                "h-3.5 w-3.5 rounded-full flex justify-center items-center",
                                status?.color
                              )}
                            >
                              <div
                                className={cn(
                                  "h-3 w-3 rounded-full border-1 border-white",
                                  status?.color
                                )}
                              />
                            </div>
                          )}
                          <span className="text-sm text-gray-900">
                            {status?.title}
                          </span>
                        </div>

                        {selectedStatus === status?._id && (
                          <Check className="h-4 w-4 text-gray-600" />
                        )}
                      </li>
                    </>
                  </PopoverPrimitive.Close>
                ))}
              {completedStatus && (
                <PopoverPrimitive.Close asChild>
                  <>
                    <div className="w-full h-0.25 bg-gray-200 my-2"></div>
                    <li
                      onClick={() =>
                        mutate({
                          task_id: taskId,
                          status: completedStatus?._id
                        })
                      }
                      className={cn(
                        "flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 hover:bg-gray-100 transition-all duration-200"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "h-3.5 w-3.5 rounded-full flex justify-center items-center",
                            completedStatus?.color
                          )}
                        >
                          <div
                            className={cn(
                              "h-3 w-3 rounded-full border-1 border-white",
                              completedStatus?.color
                            )}
                          />
                        </div>
                        <span className="text-sm text-gray-900">
                          {completedStatus?.title}
                        </span>
                      </div>

                      {selectedStatus === completedStatus?._id && (
                        <Check className="h-4 w-4 text-gray-600" />
                      )}
                    </li>
                  </>
                </PopoverPrimitive.Close>
              )}
            </>
          ) : (
            <p className="px-2 py-2 text-sm text-gray-500">No results found</p>
          )}
        </ul>
      </div>
    </div>
  );
}

export default StatusBox;
