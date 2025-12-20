/* eslint-disable @typescript-eslint/no-explicit-any */
import { chatWithAi } from "@/external-api/functions/ai.api";
import {
  createDocument,
  createDocumentByCoach
} from "@/external-api/functions/document.api";
import { importBulkTasks } from "@/external-api/functions/task.api";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { FaFire } from "react-icons/fa6";
import { HiLightningBolt } from "react-icons/hi";
import { IoArrowUp } from "react-icons/io5";
import { LuFileText } from "react-icons/lu";
import { RiDvdAiFill } from "./RiDvdAiFill";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { SmartAvatar } from "./ui/smart-avatar";
import moment from "moment";
import { useParams } from "next/navigation";
import { PopoverClose } from "@radix-ui/react-popover";
import { X } from "lucide-react";

type DocumentInfo = {
  isDocumentRendered: boolean;
  isDocumentAdded: boolean;
  document_id: string;
};

type TaskInfo = {
  isTaskRendered: boolean;
  isTaskAdded: boolean;
  selectedTasks: ChatTask[];
};

type ChatTask = {
  tempId: string;
  title: string;
  description: string;
  category: { title: string; id: string };
  priority: string;
  dueDate: string;
  recurrence: string;
};

type Chat =
  | {
      role: "user";
      data: string;
      type: "text";
    }
  | {
      role: "system";
      data: string;
      type: "text";
    }
  | {
      role: "system";
      data: {
        title: string;
        content: string;
        tag: {
          title: string;
          id: string;
        };
      };
      type: "document";
    }
  | {
      role: "system";
      data: {
        tasks: ChatTask[];
      };
      type: "tasks";
    };

const getFullMessages = (msg: string) => {
  switch (msg) {
    case "create_tasks":
      return "Generate a task";
    case "create_document":
      return "Create a doc";
    case "summarize":
      return "Summarize";
  }
};

const SystemMessages = ({
  chat,
  documentInfo,
  setDocumentInfo,
  taskInfo,
  setTaskInfo
}: {
  chat: Chat;
  documentInfo: DocumentInfo | null;
  setDocumentInfo: React.Dispatch<React.SetStateAction<DocumentInfo>>;
  taskInfo: TaskInfo | null;
  setTaskInfo: React.Dispatch<React.SetStateAction<TaskInfo>>;
}) => {
  const router = useRouter();
  const { userId } = useParams();
  const [selectedTasksId, setSelectedTasksId] = useState<string[]>([]);

  const { mutate: addDocument, isPending: isAddingDocument } = useMutation({
    mutationFn: userId ? createDocumentByCoach : createDocument,
    onSuccess: (data) => {
      setDocumentInfo({
        isDocumentRendered: false,
        isDocumentAdded: true,
        document_id: data.data._id
      });
    },
    meta: {
      invalidateQueries: ["documents"],
      showToast: false
    }
  });

  const { mutate: addTasks, isPending: isAddingTasks } = useMutation({
    mutationFn: importBulkTasks,
    onSuccess: () => {
      setTaskInfo({
        isTaskRendered: false,
        isTaskAdded: true,
        selectedTasks: []
      });
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
    setTaskInfo((prev) => ({
      ...prev,
      selectedTasks: prev.selectedTasks.find(
        (_st) => _st.tempId === task.tempId
      )
        ? prev.selectedTasks.filter((_st) => _st.tempId !== task.tempId)
        : [...prev.selectedTasks, task]
    }));
  };

  if (chat.type === "document")
    return (
      <div className="flex items-start gap-2 mb-6">
        <span>
          <RiDvdAiFill className="size-6 text-black mt-0.5" />
        </span>
        <div className="flex-1">
          <p className="text-xl font-semibold mb-1">{chat.data.title}</p>
          <p className="text-sm font-medium mb-3 text-gray-600">
            Tag: {chat.data.tag.title}
          </p>
          <div
            className="text-gray-700 text-sm font-medium font-lato inline-block leading-6 [&_hr]:my-2 break-words overflow-hidden whitespace-pre-wrap [word-break:break-word] [&_ul]:py-2 [&_ul]:px-5 [&_ol]:py-2 [&_ol]:px-5 [&_ol]:list-decimal [&_ol]:space-y-2 [&_a]:text-blue-500 [&_a]:underline"
            dangerouslySetInnerHTML={{ __html: chat.data.content }}
          />
          {documentInfo?.isDocumentRendered && (
            <Button
              size="sm"
              variant="outline"
              className="mt-5 shadow-sm"
              onClick={() =>
                addDocument({
                  title: chat.data.title,
                  content: chat.data.content,
                  tag: chat.data.tag.id,
                  user: userId as string
                })
              }
              isLoading={isAddingDocument}
            >
              Add this to documents
            </Button>
          )}
          {documentInfo?.isDocumentAdded && (
            <Button
              size="sm"
              variant="outline"
              className="mt-5 shadow-sm"
              onClick={() =>
                router.push(`/documents?document=${documentInfo.document_id}`)
              }
              isLoading={isAddingDocument}
            >
              View document
            </Button>
          )}
        </div>
      </div>
    );
  if (chat.type === "tasks")
    return (
      <div className="flex items-start gap-2 mb-6">
        <span>
          <RiDvdAiFill className="size-6 text-black mt-0.5" />
        </span>
        <div className="flex-1">
          {!taskInfo?.isTaskAdded ? (
            <>
              <p className="text-xl font-semibold mb-1">Tasks:</p>
              <p className="text-sm font-medium mb-4 text-gray-500">
                Select the tasks you would like to import
              </p>
              <div className="flex flex-col space-y-1.5">
                {chat.data.tasks.map((_task) => {
                  return (
                    <label
                      className="p-2 border rounded-sm flex items-start gap-2 cursor-pointer"
                      key={_task.tempId}
                    >
                      <Checkbox
                        checked={selectedTasksId.includes(_task.tempId)}
                        onCheckedChange={() => toggleTaskCheckbox(_task)}
                        disabled={isAddingTasks}
                        className="mt-0.5"
                      />
                      <span className="text-sm">{_task.title}</span>
                    </label>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-700 font-medium">
                Task added to your task board
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-5 shadow-sm"
                onClick={() => router.push(`/tasks`)}
                isLoading={isAddingDocument || isAddingTasks}
              >
                View Tasks
              </Button>
            </>
          )}
          {taskInfo?.isTaskRendered && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="mt-5 shadow-sm"
                onClick={() =>
                  addTasks({
                    tasks: taskInfo.selectedTasks?.map((_task) => ({
                      title: _task.title,
                      description: _task.description,
                      priority: _task.priority,
                      category: _task.category.id,
                      frequency: _task.recurrence ?? "none"
                    })),
                    userId: userId as string
                  })
                }
                isLoading={isAddingDocument || isAddingTasks}
                disabled={taskInfo.selectedTasks.length === 0}
              >
                Import selected tasks
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="mt-5 shadow-sm"
                onClick={() => {
                  setSelectedTasksId(
                    chat.data.tasks.map((_task) => _task.tempId)
                  );

                  setTaskInfo((prev) => ({
                    ...prev,
                    selectedTasks: chat.data.tasks
                  }));
                }}
                isLoading={isAddingDocument || isAddingTasks}
              >
                Select all
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  return (
    <div className="flex items-start gap-2 mb-6">
      <RiDvdAiFill className="size-6 text-black mt-0.5" />
      <div className="flex-1">
        <div
          className="text-gray-700 text-sm font-medium font-lato inline-block [&_ul]:py-2 [&_ul]:px-5 [&_ol]:py-2 [&_ol]:px-5 [&_ol]:list-decimal [&_ol]:space-y-2 [&_a]:text-blue-500 [&_a]:underline "
          dangerouslySetInnerHTML={{
            __html:
              chat.data || "Couldn't understand that, can you please try again!"
          }}
        />
      </div>
    </div>
  );
};

export default function CoachAI({
  id,
  size = "small",
  page = "general"
}: {
  id?: string;
  size?: "large" | "small";
  page?: "general" | "document" | "chat";
}) {
  const { data } = useSession();
  const { userId } = useParams();
  const [session] = useState(moment.now().toString());
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [value, setValue] = useState("");
  const [height] = useState("auto");
  const [maxHeight] = useState<number | undefined>();

  const [chats, setChats] = useState<Chat[]>([]);
  const [documentInfo, setDocumentInfo] = useState<DocumentInfo>({
    isDocumentRendered: false,
    isDocumentAdded: false,
    document_id: ""
  });
  const [taskInfo, setTaskInfo] = useState<TaskInfo>({
    isTaskRendered: false,
    isTaskAdded: false,
    selectedTasks: []
  });
  const route = useRouter();

  const resize = () => {
    const el = textareaRef.current;
    if (!el) return;

    el.style.height = "auto"; // reset to shrink when deleting
    const lineHeight = parseInt(getComputedStyle(el).lineHeight || "20", 10);
    const maxHeight = lineHeight * 6;

    const newHeight = Math.min(el.scrollHeight, maxHeight);
    el.style.height = newHeight + "px";
    el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
  };

  useEffect(() => {
    resize();
  }, [value]);

  const { mutate, isPending } = useMutation({
    mutationFn: chatWithAi,
    onMutate: (variable) => {
      setValue("");
      setChats((prev) => [
        ...prev,
        {
          role: "user",
          type: "text",
          data: variable.query ?? getFullMessages(variable.action ?? "") ?? ""
        }
      ]);
    },
    onSuccess: (data) => {
      if (data.type === "document") {
        setDocumentInfo({
          isDocumentRendered: true,
          isDocumentAdded: false,
          document_id: ""
        });
      }
      if (data.type === "tasks") {
        setTaskInfo({
          isTaskRendered: true,
          isTaskAdded: false,
          selectedTasks: []
        });
      }
      setChats((prev) => [...prev, { role: "system", ...data }]);
    },
    meta: {
      showToast: false
    }
  });

  const handleSend = () => {
    if (value.trim()) {
      mutate({
        query: value,
        id,
        session_id: session,
        page,
        user: userId as string
      });
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col w-[400px] h-[600px] mx-auto rounded-2xl shadow-lg border border-gray-200 bg-white overflow-hidden max-[480px]:w-[350px]",
        {
          "w-[450px] h-[650px] max-sm:h-[96vh] max-sm:w-[96vw]":
            size === "large",
          "max-md:relative max-md:left-[-70%]": route.pathname.includes("chat")
        }
      )}
    >
      {/* Header */}
      <div className="bg-[url('/assets/images/ai-background.png')] bg-right bg-cover text-white p-6">
        <div className="mb-9 flex w-full justify-between">
          <RiDvdAiFill className=" size-9" />
          <PopoverClose className="cursor-pointer">
            <X />
          </PopoverClose>
        </div>
        <h1 className="text-3xl font-semibold">Hello</h1>
        <p className="text-3xl font-semibold mt-1 opacity-90">
          How can I help you
        </p>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col pt-6 p-5 overflow-y-auto">
        <div className="flex items-start gap-2 mb-6">
          <RiDvdAiFill className="size-6 text-black mt-0.5" />
          <div className="flex-1">
            <p className="text-gray-700 text-sm font-medium mb-4 font-lato">
              Welcome back! Feel free to ask me anything. How can I help?
            </p>

            {/* Suggested actions */}
            {chats.length === 0 && (
              <>
                <p className="text-sm text-primary font-medium mb-2">
                  Suggested
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    className="flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-100 transition text-gray-700 text-sm font-medium"
                    onClick={() =>
                      mutate({
                        action: "create_tasks",
                        id,
                        session_id: session,
                        page,
                        user: userId as string
                      })
                    }
                  >
                    <LuFileText className="size-5 text-[#777878]" /> Generate a
                    Task
                  </button>
                  <button
                    className="flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-100 transition text-gray-700 text-sm font-medium"
                    onClick={() =>
                      mutate({
                        action: "create_document",
                        id,
                        session_id: session,
                        page,
                        user: userId as string
                      })
                    }
                  >
                    <HiLightningBolt className="size-5 text-[#777878]" /> Create
                    a doc
                  </button>
                  <button
                    className="flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-100 transition text-gray-700 text-sm font-medium"
                    onClick={() =>
                      mutate({
                        action: "summarize",
                        id,
                        session_id: session,
                        page,
                        user: userId as string
                      })
                    }
                  >
                    <FaFire className="size-5 text-[#777878]" /> Summarize
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        {chats.map((_chat, index) => {
          return _chat?.role === "system" ? (
            <SystemMessages
              chat={_chat}
              key={index}
              documentInfo={chats.length - 1 === index ? documentInfo : null}
              setDocumentInfo={setDocumentInfo}
              taskInfo={chats.length - 1 === index ? taskInfo : null}
              setTaskInfo={setTaskInfo}
            />
          ) : (
            <div
              className="flex items-start gap-2 mb-6 max-w-4/5 ml-auto justify-end"
              key={index}
            >
              <div className=" bg-gray-200 rounded-md">
                <div
                  className="text-gray-700 text-sm font-medium font-lato inline-block p-2"
                  dangerouslySetInnerHTML={{ __html: _chat.data }}
                />
              </div>
              <SmartAvatar
                src={data?.user?.photo}
                name={data?.user?.fullName}
                className="size-6"
                textSize="text-sm"
              />
            </div>
          );
        })}
        {isPending && (
          <div className="flex items-start gap-2 mb-6">
            <div className="flex-1 px-6 animate-pulse">
              <p className="text-gray-500 text-sm font-medium mb-4 font-lato">
                Thinking...
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Chat Input */}
      <div className="border-t bg-white p-3 flex items-center gap-2">
        <div
          className={cn(
            "w-full flex border border-gray-300 p-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500",
            "rounded-3xl"
          )}
        >
          <textarea
            ref={textareaRef}
            placeholder="Ask anything..."
            className="flex-1 px-3 overflow-y-auto [scrollbar-gutter:stable] focus:outline-0 self-center resize-none"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={1}
            style={{
              height,
              maxHeight,
              overflowY: height === `${maxHeight}px` ? "auto" : "hidden"
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={isPending}
          />
          <button
            className="p-2 bg-[#F8F8F8] border border-[#DFDFDF] text-[#7E8986] rounded-full text-xl self-end"
            onClick={handleSend}
            disabled={isPending}
          >
            <IoArrowUp />
          </button>
        </div>
      </div>
    </div>
  );
}
