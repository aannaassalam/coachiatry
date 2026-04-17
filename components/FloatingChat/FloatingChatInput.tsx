"use client";

import EmojiPicker from "@/components/Chats/EmojiPicker";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { useSocket } from "@/lib/socketContext";
import { cn } from "@/lib/utils";
import { Message } from "@/typescript/interface/message.interface";
import { AnimatePresence, motion } from "framer-motion";
import { Paperclip, Send, Smile, X } from "lucide-react";
import { useSession } from "next-auth/react";
import {
  Dispatch,
  SetStateAction,
  useLayoutEffect,
  useRef,
  useState
} from "react";

type Props = {
  roomId: string;
  onSend: (text: string, files: File[]) => void;
  replyingTo: Message | null;
  setReplyingTo: Dispatch<SetStateAction<Message | null>>;
};

export default function FloatingChatInput({
  roomId,
  onSend,
  replyingTo,
  setReplyingTo
}: Props) {
  const { data } = useSession();
  const socket = useSocket();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [value, setValue] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight);
    const maxHeight = lineHeight * 5;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, maxHeight) + "px";
    el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [value, replyingTo]);

  const send = () => {
    if (!value.trim() && files.length === 0) return;
    onSend(value, files);
    setValue("");
    setFiles([]);
    setReplyingTo(null);
    socket?.emit("stop_typing", { chatId: roomId, userId: data?.user?._id });
  };

  const handleTyping = (next: string) => {
    setValue(next);
    if (!socket || !roomId) return;

    if (next.trim()) {
      socket.emit("typing", { chatId: roomId, userId: data?.user?._id });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stop_typing", {
          chatId: roomId,
          userId: data?.user?._id
        });
      }, 1500);
    } else {
      socket.emit("stop_typing", { chatId: roomId, userId: data?.user?._id });
    }
  };

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const picked = Array.from(fileList);
    if (picked.length) setFiles((prev) => [...prev, ...picked]);
  };

  const insertEmoji = (emoji: string) => {
    const el = textareaRef.current;
    if (!el) {
      setValue((v) => v + emoji);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = value.substring(0, start) + emoji + value.substring(end);
    setValue(next);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + emoji.length;
    });
  };

  const replyPreviewText = (() => {
    if (!replyingTo) return "";
    if (replyingTo.content) return replyingTo.content;
    if (replyingTo.type === "image")
      return `📷 ${replyingTo.files?.length ?? 1} image${
        (replyingTo.files?.length ?? 1) > 1 ? "s" : ""
      }`;
    if (replyingTo.type === "video")
      return `🎥 ${replyingTo.files?.length ?? 1} video${
        (replyingTo.files?.length ?? 1) > 1 ? "s" : ""
      }`;
    if (replyingTo.type === "file")
      return `📁 ${replyingTo.files?.length ?? 1} file${
        (replyingTo.files?.length ?? 1) > 1 ? "s" : ""
      }`;
    return "";
  })();

  const canSend = value.trim().length > 0 || files.length > 0;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        send();
      }}
      className="border-t bg-white px-2 py-2"
    >
      <AnimatePresence initial={false}>
        {replyingTo && (
          <motion.div
            key={`reply-${replyingTo._id ?? replyingTo.tempId}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="flex items-stretch gap-2 bg-gray-100 rounded-md px-2 py-1.5 mb-2">
              <div className="w-0.5 bg-primary rounded-sm" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-primary leading-tight">
                  Replying to{" "}
                  {replyingTo.sender?._id === data?.user?._id
                    ? "yourself"
                    : (replyingTo.sender?.fullName ?? "message")}
                </p>
                <p className="text-xs text-gray-600 truncate leading-tight mt-0.5">
                  {replyPreviewText}
                </p>
              </div>
              <button
                type="button"
                className="self-start text-gray-500 hover:text-gray-800 p-0.5"
                onClick={() => setReplyingTo(null)}
                aria-label="Cancel reply"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {files.length > 0 && (
          <motion.div
            key="file-strip"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex gap-2 overflow-x-auto pb-2"
          >
            {files.map((file, idx) => (
              <div
                key={`${file.name}-${idx}`}
                className="relative flex items-center gap-2 bg-gray-100 rounded-md px-2 py-1 text-xs flex-shrink-0 max-w-[180px]"
              >
                <span className="truncate">{file.name}</span>
                <button
                  type="button"
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() =>
                    setFiles((prev) => prev.filter((_, i) => i !== idx))
                  }
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-1 border border-gray-200 rounded-lg px-1.5 py-1.5 bg-white focus-within:border-primary/40 transition-colors">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => handleTyping(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Type a message..."
          rows={1}
          className={cn(
            "flex-1 resize-none text-sm leading-6 px-1.5 focus:outline-none bg-transparent min-h-6",
            "placeholder:text-gray-400"
          )}
        />

        <div className="self-end flex items-center gap-0.5 flex-shrink-0">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                center
                className="size-8 p-0 rounded-md text-gray-500 hover:text-gray-800"
              >
                <Smile size={16} />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="p-0 bg-transparent shadow-none border-none"
              side="top"
              align="end"
              sideOffset={8}
              collisionPadding={16}
            >
              <EmojiPicker largePicker setSelectedEmoji={insertEmoji} />
            </PopoverContent>
          </Popover>

          <Button
            type="button"
            variant="ghost"
            center
            className="size-8 p-0 rounded-md text-gray-500 hover:text-gray-800"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip size={16} />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
          />

          <Button
            type="submit"
            center
            className="size-8 p-0 rounded-md"
            disabled={!canSend}
          >
            <Send size={14} />
          </Button>
        </div>
      </div>
    </form>
  );
}
