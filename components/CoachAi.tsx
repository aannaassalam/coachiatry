/* eslint-disable @typescript-eslint/no-explicit-any */
import { chatWithAi } from "@/external-api/functions/ai.api";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { FaFire } from "react-icons/fa6";
import { HiLightningBolt } from "react-icons/hi";
import { IoArrowUp } from "react-icons/io5";
import { LuFileText } from "react-icons/lu";
import { RiDvdAiFill } from "./RiDvdAiFill";
import { SmartAvatar } from "./ui/smart-avatar";

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

export default function CoachAI({ page, id }: { page: string; id?: string }) {
  const { data } = useSession();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [value, setValue] = useState("");
  const [height] = useState("auto");
  const [maxHeight] = useState<number | undefined>();

  const [chats, setChats] = useState<{ role: string; data: any }[]>([]);

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
          data: variable.query ?? getFullMessages(variable.action ?? "")
        }
      ]);
    },
    onSuccess: (data) => {
      setChats((prev) => [...prev, { role: "system", ...data }]);
    },
    meta: {
      showToast: false
    }
  });

  const handleSend = () => {
    if (value.trim()) {
      mutate({ query: value, page, id });
    }
  };

  return (
    <div className="flex flex-col w-[400px] h-[600px] mx-auto rounded-2xl shadow-lg border border-gray-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="bg-[url('/assets/images/ai-background.png')] bg-right bg-cover text-white p-6">
        <RiDvdAiFill className="mb-9 size-9" />
        <h1 className="text-3xl font-semibold">Hello</h1>
        <p className="text-3xl font-semibold mt-1 opacity-90">
          How can I help you
        </p>
      </div>

      {/* Body */}
      <div className="flex-1 pt-6 p-5 overflow-y-auto">
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
                    onClick={() => mutate({ page, action: "create_tasks", id })}
                  >
                    <LuFileText className="size-5 text-[#777878]" /> Generate a
                    Task
                  </button>
                  <button
                    className="flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-100 transition text-gray-700 text-sm font-medium"
                    onClick={() =>
                      mutate({ page, action: "create_document", id })
                    }
                  >
                    <HiLightningBolt className="size-5 text-[#777878]" /> Create
                    a doc
                  </button>
                  <button
                    className="flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-100 transition text-gray-700 text-sm font-medium"
                    onClick={() => mutate({ page, action: "summarize", id })}
                  >
                    <FaFire className="size-5 text-[#777878]" /> Summarize
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        {chats.map((_chat, index) => {
          return (
            <div
              className={cn("flex items-start gap-2 mb-6", {
                "max-w-4/5 ml-auto justify-end": _chat.role === "user"
              })}
              key={index}
            >
              {_chat.role === "system" && (
                <RiDvdAiFill className="size-6 text-black mt-0.5" />
              )}
              <div
                className={cn({
                  " bg-gray-200 rounded-md": _chat.role === "user",
                  "flex-1": _chat.role === "system"
                })}
              >
                <div
                  className={cn(
                    "text-gray-700 text-sm font-medium font-lato inline-block",
                    {
                      "p-2": _chat.role === "user"
                    }
                  )}
                  dangerouslySetInnerHTML={{ __html: _chat.data }}
                />
              </div>
              {_chat.role === "user" && (
                <SmartAvatar
                  src={data?.user?.photo}
                  name={data?.user?.fullName}
                  className="size-6"
                  textSize="text-sm"
                />
              )}
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
