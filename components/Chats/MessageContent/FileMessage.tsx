/* eslint-disable @typescript-eslint/no-explicit-any */

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { SmartAvatar } from "@/components/ui/smart-avatar";
import assets from "@/json/assets";
import { useSocket } from "@/lib/socketContext";
import { cn } from "@/lib/utils";
import { queryClient } from "@/pages/_app";
import { PaginatedResponse } from "@/typescript/interface/common.interface";
import {
  Message,
  MessageReaction
} from "@/typescript/interface/message.interface";
import { User } from "@/typescript/interface/user.interface";
import { InfiniteData } from "@tanstack/react-query";
import { Download, FileText, Reply } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { parseAsString, useQueryState } from "nuqs";
import EmojiPicker from "../EmojiPicker";
import { CircularProgress } from "../UploadProgress";

export default function FileMessage({
  sender,
  message,
  showAvatar,
  setReplyingTo,
  overallProgress
}: {
  sender?: User;
  message: Message;
  showAvatar?: boolean;
  setReplyingTo: React.Dispatch<React.SetStateAction<Message | null>>;
  overallProgress?: number;
}) {
  const { data } = useSession();
  const socket = useSocket();
  const isUser = sender?._id === data?.user?._id || sender === data?.user?._id;
  const reactions = message?.reactions ?? [];

  const [room] = useQueryState("room", parseAsString.withDefault(""));

  const handleReaction = (emoji: string) => {
    socket?.emit("add_reaction", {
      messageId: message._id,
      userId: data?.user?._id,
      emoji
    });

    // ✅ Optimistic update for infinite query
    queryClient.setQueryData<InfiniteData<PaginatedResponse<Message[]>>>(
      ["messages", room],
      (old) => {
        if (!old) return old;

        const updatedPages = old.pages.map((page) => {
          return {
            ...page,
            data: page.data.map((m) => {
              if (m._id !== message._id) return m;

              const hasSame = m.reactions?.some(
                (r: MessageReaction) =>
                  r.user === data?.user?._id && r.emoji === emoji
              );

              let newReactions: MessageReaction[];

              if (hasSame) {
                // toggle off
                newReactions =
                  m.reactions?.filter(
                    (r: MessageReaction) =>
                      !(r.user === data?.user?._id && r.emoji === emoji)
                  ) ?? [];
              } else {
                // replace old reaction if exists
                newReactions =
                  m.reactions?.filter(
                    (r: MessageReaction) => r.user !== data?.user?._id
                  ) ?? [];
                newReactions.push({
                  user: data?.user?._id,
                  emoji,
                  reactedAt: new Date().toISOString()
                });
              }

              return { ...m, reactions: newReactions };
            })
          };
        });

        return { ...old, pages: updatedPages };
      }
    );
  };

  const handleRemoveReaction = () => {
    socket?.emit("remove_reaction", {
      messageId: message._id,
      userId: data?.user?._id
    });

    // ✅ Optimistic update for infinite query
    queryClient.setQueryData<InfiniteData<PaginatedResponse<Message[]>>>(
      ["messages", room],
      (old) => {
        if (!old) return old;

        const updatedPages = old.pages.map((page) => {
          return {
            ...page,
            data: page.data.map((m) => {
              if (m._id !== message._id) return m;

              // remove all reactions from this user
              const newReactions =
                m.reactions?.filter(
                  (r: MessageReaction) => r.user !== data?.user?._id
                ) ?? [];

              return { ...m, reactions: newReactions };
            })
          };
        });

        return { ...old, pages: updatedPages };
      }
    );
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
  };

  if (!message.files?.length) return null;
  const showProgress =
    typeof overallProgress === "number" && overallProgress < 100;

  return (
    <div className="flex items-start gap-3 relative">
      {!isUser && showAvatar && (
        <SmartAvatar
          src={sender?.photo}
          name={sender?.fullName}
          key={sender?.updatedAt}
          className="size-8"
        />
      )}

      {/* If user: Emoji first then bubble; if not user: bubble then emoji */}
      {isUser && !showProgress && (
        <div className="self-center">
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-secondary self-center p-2 aspect-square opacity-0 group-hover:opacity-100"
            onClick={() => setReplyingTo(message)}
          >
            <Reply size={15} />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-secondary self-center p-2 aspect-square opacity-0 group-hover:opacity-100"
              >
                <Image
                  src={assets.icons.emoji}
                  width={15}
                  height={15}
                  alt="emoji"
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="p-0 bg-transparent border-none shadow-none w-auto"
              side="top" // 👈 prefers top
              align="start" // 👈 aligns with button
              sideOffset={8} // 👈 adds spacing from the trigger
              avoidCollisions
              collisionPadding={50}
              sticky="always"
            >
              <EmojiPicker setSelectedEmoji={handleReaction} />
            </PopoverContent>
          </Popover>
        </div>
      )}

      <div
        className={cn(
          "max-w-xs relative px-[7px] py-[7px] rounded-lg rounded-tr-none text-sm ",
          !isUser && !showAvatar && "ml-[2.75rem]"
        )}
      >
        {typeof message.replyTo !== "string" &&
          !!Object.keys(message.replyTo ?? {}).length && (
            <div
              className={cn(
                "flex gap-1 mb-2 bg-gray-100 p-2 pl-1 rounded text-primary",
                {
                  "bg-white/70": !isUser
                }
              )}
            >
              <div className="w-1 rounded-lg bg-primary" />
              <div className="flex-1">
                <p className="text-xs">
                  {message.replyTo?.sender?._id === data?.user?._id
                    ? "You"
                    : message.replyTo?.sender?.fullName}
                </p>
                <p className="truncate min-w-0">
                  {message.replyTo?.content ||
                    (message.replyTo?.type === "image"
                      ? `📷 ${message.replyTo.files?.length} images`
                      : message.replyTo?.type === "video"
                        ? `🎥 ${message.replyTo.files?.length} videos`
                        : `📁 ${message.replyTo?.files?.length} files`)}
                </p>
              </div>
            </div>
          )}
        <div className="flex flex-col gap-6 w-full max-w-xs">
          {message.files?.map((f, i) => {
            const fileName =
              (f as any).filename ?? decodeURIComponent(f.url).split("/").pop();
            const ext =
              fileName.split(".").pop()?.toUpperCase() ||
              f.type.split("/")[1]?.toUpperCase() ||
              "FILE";

            const showLocalProgress =
              typeof f.progress === "number" && f.progress < 100;

            return (
              <a
                href={showLocalProgress ? undefined : f.url} // ❌ disable link when uploading
                download={!showLocalProgress}
                key={i}
                target={showLocalProgress ? undefined : "_blank"} // ❌ avoid opening new tab
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (showLocalProgress) e.preventDefault(); // prevent navigation
                }}
                className={cn(
                  "group flex items-center gap-3 p-3 rounded-xl border transition relative",
                  "border-gray-200",
                  isUser ? "bg-primary text-white" : "bg-gray-100 text-primary",
                  showLocalProgress &&
                    "pointer-events-none opacity-70 cursor-not-allowed"
                )}
              >
                {/* ✅ Thumbnail or icon */}
                <div
                  className={cn(
                    "relative flex-shrink-0 w-14 h-14 rounded-md bg-gray-200/70 flex items-center justify-center overflow-hidden",
                    {
                      "bg-[#474E6D]": isUser
                    }
                  )}
                >
                  <FileText
                    className={isUser ? "text-gray-300" : "text-red-500"}
                    size={18}
                  />
                </div>

                {/* ✅ File info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{fileName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {ext} • {formatSize(Number(f.size))}
                  </p>
                </div>

                {/* ✅ Download button */}
                {showLocalProgress ? (
                  <CircularProgress progress={f.progress ?? 0} radius={17} />
                ) : (
                  <Download
                    size={18}
                    className={
                      isUser
                        ? "text-gray-200 hover:text-gray-400"
                        : "text-gray-500 hover:text-gray-700"
                    }
                  />
                )}
                {reactions.length > 0 && (
                  <div
                    className={cn(
                      "absolute -bottom-4 left-3 border-1 border-white rounded-full py-0.5 px-1 flex items-center justify-center text-sm bg-white shadow gap-1",
                      isUser && "left-auto right-3"
                    )}
                  >
                    {reactions.map((_reaction) => (
                      <span
                        className="leading-[15px] cursor-pointer"
                        onClick={() => {
                          if (_reaction.user === data?.user?._id)
                            handleRemoveReaction();
                        }}
                        key={_reaction._id}
                      >
                        {_reaction.emoji}
                      </span>
                    ))}
                  </div>
                )}
              </a>
            );
          })}
        </div>
        <p className="wrap-break-word mt-1">{message.content}</p>
        {/* ✅ Upload Progress Overlay */}
      </div>

      {!isUser && !showProgress && (
        <div className="self-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-secondary self-center p-2 aspect-square opacity-0 group-hover:opacity-100"
              >
                <Image
                  src={assets.icons.emoji}
                  width={15}
                  height={15}
                  alt="emoji"
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="p-0 bg-transparent shadow-none border-none"
              side="top" // 👈 prefers top
              align="center" // 👈 aligns with button
              sideOffset={8} // 👈 adds spacing from the trigger
              avoidCollisions
              collisionPadding={50}
              sticky="always"
            >
              <EmojiPicker setSelectedEmoji={handleReaction} />
            </PopoverContent>
          </Popover>
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-secondary self-center p-2 aspect-square opacity-0 group-hover:opacity-100"
            onClick={() => setReplyingTo(message)}
          >
            <Reply size={15} />
          </Button>
        </div>
      )}
    </div>
  );
}
