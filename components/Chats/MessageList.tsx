import { AnimatePresence, motion } from "framer-motion";
import { RefObject } from "react";
import { ChatConversation as Conversation } from "@/typescript/interface/chat.interface";
import { Message } from "@/typescript/interface/message.interface";
import ChatMessage from "./ChatMessage";

export type MessageListProps = {
  messages: Message[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  topRef: RefObject<HTMLDivElement | null>;
  conversation?: Conversation;
  currentUserId?: string;
  onReply: React.Dispatch<React.SetStateAction<Message | null>>;
  getKey: (msg: Message) => string;
};

export const MessageList = ({
  messages,
  isLoading,
  isFetchingNextPage,
  topRef,
  conversation,
  currentUserId,
  onReply,
  getKey
}: MessageListProps) => (
  <div className="flex flex-col">
    <div ref={topRef} />
    {isFetchingNextPage && (
      <p className="text-center text-xs">Loading older messages…</p>
    )}
    <AnimatePresence initial={false} mode="popLayout">
      {isLoading ? (
        <div className="space-y-2 flex flex-col">
          <div className="space-y-1">
            <div className="space-x-2 flex items-center">
              <div className="bg-gray-200 size-8 rounded-full animate-pulse" />
              <div className="bg-gray-200 h-8 w-20 rounded-md animate-pulse" />
            </div>
            <div className="space-x-2 flex items-center">
              <div className="bg-gray-200 size-8 rounded-full animate-pulse" />
              <div className="bg-gray-200 h-8 w-40 rounded-md animate-pulse" />
            </div>
            <div className="space-x-2 flex items-center">
              <div className="bg-gray-200 size-8 rounded-full animate-pulse" />
              <div className="bg-gray-200 h-8 w-30 rounded-md animate-pulse" />
            </div>
            <div className="space-x-2 flex items-center">
              <div className="bg-gray-200 size-8 rounded-full animate-pulse" />
              <div className="bg-gray-200 h-8 w-70 rounded-md animate-pulse" />
            </div>
          </div>
          <div className="space-y-1 ml-auto flex flex-col items-end">
            <div className="bg-gray-200 h-8 w-20 rounded-md animate-pulse" />
            <div className="bg-gray-200 h-8 w-35 rounded-md animate-pulse" />
            <div className="bg-gray-200 h-8 w-55 rounded-md animate-pulse" />
          </div>
          <div className="space-y-1">
            <div className="space-x-2 flex items-center">
              <div className="bg-gray-200 size-8 rounded-full animate-pulse" />
              <div className="bg-gray-200 h-8 w-52 rounded-md animate-pulse" />
            </div>
            <div className="space-x-2 flex items-center">
              <div className="bg-gray-200 size-8 rounded-full animate-pulse" />
              <div className="bg-gray-200 h-8 w-34 rounded-md animate-pulse" />
            </div>
          </div>
          <div className="space-y-1 ml-auto flex flex-col items-end">
            <div className="bg-gray-200 h-8 w-44 rounded-md animate-pulse" />
            <div className="bg-gray-200 h-8 w-33 rounded-md animate-pulse" />
            <div className="bg-gray-200 h-8 w-22 rounded-md animate-pulse" />
            <div className="bg-gray-200 h-8 w-44 rounded-md animate-pulse" />
            <div className="bg-gray-200 h-8 w-52 rounded-md animate-pulse" />
            <div className="bg-gray-200 h-8 w-33 rounded-md animate-pulse" />
          </div>
          <div className="space-y-1">
            <div className="space-x-2 flex items-center">
              <div className="bg-gray-200 size-8 rounded-full animate-pulse" />
              <div className="bg-gray-200 h-8 w-64 rounded-md animate-pulse" />
            </div>
            <div className="space-x-2 flex items-center">
              <div className="bg-gray-200 size-8 rounded-full animate-pulse" />
              <div className="bg-gray-200 h-8 w-23 rounded-md animate-pulse" />
            </div>
          </div>
        </div>
      ) : (
        messages.map((msg, idx) => {
          const previous = messages[idx - 1];
          const showAvatar = conversation?.isDeletable
            ? msg.sender?._id !== currentUserId &&
              (!previous || previous.sender?._id !== msg.sender?._id)
            : true;

          return (
            <motion.div
              key={getKey(msg)}
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              <ChatMessage
                sender={msg.sender}
                message={msg}
                showAvatar={showAvatar}
                setReplyingTo={conversation?.isDeletable ? onReply : () => null}
                isGroup={conversation?.type === "group"}
                isDeletable={conversation?.isDeletable}
              />
            </motion.div>
          );
        })
      )}
    </AnimatePresence>
  </div>
);
