"use client";
import { Input } from "@/components/ui/input";
import { getAllStatusesByCoach } from "@/external-api/functions/status.api";
import { moveToStatus } from "@/external-api/functions/task.api";
import assets from "@/json/assets";
import { cn } from "@/lib/utils";
import { queryClient } from "@/pages/_app";
import { Task } from "@/typescript/interface/task.interface";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

function StatusBox({
  taskId,
  selectedStatus
}: {
  taskId: string;
  selectedStatus: string;
}) {
  const { id: userId } = useParams();
  const [searchTerm, setSearchTerm] = useState("");

  const { data = [] } = useQuery({
    queryKey: ["status", userId],
    queryFn: () => getAllStatusesByCoach(userId as string)
  });

  // Filtered list based on search
  const filteredStatuses = useMemo(() => {
    return data?.filter((status) =>
      status?.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, data]);

  const { mutate } = useMutation({
    mutationFn: moveToStatus,
    onMutate: async ({ task_id, status }) => {
      // 💡 Get all cached "tasks" queries regardless of filters
      const taskQueries = queryClient
        .getQueryCache()
        .findAll({ queryKey: ["tasks"], exact: false });

      // Cancel all of them before mutation
      await Promise.all(
        taskQueries.map((q) =>
          queryClient.cancelQueries({ queryKey: q.queryKey })
        )
      );

      // Store previous data for rollback
      const previousData = taskQueries.map((q) => ({
        queryKey: q.queryKey,
        data: queryClient.getQueryData<Task[]>(q.queryKey)
      }));

      // 🔥 Optimistically update every cached "tasks" list
      taskQueries.forEach((q) => {
        const oldData = queryClient.getQueryData<Task[]>(q.queryKey);
        if (!oldData) return;

        const updatedTasks = oldData.map((task) =>
          task._id === task_id
            ? { ...task, status: { ...task.status, _id: status } }
            : task
        );

        queryClient.setQueryData(q.queryKey, updatedTasks);
      });

      // Return context for rollback if something fails
      return { previousData };
    },
    meta: {
      invalidateQueries: ["tasks", userId]
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
                  <div key={status?._id}>
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
                        {status?.title === "Todo" ? (
                          <div className="h-3 w-3 rounded-full border-gray-300 border-2 border-dotted" />
                        ) : (
                          <div
                            className="h-3.5 w-3.5 rounded-full flex justify-center items-center"
                            style={{
                              backgroundColor: status?.color?.text
                            }}
                          >
                            <div className="h-3 w-3 rounded-full border-1 border-white bg-transparent" />
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
                  </div>
                ))}
              {completedStatus && (
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
                        className="h-3.5 w-3.5 rounded-full flex justify-center items-center"
                        style={{
                          backgroundColor: completedStatus?.color?.text
                        }}
                      >
                        <div className="h-3 w-3 rounded-full border-1 border-white bg-transparent" />
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
