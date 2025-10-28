"use client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { SmartAvatar } from "@/components/ui/smart-avatar";
import { Textarea } from "@/components/ui/textarea";
import { transcriptAi } from "@/external-api/functions/ai.api";
import { importBulkTasks } from "@/external-api/functions/task.api";
import { getTranscription } from "@/external-api/functions/transcriptions.api";
import assets from "@/json/assets";
import AppLayout from "@/layouts/AppLayout";
import { cn } from "@/lib/utils";
import {
  EachTranscription,
  Transcription
} from "@/typescript/interface/transcription.interface";
import { useMutation, useQuery } from "@tanstack/react-query";
import moment from "moment";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useRouter } from "next/router";
import { useState } from "react";

type ChatTask = {
  tempId: string;
  title: string;
  description: string;
  category: { title: string; id: string };
  priority: string;
  dueDate: string;
  recurrence: string;
};

type SystemMessageText = {
  role: "system";
  data: string;
  type: "text";
};

type SystemMessageTask = {
  role: "system";
  data: {
    tasks: ChatTask[];
  };
  type: "tasks";
};

type Chat = SystemMessageText | SystemMessageTask | null;

const TranscriptHeader = ({
  transcription,
  isLoading,
  handleAIAction
}: {
  transcription?: Transcription;
  isLoading?: boolean;
  handleAIAction: (
    action: "short_summary" | "detailed_summary" | "generate_tasks",
    query?: string
  ) => void;
}) => {
  if (isLoading)
    return (
      <>
        <div className="flex justify-between mt-5 items-center">
          <div className="flex gap-2.5 items-center">
            <div className="size-6 rounded-full bg-gray-200 animate-pulse" />
            <span className="h-5 w-20 bg-gray-200 animate-pulse rounded-sm" />
          </div>
          <div className="w-25 h-6 rounded-sm bg-gray-200 animate-pulse" />
        </div>
        <div className="w-full">
          <div className="w-2/3 mt-4 h-8 bg-gray-200 rounded-sm animate-pulse" />
        </div>
        <div className="border-1 border-[#E6E6E6] p-4 rounded-[6px] mt-4">
          <div className="w-25 h-7 bg-gray-200 animate-pulse rounded-sm" />
          <div className="grid grid-cols-3 w-full mt-4 gap-4 max-sm:grid-cols-1">
            <div className="flex-1 h-10.5 bg-gray-200 animate-pulse rounded-md" />
            <div className="flex-1 h-10.5 bg-gray-200 animate-pulse rounded-md" />
            <div className="flex-1 h-10.5 bg-gray-200 animate-pulse rounded-md" />
          </div>
        </div>
      </>
    );

  return (
    <>
      <div className="flex justify-between mt-5 items-center">
        <div className="flex gap-2.5 items-center">
          <SmartAvatar
            src={transcription?.user?.photo}
            name={transcription?.user?.fullName}
            className="size-6"
          />
          <span className="text-sm text-gray-900 font-lato font-medium">
            {transcription?.user?.fullName}
          </span>
        </div>
        <div className="flex gap-2 items-center">
          <Image
            src={assets.icons.calendar}
            width={16}
            height={16}
            alt="calendar"
          />
          <span className="text-sm">
            {moment(transcription?.createdAt).format("MMM DD,YYYY")}
          </span>
        </div>
      </div>
      <h2 className="text-gray-900 font-archivo text-2xl tracking-[-3%] font-semibold mt-4 max-sm:text-xl ">
        {transcription?.title}
      </h2>
      <div className="border-1 border-[#E6E6E6] p-4 rounded-[6px] mt-4">
        <p className="font-archivo font-medium text-lg">AI Tools</p>
        <div className="grid grid-cols-3 w-full mt-4 gap-4 max-sm:grid-cols-1">
          <Button
            variant="secondary"
            className="justify-start bg-[#f9f9f9] border-1 border-gray-200"
            onClick={() => handleAIAction("short_summary")}
          >
            <Image
              src={assets.icons.shortSummary}
              width={20}
              height={20}
              alt="shot-summary"
            />
            <p className="font-lato font-medium text-sm text-gray-900 tracking-[-0.05px]">
              Short Summary
            </p>
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleAIAction("detailed_summary")}
            className="justify-start bg-[#f9f9f9] border-1 border-gray-200"
          >
            <Image
              src={assets.icons.detailSummary}
              width={20}
              height={20}
              alt="detail-summary"
            />
            <p className="font-lato font-medium text-sm text-gray-900 tracking-[-0.05px]">
              Detail Summary
            </p>
          </Button>
          <Button
            variant="secondary"
            className="justify-start bg-[#f9f9f9] border-1 border-gray-200"
            onClick={() => handleAIAction("generate_tasks")}
          >
            <Image
              src={assets.icons.generateTask}
              width={20}
              height={20}
              alt="generate-task"
            />
            <p className="font-lato font-medium text-sm text-gray-900 tracking-[-0.05px]">
              Generate Task
            </p>
          </Button>
        </div>
      </div>
    </>
  );
};

const ShortSummaryBox = ({
  data,
  isPending
}: {
  data: Chat;
  isPending: boolean;
}) => {
  return (
    <div className="w-full my-5 p-4 border-1 border-gray-200 bg-[#f9f9f9] rounded-[6px] flex flex-col gap-3">
      <p className="font-archivo font-medium text-lg">
        AI Short Summery Based on Agenda
      </p>
      {isPending ? (
        <div className="p-3 border rounded-md bg-gray-100 leading-5 mt-4">
          <p className="animate-pulse text-gray-600 italic">
            Analyzing transcripts for better context...
          </p>
        </div>
      ) : (
        data?.type === "text" && (
          <div className="p-3 border rounded-md bg-gray-100 text-gray-700 leading-5 text-sm mt-4">
            <div
              dangerouslySetInnerHTML={{ __html: data.data }}
              className="text-gray-700 text-sm font-medium font-lato inline-block leading-6 [&_hr]:my-2 break-words overflow-hidden whitespace-pre-wrap [word-break:break-word] [&_ul]:py-2 [&_ul]:px-5 [&_ol]:py-2 [&_ol]:px-5 [&_ol]:list-decimal [&_ol]:space-y-2 [&_a]:text-blue-500 [&_a]:underline"
            />
          </div>
        )
      )}
    </div>
  );
};

const DetailsSummaryBox = ({
  data,
  isPending,
  onSubmitQuery
}: {
  data: Chat;
  isPending: boolean;
  onSubmitQuery: (query: string) => void;
}) => {
  const [query, setQuery] = useState("");

  return (
    <div className="w-full my-5 p-4 border-1 border-gray-200 bg-[#f9f9f9] rounded-[6px] flex flex-col gap-3">
      <p className="font-archivo font-medium text-lg">
        AI Summery Based on Agenda
      </p>
      <Textarea
        placeholder="Ask any thing about the meeting..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="bg-white focus-visible:ring-0"
        disabled={isPending}
      />
      <Button
        className="self-end gradient-button"
        onClick={() => {
          onSubmitQuery(query);
          setQuery("");
        }}
        isLoading={isPending}
      >
        <Image src={assets.icons.aiStar} width={16} height={16} alt="ai" />
        Ask AI
      </Button>
      {isPending ? (
        <div className="p-3 border rounded-md bg-gray-100 leading-5 mt-4">
          <p className="animate-pulse text-gray-600 italic">
            Analyzing transcripts for better context...
          </p>
        </div>
      ) : (
        data?.type === "text" && (
          <div className="p-3 border rounded-md bg-gray-100 text-gray-700 leading-5 text-sm mt-4">
            <div
              dangerouslySetInnerHTML={{ __html: data.data }}
              className="text-gray-700 text-sm font-medium font-lato inline-block leading-6 [&_hr]:my-2 break-words overflow-hidden whitespace-pre-wrap [word-break:break-word] [&_ul]:py-2 [&_ul]:px-5 [&_ol]:py-2 [&_ol]:px-5 [&_ol]:list-decimal [&_ol]:space-y-2 [&_a]:text-blue-500 [&_a]:underline"
            />
          </div>
        )
      )}
    </div>
  );
};

const GenerateTaskBox = ({
  data,
  isPending
}: {
  data: Chat;
  isPending: boolean;
}) => {
  const router = useRouter();
  const { userId } = useParams();
  const [selectedTasksId, setSelectedTasksId] = useState<string[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<ChatTask[]>([]);
  const [isTaskAdded, setIsTaskAdded] = useState(false);

  const { mutate: addTasks, isPending: isAddingTasks } = useMutation({
    mutationFn: importBulkTasks,
    onSuccess: () => {
      setIsTaskAdded(true);
    },
    meta: {
      invalidateQueries: ["tasks"],
      showToast: false
    }
  });

  const toggleTaskCheckbox = (task: ChatTask) => {
    setSelectedTasksId((prev) =>
      prev.includes(task.tempId)
        ? prev.filter((_p) => _p !== task.tempId)
        : [...prev, task.tempId]
    );
    setSelectedTasks((prev) =>
      prev.find((_st) => _st.tempId === task.tempId)
        ? prev.filter((_st) => _st.tempId !== task.tempId)
        : [...prev, task]
    );
  };

  return (
    <div className="w-full my-5 p-4 border-1 border-gray-200 bg-[#f9f9f9] rounded-[6px] flex flex-col gap-3">
      <p className="font-archivo font-medium text-lg">My Tasks</p>

      {isPending ? (
        <>
          <div className="w-full h-12.5 bg-gray-200 animate-pulse rounded-md" />
          <div className="w-full h-12.5 bg-gray-200 animate-pulse rounded-md" />
          <div className="w-full h-12.5 bg-gray-200 animate-pulse rounded-md" />
          <div className="w-full h-12.5 bg-gray-200 animate-pulse rounded-md" />
          <div className="w-full h-12.5 bg-gray-200 animate-pulse rounded-md" />
        </>
      ) : isTaskAdded ? (
        <>
          <p className="text-sm text-gray-700 font-medium">
            Task added to your task board
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-5 shadow-sm max-w-fit"
            onClick={() => router.push(`/tasks`)}
          >
            View Tasks
          </Button>
        </>
      ) : (
        data?.type === "tasks" &&
        data.data.tasks.map((task) => (
          <label
            key={task.tempId}
            className="bg-white py-3 px-3.5 border-1 border-gray-100 rounded-[8px] cursor-pointer font-lato font-medium text-gray-900"
          >
            <Checkbox
              className={cn(
                "w-4 h-4 mr-4 group-hover:mr-1 transition-all duration-200"
              )}
              checked={selectedTasksId.includes(task.tempId)}
              onCheckedChange={() => toggleTaskCheckbox(task)}
            />
            {task.title}
          </label>
        ))
      )}
      {!isTaskAdded && (
        <Button
          className="self-end"
          disabled={isPending}
          onClick={() =>
            addTasks({
              tasks: selectedTasks?.map((_task) => ({
                title: _task.title,
                description: _task.description,
                priority: _task.priority,
                category: _task.category.id,
                dueDate:
                  _task.dueDate ??
                  moment().add(1, "week").set("hour", 12).set("minutes", 0),
                frequency: _task.recurrence ?? "none"
              })),
              userId: userId as string
            })
          }
          isLoading={isAddingTasks}
        >
          Add to Task List
        </Button>
      )}
    </div>
  );
};

const TranscriptionsSection = ({
  transcriptions,
  isLoading
}: {
  transcriptions: EachTranscription[];
  isLoading?: boolean;
}) => {
  if (isLoading)
    return (
      <div className="flex flex-col items-start mt-4">
        <h3 className="font-medium text-lg text-gray-900 mb-4">
          Transcription
        </h3>
        <div className="flex gap-2.5 mb-4 items-start">
          <div className="size-8 rounded-full bg-gray-200 animate-pulse" />
          <div>
            <div className="flex gap-2 items-center">
              <div className="h-5 w-17 bg-gray-200 rounded-sm animate-pulse" />
              <div className="w-1 h-1 bg-gray-400 rounded-full" />
              <div className="w-12.5 h-4 bg-gray-200 rounded-sm animate-pulse" />
            </div>
            <div className="h-5 w-50 animate-pulse bg-gray-200 rounded-sm mt-1.5" />
          </div>
        </div>
        <div className="flex gap-2.5 mb-4 items-start">
          <div className="size-8 rounded-full bg-gray-200 animate-pulse" />
          <div>
            <div className="flex gap-2 items-center">
              <div className="h-5 w-17 bg-gray-200 rounded-sm animate-pulse" />
              <div className="w-1 h-1 bg-gray-400 rounded-full" />
              <div className="w-12.5 h-4 bg-gray-200 rounded-sm animate-pulse" />
            </div>
            <div className="h-5 w-100 animate-pulse bg-gray-200 rounded-sm mt-1.5" />
          </div>
        </div>
        <div className="flex gap-2.5 mb-4 items-start">
          <div className="size-8 rounded-full bg-gray-200 animate-pulse" />
          <div>
            <div className="flex gap-2 items-center">
              <div className="h-5 w-17 bg-gray-200 rounded-sm animate-pulse" />
              <div className="w-1 h-1 bg-gray-400 rounded-full" />
              <div className="w-12.5 h-4 bg-gray-200 rounded-sm animate-pulse" />
            </div>
            <div className="h-5 w-55 animate-pulse bg-gray-200 rounded-sm mt-1.5" />
            <div className="h-5 w-90 animate-pulse bg-gray-200 rounded-sm mt-1.5" />
          </div>
        </div>
        <div className="flex gap-2.5 mb-4 items-start">
          <div className="size-8 rounded-full bg-gray-200 animate-pulse" />
          <div>
            <div className="flex gap-2 items-center">
              <div className="h-5 w-17 bg-gray-200 rounded-sm animate-pulse" />
              <div className="w-1 h-1 bg-gray-400 rounded-full" />
              <div className="w-12.5 h-4 bg-gray-200 rounded-sm animate-pulse" />
            </div>
            <div className="h-5 w-70 animate-pulse bg-gray-200 rounded-sm mt-1.5" />
          </div>
        </div>
        <div className="flex gap-2.5 mb-4 items-start">
          <div className="size-8 rounded-full bg-gray-200 animate-pulse" />
          <div>
            <div className="flex gap-2 items-center">
              <div className="h-5 w-17 bg-gray-200 rounded-sm animate-pulse" />
              <div className="w-1 h-1 bg-gray-400 rounded-full" />
              <div className="w-12.5 h-4 bg-gray-200 rounded-sm animate-pulse" />
            </div>
            <div className="h-5 w-30 animate-pulse bg-gray-200 rounded-sm mt-1.5" />
          </div>
        </div>
        <div className="flex gap-2.5 mb-4 items-start">
          <div className="size-8 rounded-full bg-gray-200 animate-pulse" />
          <div>
            <div className="flex gap-2 items-center">
              <div className="h-5 w-17 bg-gray-200 rounded-sm animate-pulse" />
              <div className="w-1 h-1 bg-gray-400 rounded-full" />
              <div className="w-12.5 h-4 bg-gray-200 rounded-sm animate-pulse" />
            </div>
            <div className="h-5 w-50 animate-pulse bg-gray-200 rounded-sm mt-1.5" />
          </div>
        </div>
        <div className="flex gap-2.5 mb-4 items-start">
          <div className="size-8 rounded-full bg-gray-200 animate-pulse" />
          <div>
            <div className="flex gap-2 items-center">
              <div className="h-5 w-17 bg-gray-200 rounded-sm animate-pulse" />
              <div className="w-1 h-1 bg-gray-400 rounded-full" />
              <div className="w-12.5 h-4 bg-gray-200 rounded-sm animate-pulse" />
            </div>
            <div className="h-5 w-100 animate-pulse bg-gray-200 rounded-sm mt-1.5" />
          </div>
        </div>
      </div>
    );

  const startTime = transcriptions[0]?.timestamp;

  return (
    <div className="flex flex-col items-start mt-4">
      <h3 className="font-medium text-lg text-gray-900 mb-4">Transcription</h3>
      {transcriptions.map((transcription) => (
        <div key={transcription._id} className="flex gap-2.5 mb-4 items-start">
          <SmartAvatar
            src={transcription.profile}
            name={transcription.name}
            className="size-8"
          />
          <div>
            <div className="flex gap-2 items-center">
              <p className="font-lato font-medium tracking-[-2%] text-gray-900">
                {transcription.name}
              </p>
              <span className="w-1 h-1 bg-gray-400 rounded-full" />
              <p className="font-lato text-primary text-xs">
                {moment
                  .utc(moment(transcription.timestamp).diff(moment(startTime)))
                  .format("HH:mm:ss")}
              </p>
            </div>
            <p className="font-lato text-sm text-gray-600 mt-0.5">
              {transcription.text}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

function TranscriptsDescription() {
  const { userId, transcriptionId } = useParams();
  const [openedBox, setOpenedBox] = useState<
    null | "short_summary" | "detailed_summary" | "generate_tasks"
  >(null);
  const [AIData, setAIData] = useState<Chat>(null);
  const [sessionId] = useState(moment.now());

  const { data, isLoading } = useQuery({
    queryKey: ["transcriptions", transcriptionId],
    queryFn: () => getTranscription(transcriptionId as string)
  });

  const { mutate, isPending } = useMutation({
    mutationFn: transcriptAi,
    onSuccess: (data) => {
      setAIData(data);
    }
  });

  const handleAIAction = (
    action: "short_summary" | "detailed_summary" | "generate_tasks",
    query?: string
  ) => {
    if (!transcriptionId) return;
    setAIData(null);

    if (action === "detailed_summary") {
      if (!query) {
        // Toggling panel when triggered from header
        setOpenedBox((prev) =>
          prev === "detailed_summary" ? null : "detailed_summary"
        );
        return; // Do NOT mutate yet
      }

      // Only triggered when submitting a question to AI
      setOpenedBox("detailed_summary");

      mutate({
        transcriptionId: transcriptionId as string,
        action,
        query,
        session_id: sessionId.toString(),
        user: userId as string
      });
      return;
    }

    // Normal toggle + mutation for other actions
    if (openedBox !== action) {
      mutate({
        transcriptionId: transcriptionId as string,
        action,
        query: "",
        session_id: sessionId.toString(),
        user: userId as string
      });
    }
    setOpenedBox((prev) => (prev === action ? null : action));
  };

  return (
    <AppLayout>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-2 items-center ">
          <Link
            href="/transcripts"
            className="text-sm font-lato font-normal text-gray-600 "
          >
            Transcriptions
          </Link>
          <span className="text-xs text-gray-600">/</span>
          <h1 className="text-sm  font-lato font-semibold text-gray-900 ">
            Transcriptions Details
          </h1>
        </div>
      </div>
      <Separator />
      <TranscriptHeader
        handleAIAction={handleAIAction}
        transcription={data}
        isLoading={isLoading}
      />
      {openedBox === "generate_tasks" ? (
        <GenerateTaskBox isPending={isPending} data={AIData} />
      ) : openedBox === "detailed_summary" ? (
        <DetailsSummaryBox
          isPending={isPending}
          data={AIData}
          onSubmitQuery={(query) => handleAIAction("detailed_summary", query)}
        />
      ) : openedBox === "short_summary" ? (
        <ShortSummaryBox data={AIData} isPending={isPending} />
      ) : null}
      <TranscriptionsSection
        transcriptions={data?.transcriptions ?? []}
        isLoading={isLoading}
      />
    </AppLayout>
  );
}

export default TranscriptsDescription;
