import {
  deleteTask,
  getAllTasks,
  moveToStatus
} from "@/external-api/functions/task.api";
import assets from "@/json/assets";
import { sanitizeFilters } from "@/lib/functions/_helpers.lib";
import { cn } from "@/lib/utils";
import { queryClient } from "@/pages/_app";
import { Filter } from "@/typescript/interface/common.interface";
import { Task } from "@/typescript/interface/task.interface";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Ellipsis, Pencil, Plus, Trash } from "lucide-react";
import moment from "moment";
import Image from "next/image";
import { parseAsJson, useQueryState } from "nuqs";
import { useState } from "react";
import DeleteDialog from "../DeleteDialog";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { SmartAvatar } from "../ui/smart-avatar";
import AddTaskSheet from "./AddTaskSheet";
import PriorityFlag from "./PriorityFlag";

const days = [
  {
    title: "Monday",
    titleColor: "text-orange-600/80",
    bgColor: "bg-orange-200/60",
    accentColor: "bg-orange-600/80"
  },
  {
    title: "Tuesday",
    titleColor: "text-[#9300A9]",
    bgColor: "bg-[#9300A91F]",
    accentColor: "bg-[#9300A9]"
  },
  {
    title: "Wednesday",
    titleColor: "text-[#4302E8]",
    bgColor: "bg-[#4302E81F]",
    accentColor: "bg-[#4302E8]"
  },
  {
    title: "Thursday",
    titleColor: "text-[#026AE8]",
    bgColor: "bg-[#026AE81F]",
    accentColor: "bg-[#026AE8]"
  },
  {
    title: "Friday",
    titleColor: "text-orange-600/80",
    bgColor: "bg-orange-200/60",
    accentColor: "bg-orange-600/80"
  },
  {
    title: "Saturday",
    titleColor: "text-[#9300A9]",
    bgColor: "bg-[#9300A91F]",
    accentColor: "bg-[#9300A9]"
  },
  {
    title: "Sunday",
    titleColor: "text-[#4302E8]",
    bgColor: "bg-[#4302E81F]",
    accentColor: "bg-[#4302E8]"
  }
];

const TaskCard = ({
  task,
  onDelete,
  onEdit,
  onDeleteLoading
}: {
  task: Task;
  onDelete: () => void;
  onEdit: () => void;
  onDeleteLoading: boolean;
}) => {
  const { mutate, isPending } = useMutation({
    mutationFn: moveToStatus,
    onMutate: async ({ task_id, status }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });

      const previousResponse = queryClient.getQueryData<Task[]>(["tasks"]);

      if (previousResponse) {
        const updatedTasks = previousResponse.map((task) =>
          task._id === task_id ? { ...task, status } : task
        );
        queryClient.setQueryData(["tasks"], updatedTasks);
      }

      return { previousResponse };
    },
    meta: {
      invalidateQueries: ["tasks"]
    }
  });

  return (
    <div className="bg-white rounded-[8px] p-3.5 flex items-start overflow-hidden transition-all duration-200 group border-1 hover:border-primary/30">
      <Checkbox
        className={cn(
          "w-4 h-4 mr-4 -ml-8 transition-all duration-200 mt-1 group-hover:ml-0 cursor-pointer"
        )}
        checked={task.status?.title === "Completed"}
        disabled={isPending}
        onClick={() =>
          mutate({ task_id: task._id, status: "68dead55e9c648f5b606740f" })
        }
      />
      <div className="flex flex-col gap-1 flex-1">
        <p className="font-medium font-lato flex justify-between items-start">
          {task.title}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-all duration-200"
              >
                <Ellipsis />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-1 w-30" collisionPadding={20}>
              <Button
                variant="ghost"
                size="sm"
                className="cursor-pointer flex items-center gap-2 w-full"
                onClick={onEdit}
              >
                <Pencil />
                Edit
              </Button>
              <DeleteDialog onDelete={onDelete} isLoading={onDeleteLoading}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="cursor-pointer flex items-center gap-2 w-full text-red-500 hover:text-red-500 hover:bg-red-50"
                >
                  <Trash />
                  Delete
                </Button>
              </DeleteDialog>
            </PopoverContent>
          </Popover>
        </p>
        <div className="flex mt-2 items-center gap-2">
          <div className="flex gap-2 items-center">
            <Image
              src={assets.icons.calendar}
              width={16}
              height={16}
              alt="calendar w-3 h-3"
            />
            <span className="text-xs">
              Start: {moment(task.createdAt).format("MMM DD")}
            </span>
          </div>
          <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
          <div className="flex gap-1 items-center">
            <SmartAvatar
              src={task?.user?.photo}
              name={task?.user?.fullName}
              key={task?.user?.updatedAt}
              className="size-5"
            />
            <span className="text-xs text-gray-900 font-lato font-medium">
              {task.user?.fullName}
            </span>
          </div>
        </div>
        <div className="flex text-sm mt-2 gap-1 capitalize">
          <PriorityFlag priority={task.priority} />
          {task.priority}
        </div>
      </div>
    </div>
  );
};

function WeekView() {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectDueDate, setSelectedDueDate] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);

  const [values] = useQueryState<Filter[]>(
    "filters",
    parseAsJson<Filter[]>((v) =>
      Array.isArray(v) ? (v as Filter[]) : null
    ).withDefault([
      { selectedKey: "", selectedOperator: "", selectedValue: "" }
    ])
  );
  const [dates] = useQueryState(
    "dates",
    parseAsJson<{ start: string; end: string }>((v) =>
      v && typeof v === "object" ? (v as { start: string; end: string }) : null
    ).withDefault({
      start: moment().startOf("week").toISOString(),
      end: moment().endOf("week").toISOString()
    })
  );

  const validatedFilters = sanitizeFilters(values);

  const { data, isLoading } = useQuery({
    queryKey: ["tasks", validatedFilters, dates],
    queryFn: () =>
      getAllTasks({
        filter: validatedFilters,
        startDate: dates.start,
        endDate: dates.end
      })
    // placeholderData: (prev: Task[] | undefined) => prev
  });

  const { mutate, isPending } = useMutation({
    mutationFn: deleteTask,
    meta: {
      invalidateQueries: ["tasks"]
    }
  });

  return (
    <div className="flex  gap-4 py-4 overflow-x-auto h-full scrollbar-hide items-start max-sm:flex-col">
      {days.map((day, index) => {
        const taskForDay = data?.filter(
          (_task) =>
            moment(dates.start).add(index, "day").format("DD/MM/YYYY") ===
            moment(_task.dueDate).format("DD/MM/YYYY")
        );
        return (
          <div
            className="p-3 bg-gray-100 rounded-[12px] flex flex-col gap-2.5 w-[312px] flex-shrink-0 max-sm:w-full"
            key={index}
          >
            <div
              className={cn(
                "p-1 pl-3 rounded-sm inline-flex items-center gap-2.5 w-max",
                day.bgColor
              )}
            >
              <h5
                className={cn("text-sm font-medium leading-5", day.titleColor)}
              >
                {day.title}
              </h5>
              <Badge variant="counter" className={day.accentColor}>
                {taskForDay?.length ?? 0}
              </Badge>
            </div>
            <Button
              variant="ghost"
              className="w-full bg-white hover:bg-white text-gray-500 group"
              onClick={() => {
                setIsOpen(true);
                setSelectedDueDate(
                  moment(dates.start).add(index, "day").format("YYYY-MM-DD")
                );
              }}
            >
              <Plus className="text-gray-500 group-hover:text-black" />
              Add Task
            </Button>
            {isLoading ? (
              <>
                <div className="w-full h-30.5 bg-gray-200/70 animate-pulse rounded-md" />
                <div className="w-full h-30.5 bg-gray-200/70 animate-pulse rounded-md" />
                <div className="w-full h-30.5 bg-gray-200/70 animate-pulse rounded-md" />
                <div className="w-full h-30.5 bg-gray-200/70 animate-pulse rounded-md" />
              </>
            ) : (
              taskForDay?.map((task) => (
                <TaskCard
                  task={task}
                  key={task._id}
                  onDelete={() => mutate(task._id)}
                  onDeleteLoading={isPending}
                  onEdit={() => {
                    setSelectedTask(task);
                    setIsOpen(true);
                  }}
                />
              ))
            )}
          </div>
        );
      })}
      <AddTaskSheet
        open={isOpen}
        onOpenChange={(toggle) => {
          setIsOpen(toggle);
          setSelectedTask(null);
        }}
        selectedTask={selectedTask}
        editing={!!selectedTask}
        predefinedDueDate={selectDueDate}
      />
    </div>
  );
}

export default WeekView;
