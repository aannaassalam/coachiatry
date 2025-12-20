"use client";

import {
  Dispatch,
  SetStateAction,
  useLayoutEffect,
  useRef,
  useState
} from "react";
// import Toolbar from "@/ui/MarkdownEditor/Toolbar";
// import { GoClock } from "react-icons/go";
import assets from "@/json/assets";
import { useSocket } from "@/lib/socketContext";
import { Message } from "@/typescript/interface/message.interface";
import { AnimatePresence, motion } from "framer-motion";
import { Files, Image as ImageIcon, Video, X } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { parseAsString, useQueryState } from "nuqs";
import CoachAI from "../CoachAIPopover";
import { Button } from "../ui/button";
import { Dialog } from "../ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "../ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import EmojiPicker from "./EmojiPicker";
import ScheduleMessageModal from "./ScheduleModal";

const InputButtons = ({
  handleSubmit,
  setModalOpen,
  insertEmoji,
  files,
  setFiles,
  setChatDragShow
}: {
  handleSubmit: () => void;
  setModalOpen: Dispatch<SetStateAction<boolean>>;
  insertEmoji: (emoji: string) => void;
  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
  setChatDragShow: (show: boolean) => void;
}) => {
  const [room] = useQueryState("room", parseAsString.withDefault(""));
  const [open, setOpen] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOpen(false);
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      const updated = [...files, ...selectedFiles];
      setFiles(updated);
      setChatDragShow(true); // show upload preview
    }
    e.target.value = "";
  };

  return (
    <div className="flex items-stretch self-end">
      {files.length === 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setModalOpen(true)}
              className="hover:bg-secondary p-2 aspect-square"
            >
              <Image
                src={assets.icons.clock}
                width={15}
                height={15}
                alt="clock"
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Schedule Send</TooltipContent>
        </Tooltip>
      )}
      <Tooltip>
        <Popover>
          <PopoverTrigger asChild>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="hover:bg-secondary p-2 aspect-square"
              >
                <Image
                  src={assets.icons.chatEmoji}
                  width={15}
                  height={15}
                  alt="emoji"
                />
              </Button>
            </TooltipTrigger>
          </PopoverTrigger>
          <PopoverContent
            className="p-0 bg-transparent shadow-none border-none"
            side="top" // 👈 prefers top
            align="center" // 👈 aligns with button
            sideOffset={8} // 👈 adds spacing from the trigger
            avoidCollisions
            collisionPadding={50}
          >
            <EmojiPicker largePicker={true} setSelectedEmoji={insertEmoji} />
          </PopoverContent>
        </Popover>
        <TooltipContent>Emoji Panel</TooltipContent>
      </Tooltip>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="hover:bg-secondary p-2 aspect-square"
                asChild
              >
                <Image
                  src={assets.icons.clip}
                  width={15}
                  height={15}
                  alt="clip"
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Attachment</TooltipContent>
          </Tooltip>
        </DropdownMenuTrigger>
        <DropdownMenuContent sideOffset={15}>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <label className="flex-1 inline-flex items-center gap-2">
              <ImageIcon />
              Images
              <input
                // ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="absolute inset-0 opacity-0 cursor-pointer"
                style={{ display: "none" }} // keep truly hidden
              />
            </label>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <label className="flex-1 inline-flex items-center gap-2">
              <Video />
              Videos
              <input
                // ref={fileInputRef}
                type="file"
                multiple
                accept="video/*"
                onChange={handleFileSelect}
                className="absolute inset-0 opacity-0 cursor-pointer"
                style={{ display: "none" }} // keep truly hidden
              />
            </label>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <label className="flex-1 inline-flex items-center gap-2">
              <Files />
              Documents
              <input
                // ref={fileInputRef}
                type="file"
                multiple
                accept="application/*"
                onChange={handleFileSelect}
                className="absolute inset-0 opacity-0 cursor-pointer"
                style={{ display: "none" }} // keep truly hidden
              />
            </label>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Popover modal>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="hover:bg-secondary aspect-square border-1 border-gray-300 bg-[#F8F8F8] p-2 mr-2 ml-1"
          >
            <Image
              src={assets.icons.coachAi}
              width={15}
              height={15}
              alt="coachAi"
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="border-none shadow-none bg-transparent max-md:!translate-x-0"
          side="bottom"
          align="center"
          collisionPadding={180}
        >
          <CoachAI size="small" id={room} page="chat" />
        </PopoverContent>
      </Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleSubmit}
            size="sm"
            className="aspect-square p-2"
          >
            <Image src={assets.icons.send} width={15} height={15} alt="send" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Send</TooltipContent>
      </Tooltip>
    </div>
  );
};

export default function ChatInput({
  onSend,
  replyingTo,
  setReplyingTo,
  files,
  setFiles,
  setChatDragShow,
  receiverName
}: {
  onSend: (msg: string, files: File[]) => void;
  replyingTo: Message | null;
  setReplyingTo: React.Dispatch<React.SetStateAction<Message | null>>;
  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
  setChatDragShow: (show: boolean) => void;
  receiverName: string;
}) {
  const { data } = useSession();
  const socket = useSocket();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [room] = useQueryState("room", parseAsString.withDefault(""));

  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);

  const resizeTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;

    const lineHeight = parseFloat(getComputedStyle(el).lineHeight);
    const maxHeight = lineHeight * 6;

    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, maxHeight) + "px";
    el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
  };

  useLayoutEffect(() => {
    resizeTextarea();
  }, [value, replyingTo]);

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // Insert emoji at cursor
    const newValue = value.substring(0, start) + emoji + value.substring(end);

    setValue(newValue);

    // Put cursor after emoji
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
    });
  };

  const handleSend = () => {
    if (!value.trim() && files.length === 0) return;
    onSend(value, files);
    setValue("");
    setFiles([]);
    setReplyingTo(null);
    socket?.emit("stop_typing", { chatId: room, userId: data?.user?._id });
  };

  const handleTyping = (value: string) => {
    setValue(value);

    if (value.trim()) {
      socket?.emit("typing", { chatId: room, userId: data?.user?._id });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket?.emit("stop_typing", { chatId: room, userId: data?.user?._id });
      }, 1500);
    } else {
      socket?.emit("stop_typing", { chatId: room, userId: data?.user?._id });
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSend();
      }}
      className="flex items-center p-5 pt-3.5 border-t bg-white max-md:p-3 max-md:pb-0"
    >
      <div className="border rounded-md flex-1 overflow-hidden">
        <div className="bg-white min-h-[48px] px-3 py-2 flex flex-col w-full relative">
          <AnimatePresence>
            {!!replyingTo && (
              <motion.div
                key={replyingTo._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8, height: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                layout // 👈 auto-animates height collapse smoothly
                className="flex gap-1 mb-2 bg-gray-100 p-2 rounded"
              >
                <div className="w-1 rounded-lg bg-primary" />
                <motion.div
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1, ease: "linear" }}
                  className="flex-1"
                >
                  <p className="text-xs">
                    {replyingTo?.sender?._id === data?.user?._id
                      ? "You"
                      : replyingTo?.sender?.fullName}
                  </p>
                  <p className="truncate min-w-0">
                    {replyingTo?.content ||
                      (replyingTo.type === "image"
                        ? `📷 ${replyingTo.files?.length} images`
                        : replyingTo.type === "video"
                          ? `🎥 ${replyingTo.files?.length} videos`
                          : `📁 ${replyingTo.files?.length} files`)}
                  </p>
                </motion.div>
                <span
                  className="cursor-pointer"
                  onClick={() => setReplyingTo(null)}
                >
                  <X className="size-5 text-gray-400" />
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex-1 flex items-center">
            <motion.textarea
              ref={textareaRef}
              value={value}
              placeholder="Type..."
              onChange={(e) => handleTyping(e.target.value)}
              className="flex-1 pr-4 resize-none overflow-y-auto [scrollbar-gutter:stable] focus:outline-0 self-center "
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
            />
            {/* <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={
                value.trim()
                  ? { scale: 1, opacity: 1 }
                  : { scale: 0.8, opacity: 0 }
              }
              transition={{ duration: 0.2 }}
            > */}
            <InputButtons
              handleSubmit={handleSend}
              setModalOpen={setOpen}
              insertEmoji={insertEmoji}
              files={files}
              setFiles={setFiles}
              setChatDragShow={setChatDragShow}
            />
            {/* </motion.div> */}

            {/* <ChatToolbar editor={editor} showToolBar={showToolBar} /> */}
            <Dialog open={open} onOpenChange={setOpen}>
              <ScheduleMessageModal
                message={value}
                receiverName={receiverName}
                onClose={() => setOpen(false)}
              />
            </Dialog>
          </div>
        </div>
      </div>
    </form>
  );
}
