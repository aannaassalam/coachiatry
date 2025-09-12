import { cn } from "@/lib/utils";
import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import assets from "@/json/assets";
import { Button } from "../ui/button";
import EmojiPicker from "./EmojiPicker";
import Image from "next/image";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

type ChatMessageProps = {
  sender: "user" | "other";
  message: string;
  showAvatar?: boolean;
};

export default function ChatMessage({
  sender,
  message,
  showAvatar
}: ChatMessageProps) {
  const isUser = sender === "user";
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  console.log(selectedEmoji);
  return (
    <div
      className={cn(
        "flex my-2 group",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div className="flex items-start gap-3 relative">
        {!isUser && showAvatar && (
          <Avatar className="size-8">
            <AvatarImage src={assets.avatar ?? undefined} alt="AH" />
            <AvatarFallback className=" bg-orange-100 flex items-center justify-center font-semibold text-orange-600">
              AH
            </AvatarFallback>
          </Avatar>
        )}

        {/* If user: Emoji first then bubble; if not user: bubble then emoji */}
        {isUser && (
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
            <PopoverContent className="p-0 bg-transparent">
              <EmojiPicker setSelectedEmoji={setSelectedEmoji} />
            </PopoverContent>
          </Popover>
        )}

        <div
          className={cn(
            "max-w-xs relative px-[14px] py-[7px] rounded-lg rounded-tr-none text-sm",
            isUser ? "bg-primary text-white/80" : "bg-gray-100 text-primary",
            !isUser && !showAvatar && "ml-[2.75rem]",
            selectedEmoji && "mb-1.5"
          )}
        >
          {message}
          {selectedEmoji && (
            <div
              className={cn(
                "absolute bottom-[-10px] left-3 border-1 border-white rounded-full w-3 text-[10px] aspect-square bg-white",
                isUser && "left-auto right-3"
              )}
            >
              {selectedEmoji}
            </div>
          )}
        </div>

        {!isUser && (
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
            <PopoverContent className="p-0 bg-transparent">
              <EmojiPicker setSelectedEmoji={setSelectedEmoji} />
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
}
