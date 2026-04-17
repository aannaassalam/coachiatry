/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { MessageList } from "@/components/Chats/MessageList";
import { TypingIndicator } from "@/components/Chats/TypingIndicator";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useChatScroll } from "@/hooks/useChatScroll";
import { useChatSocket } from "@/hooks/useChatSocket";
import { useChatUploadManager } from "@/hooks/useChatUploadManager";
import { useConversationDetails } from "@/hooks/useConversationDetails";
import { getStableMessageKey } from "@/lib/chatMessage";
import { useSocket } from "@/lib/socketContext";
import {
  Message,
  MessageStatus
} from "@/typescript/interface/message.interface";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import FloatingChatInput from "./FloatingChatInput";

type Props = {
  roomId: string;
};

export default function FloatingChatWindow({ roomId }: Props) {
  const { data } = useSession();
  const socket = useSocket();
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const messageKeyMap = useRef<Map<string, string>>(new Map());

  const { conversation, friend } = useConversationDetails(roomId);

  const {
    allMessages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isMessageLoading,
    insertOptimisticMessage,
    updateMessageByTempId,
    upsertIncomingMessage,
    updateReactions,
    markConversationSeen
  } = useChatMessages(roomId);

  const { topRef, bottomRef, containerRef, setIsAtBottom, scrollToBottom } =
    useChatScroll({ room: roomId, messages: allMessages });

  const { typingUsers } = useChatSocket({
    room: roomId,
    conversation,
    friendId: friend?.user._id,
    handlers: {
      onNewMessage: (msg) => {
        if (msg.tempId && msg._id) {
          const oldKey = messageKeyMap.current.get(msg.tempId);
          if (oldKey) {
            messageKeyMap.current.set(msg._id, oldKey);
          }
        }
        upsertIncomingMessage(msg, data?.user?._id, roomId);
      },
      onReactionUpdate: (messageId, reactions) =>
        updateReactions(messageId, reactions),
      onSeenBulk: ({ chatId, userId }) =>
        markConversationSeen(chatId, userId, data?.user?._id)
    }
  });

  const { uploadFiles } = useChatUploadManager();

  useEffect(() => {
    messageKeyMap.current.clear();
  }, [roomId]);

  useEffect(() => {
    if (!topRef.current || !containerRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          const prevHeight = containerRef.current!.scrollHeight;
          fetchNextPage().then(() => {
            requestAnimationFrame(() => {
              if (containerRef.current) {
                containerRef.current.scrollTop =
                  containerRef.current.scrollHeight - prevHeight;
              }
            });
          });
        }
      },
      { root: containerRef.current, threshold: 0.1 }
    );
    observer.observe(topRef.current);
    return () => observer.disconnect();
  }, [
    fetchNextPage,
    hasNextPage,
    roomId,
    allMessages.length,
    containerRef,
    topRef
  ]);

  const handleSend = async (text: string, incomingFiles: File[]) => {
    if (!data?.user?._id || !socket) return;
    if (!text && incomingFiles.length === 0) return;

    const tempId = Date.now().toString();
    const now = new Date().toISOString();

    const optimisticMessage: Omit<Message, "replyTo" | "sender" | "repeat"> & {
      replyTo?: string;
      sender?: string;
    } = {
      chat: roomId,
      sender: data.user._id,
      type:
        incomingFiles.length > 0
          ? incomingFiles[0].type.startsWith("image")
            ? "image"
            : incomingFiles[0].type.startsWith("video")
              ? "video"
              : "file"
          : ("text" as Message["type"]),
      content: text,
      replyTo: replyingTo?._id,
      files: incomingFiles.map((f) => ({
        url: URL.createObjectURL(f),
        type: f.type.startsWith("video")
          ? "video"
          : f.type.startsWith("image")
            ? "image"
            : "file",
        size: f.size,
        thumbnailUrl: null,
        duration: null,
        uploading: true,
        progress: 0,
        filename: f.name
      })),
      tempId,
      status: "pending" as MessageStatus,
      createdAt: now,
      overallProgress: 0
    };

    insertOptimisticMessage(optimisticMessage as unknown as Message);

    if (incomingFiles.length > 0) {
      await uploadFiles(tempId, incomingFiles, {
        chatId: roomId,
        onProgress: (overallPct, perFile) => {
          updateMessageByTempId(tempId, (m) => ({
            ...m,
            overallProgress: overallPct < 100 ? overallPct : 0,
            files: m.files?.map((file, idx) => ({
              ...file,
              progress: perFile[idx] ?? file.progress ?? 0
            }))
          }));
        },
        onFinish: (uploadedFiles) => {
          updateMessageByTempId(tempId, (m) => ({
            ...m,
            files: uploadedFiles.map((f) => ({
              ...f,
              thumbnailUrl: f.thumbnailUrl ?? null,
              duration: (f as any).duration ?? null,
              uploading: false,
              progress: 100
            })),
            status: uploadedFiles.length > 0 ? "sent" : "failed",
            overallProgress: 100
          }));
          if (uploadedFiles.length > 0) {
            socket.emit("send_message", {
              ...optimisticMessage,
              files: uploadedFiles,
              status: "sent"
            });
          }
        }
      });
    } else {
      socket.emit("send_message", optimisticMessage);
    }

    setReplyingTo(null);
    setTimeout(() => scrollToBottom(), 50);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-gray-50">
      <div
        ref={containerRef}
        className="flex-1 min-h-0 overflow-y-auto px-2 py-1"
        onScroll={() => {
          if (!containerRef.current) return;
          const { scrollTop, scrollHeight, clientHeight } =
            containerRef.current;
          setIsAtBottom(scrollHeight - scrollTop - clientHeight < 50);
        }}
      >
        <MessageList
          messages={allMessages}
          isLoading={isMessageLoading}
          isFetchingNextPage={isFetchingNextPage}
          topRef={topRef}
          conversation={conversation}
          currentUserId={data?.user?._id}
          onReply={setReplyingTo}
          getKey={(msg) => getStableMessageKey(messageKeyMap, msg)}
        />
        <div ref={bottomRef} />
      </div>

      <TypingIndicator
        text={
          typingUsers.length > 0
            ? conversation?.type === "direct"
              ? "Typing..."
              : "Someone is typing..."
            : ""
        }
      />

      {conversation?.isDeletable && (
        <FloatingChatInput
          roomId={roomId}
          onSend={handleSend}
          replyingTo={replyingTo}
          setReplyingTo={setReplyingTo}
        />
      )}
    </div>
  );
}
