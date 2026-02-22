/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useSocket } from "@/lib/socketContext";
import { cn } from "@/lib/utils";
import { Message, MessageStatus } from "@/typescript/interface/message.interface";
import ChatInput from "./ChatInput";
import ChatUploadWithPreview from "./ChatUpload";
import { ChatHeader } from "./ChatHeader";
import { MessageList } from "./MessageList";
import { TypingIndicator } from "./TypingIndicator";
import { ScrollToBottomButton } from "./ScrollToBottomButton";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useConversationDetails } from "@/hooks/useConversationDetails";
import { useChatScroll } from "@/hooks/useChatScroll";
import { useChatSocket } from "@/hooks/useChatSocket";
import { useChatUploadManager } from "@/hooks/useChatUploadManager";
import { getStableMessageKey } from "@/lib/chatMessage";

export default function ChatConversation() {
  const { data } = useSession();
  const socket = useSocket();
  const [room, setSelectedChat] = useQueryState(
    "room",
    parseAsString.withDefault("")
  );

  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [chatDragShow, setChatDragShow] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const messageKeyMap = useRef<Map<string, string>>(new Map());

  const {
    conversation,
    friend,
    details,
    isLoading: isConversationLoading
  } = useConversationDetails(room);

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
  } = useChatMessages(room);

  const {
    topRef,
    bottomRef,
    containerRef,
    isAtBottom,
    setIsAtBottom,
    scrollToBottom
  } = useChatScroll({ room, messages: allMessages });

  const { typingUsers, friendStatus } = useChatSocket({
    room,
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
        upsertIncomingMessage(msg, data?.user?._id, room);
      },
      onReactionUpdate: (messageId, reactions) => {
        updateReactions(messageId, reactions);
      },
      onSeenBulk: ({ chatId, userId }) => {
        markConversationSeen(chatId, userId, data?.user?._id);
      }
    }
  });

  const { uploadFiles } = useChatUploadManager();

  useEffect(() => {
    messageKeyMap.current.clear();
  }, [room]);

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
  }, [fetchNextPage, hasNextPage, room, allMessages.length]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.overflow = chatDragShow ? "hidden" : "auto";
    }
  }, [containerRef, chatDragShow]);

  const handleUpload = (newFiles: File[]) => setFiles(newFiles);

  const handleSend = async (text: string, incomingFiles: File[]) => {
    if (!data?.user?._id || !socket) return;
    if (!text && incomingFiles.length === 0) return;

    setChatDragShow(false);

    const tempId = Date.now().toString();
    const now = new Date().toISOString();

    const optimisticMessage: Omit<Message, "replyTo" | "sender" | "repeat"> & {
      replyTo?: string;
      sender?: string;
    } = {
      chat: room,
      sender: data?.user?._id,
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
        chatId: room,
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

    setTimeout(() => {
      scrollToBottom();
    }, 50);
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full min-h-0 border-r border-l border-gray-200 relative max-md:absolute max-md:w-full ",
        room ? "max-md:left-0" : "max-md:left-[110%]"
      )}
    >
      <ChatHeader
        conversation={conversation}
        details={details}
        isConversationLoading={isConversationLoading}
        friendStatus={friendStatus}
        onBack={() => setSelectedChat("")}
        canManageGroup={
          conversation?.members.find((_mem) => _mem.user._id === data?.user?._id)
            ?.role === "owner"
        }
      />

      <div
        ref={containerRef}
        className={cn("flex-1 min-h-0 overflow-y-auto p-4 bg-gray-50 relative", {
          "p-0": chatDragShow
        })}
        onScroll={() => {
          if (!containerRef.current) return;
          const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
          setIsAtBottom(scrollHeight - scrollTop - clientHeight < 50);
        }}
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes("Files")) setChatDragShow(true);
        }}
        onDragEnd={() => setChatDragShow(false)}
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
        {chatDragShow && conversation?.isDeletable && (
          <ChatUploadWithPreview
            files={files}
            handleUpload={handleUpload}
            setFiles={setFiles}
            setChatDragShow={setChatDragShow}
          />
        )}
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

      <ScrollToBottomButton visible={isAtBottom} onClick={scrollToBottom} />

      {conversation?.isDeletable && (
        <ChatInput
          onSend={handleSend}
          replyingTo={replyingTo}
          setReplyingTo={setReplyingTo}
          files={files}
          setFiles={setFiles}
          setChatDragShow={setChatDragShow}
          receiverName={conversation?.name ?? friend?.user?.fullName ?? ""}
        />
      )}
    </div>
  );
}
