"use client";

import { getConversation } from "@/external-api/functions/chat.api";
import { getMessages } from "@/external-api/functions/message.api";
import assets from "@/json/assets";
import { useSocket } from "@/lib/socketContext";
import { queryClient } from "@/pages/_app";
import { ChatConversation as Conversation } from "@/typescript/interface/chat.interface";
import {
  InfiniteData,
  PaginatedResponse
} from "@/typescript/interface/common.interface";
import {
  Message,
  MessageStatus
} from "@/typescript/interface/message.interface";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Ellipsis } from "lucide-react";
import moment from "moment";
import { useSession } from "next-auth/react";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useMemo, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import ChatInput from "./ChatInput";
import ChatMessage from "./ChatMessage";
import { cn } from "@/lib/utils";
import { BsChevronLeft } from "react-icons/bs";

export default function ChatConversation() {
  const topRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const didInitialScroll = useRef(false);
  const prevMessageCount = useRef(0);
  const socket = useSocket();
  const { data } = useSession();
  const [room, setSelectedChat] = useQueryState(
    "room",
    parseAsString.withDefault("")
  );
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  const {
    data: messagesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useInfiniteQuery({
    queryKey: ["messages", room],
    queryFn: getMessages,
    initialPageParam: 1,
    enabled: !!room,
    getNextPageParam: (lastPage) => {
      if (lastPage.meta.currentPage < lastPage.meta.totalPages) {
        return lastPage.meta.currentPage + 1;
      }
      return undefined;
    }
  });

  const { data: conversation, isLoading: isConversationLoading } = useQuery({
    queryKey: ["conversations", room],
    queryFn: () => getConversation(room),
    enabled: !!room
  });

  const friend = conversation?.members?.find(
    (_member) => _member.user._id !== data?.user?._id
  );

  /**
   * IMPORTANT:
   * - Backend pages: pages[0] = newest page (messages newest -> oldest within page)
   * - We want to render oldest -> newest (top -> bottom)
   * => Reverse pages order and reverse each page.data
   */
  const allMessages = useMemo(
    () =>
      messagesData?.pages
        .slice()
        .reverse()
        .flatMap((page) => [...page.data].reverse()) ?? [],
    [messagesData]
  );

  useEffect(() => {
    // Reset scroll state on room change
    didInitialScroll.current = false;
    prevMessageCount.current = 0;
  }, [room]);

  useEffect(() => {
    if (!allMessages || !bottomRef.current) return;

    const newCount = allMessages.length;

    // First load -> jump to bottom (newest)
    if (!didInitialScroll.current && newCount > 0) {
      bottomRef.current.scrollIntoView({ behavior: "auto", block: "end" });
      didInitialScroll.current = true;
      prevMessageCount.current = newCount;
      return;
    }

    // If user is at bottom and new messages arrived, scroll smoothly down
    if (newCount > prevMessageCount.current && isAtBottom) {
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      });
    }

    prevMessageCount.current = newCount;
  }, [allMessages, isAtBottom]);

  // SOCKET HANDLERS
  useEffect(() => {
    if (!socket) return;
    if (!room) return;

    socket.emit("join_room", { chatId: room, userId: data?.user?._id });

    // NEW MESSAGE (from server)
    socket.on("new_message", (msg: Message) => {
      if (msg.chat !== room) return;

      queryClient.setQueryData<InfiniteData<PaginatedResponse<Message[]>>>(
        ["messages", room],
        (old) => {
          if (!old) return old;

          const updatedPages = old.pages.map((page, idx) => {
            if (idx !== 0) return page; // only update first (newest) page data

            // find optimistic message by tempId (on newest page)
            const tempIdx = page.data.findIndex(
              (m) => m.tempId && m.tempId === msg.tempId
            );

            // prevent duplicates: check by _id or tempId
            const alreadyExists = page.data.some(
              (m) =>
                (m._id && msg._id && m._id === msg._id) ||
                (m.tempId && msg.tempId && m.tempId === msg.tempId)
            );

            if (tempIdx > -1) {
              // Replace optimistic message (keep position in page.data)
              const newData = [...page.data];
              newData[tempIdx] = {
                ...msg,
                status: "delivered" as MessageStatus
              };
              return { ...page, data: newData };
            }

            if (alreadyExists) {
              return page;
            }

            // **Append** to the end of page.data (newest at bottom after our flattening)
            return {
              ...page,
              data: [
                { ...msg, status: "delivered" as MessageStatus },
                ...page.data
              ]
            };
          });

          return { ...old, pages: updatedPages };
        }
      );

      // Update conversation preview list
      queryClient.setQueryData<PaginatedResponse<Conversation[]>>(
        ["conversations"],
        (old) => {
          if (!old) return old;

          const idx = old.data.findIndex((c) => c._id === msg.chat);

          let newData: Conversation[];

          if (idx > -1) {
            const updatedConv = {
              ...old.data[idx],
              lastMessage: msg,
              updatedAt: msg.updatedAt ?? new Date().toISOString()
            };

            newData = [...old.data];
            newData[idx] = updatedConv;
          } else {
            newData = [...old.data];
          }

          newData.sort(
            (a, b) =>
              moment(b.updatedAt).valueOf() - moment(a.updatedAt).valueOf()
          );

          return { ...old, data: newData };
        }
      );
    });

    // Delivery, seen, reaction updates (same as before)
    socket.on("message_delivered_update", (incoming: Message) => {
      queryClient.setQueryData<InfiniteData<PaginatedResponse<Message[]>>>(
        ["messages", room],
        (old) => {
          if (!old) return old;
          const updatedPages = old.pages.map((page) => ({
            ...page,
            data: page.data.map((m) => (m._id === incoming._id ? incoming : m))
          }));
          return { ...old, pages: updatedPages };
        }
      );
    });

    socket.on("message_seen_update", (incoming: Message) => {
      queryClient.setQueryData<InfiniteData<PaginatedResponse<Message[]>>>(
        ["messages", room],
        (old) => {
          if (!old) return old;
          const updatedPages = old.pages.map((page) => ({
            ...page,
            data: page.data.map((m) => (m._id === incoming._id ? incoming : m))
          }));
          return { ...old, pages: updatedPages };
        }
      );
    });

    socket.on("reaction_updated", ({ messageId, reactions }) => {
      queryClient.setQueryData<InfiniteData<PaginatedResponse<Message[]>>>(
        ["messages", room],
        (old) => {
          if (!old) return old;
          const updatedPages = old.pages.map((page) => ({
            ...page,
            data: page.data.map((m) =>
              m._id === messageId ? { ...m, reactions } : m
            )
          }));
          return { ...old, pages: updatedPages };
        }
      );
    });

    socket.on("user_typing", ({ userId }) => {
      if (data?.user?._id !== userId)
        setTypingUsers((prev) => [...new Set([...prev, userId])]);
    });

    socket.on("user_stop_typing", ({ userId }) => {
      setTypingUsers((prev) => prev.filter((id) => id !== userId));
    });

    return () => {
      socket.emit("leave_room", { chatId: room, userId: data?.user?._id });
      socket.off("new_message");
      socket.off("message_delivered_update");
      socket.off("message_seen_update");
      socket.off("reaction_updated");
      socket.off("user_typing");
      socket.off("user_stop_typing");
    };
  }, [socket, room, data?.user?._id]);

  // Fetch older pages when top hits viewport — keep scroll position stable
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
  }, [fetchNextPage, hasNextPage]);

  // HANDLE SEND: optimistic insert (append to end of newest page)
  const handleSend = (text: string) => {
    if (!text || text === "<p></p>") return;

    const message: Omit<Message, "replyTo" | "sender"> & {
      replyTo?: string;
      sender?: string;
    } = {
      chat: room,
      sender: data?.user?._id,
      type: "text",
      content: text,
      tempId: Date.now().toString(),
      status: "pending",
      replyTo: replyingTo?._id,
      createdAt: new Date().toISOString()
    };

    socket?.emit("send_message", message);

    queryClient.setQueryData<InfiniteData<PaginatedResponse<Message[]>>>(
      ["messages", room],
      (old) => {
        if (!old) {
          return {
            pageParams: [1],
            pages: [
              {
                data: [{ ...message, replyTo: replyingTo, sender: data?.user }],
                meta: {
                  currentPage: 1,
                  totalPages: 1,
                  totalCount: 1,
                  results: 1,
                  limit: 20
                }
              }
            ]
          };
        }

        const updatedPages = old.pages.map((page, idx) => {
          if (idx !== 0) return page;
          // Append (newest at bottom)
          return {
            ...page,
            data: [
              { ...message, replyTo: replyingTo, sender: data?.user },
              ...page.data
            ]
          };
        });

        return { ...old, pages: updatedPages };
      }
    );

    // Update conversation preview
    queryClient.setQueryData<PaginatedResponse<Conversation[]>>(
      ["conversations"],
      (old) => {
        if (!old) return old;
        const idx = old.data.findIndex((c) => c._id === room);
        if (idx === -1) return old;

        const updatedConv = {
          ...old.data[idx],
          lastMessage: { ...message, replyTo: replyingTo, sender: data?.user },
          updatedAt: new Date().toISOString()
        };

        const newData = [...old.data];
        newData[idx] = updatedConv;
        newData.sort(
          (a, b) =>
            moment(b.updatedAt).valueOf() - moment(a.updatedAt).valueOf()
        );
        return { ...old, data: newData };
      }
    );
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full min-h-0 border-r border-l border-gray-200 relative max-md:absolute max-md:w-full ",
        room ? "max-md:left-0" : "max-md:left-[110%]"
      )}
    >
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b max-md:p-3 bg-white">
        {isConversationLoading ? (
          <div className="flex items-start gap-3">
            <div className="size-10 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="space-y-1">
              <div className="h-6 w-25 bg-gray-200 rounded-sm animate-pulse " />
              <div className="h-4 w-15 bg-gray-200 rounded-sm animate-pulse " />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4 max-md:gap-3">
            <BsChevronLeft
              className="text-gray-600 size-5 md:hidden cursor-pointer"
              onClick={() => setSelectedChat("")}
            />

            <Avatar className="size-10">
              <AvatarImage src={assets.avatar ?? undefined} alt="AH" />
              <AvatarFallback className="bg-orange-100 flex items-center justify-center font-semibold text-orange-600">
                AH
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold font-lato text-base">
                {friend?.user.fullName}
              </p>
              <p className="text-xs font-lato flex items-center gap-1">
                <span className="bg-green-500 rounded-full w-2 h-2 flex"></span>
                Online
              </p>
            </div>
          </div>
        )}
        <Button variant="ghost" size="sm" className="hover:bg-secondary">
          <Ellipsis className="text-gray-500" />
        </Button>
      </div>

      {/* Messages */}
      <div
        ref={containerRef}
        className="flex-1 min-h-0 overflow-y-auto px-4 py-2 bg-gray-50"
        onScroll={() => {
          if (!containerRef.current) return;
          const { scrollTop, scrollHeight, clientHeight } =
            containerRef.current;
          setIsAtBottom(scrollHeight - scrollTop - clientHeight < 50);
        }}
      >
        <div className="flex flex-col">
          <div ref={topRef} />
          {isFetchingNextPage && (
            <p className="text-center text-xs">Loading older messages…</p>
          )}
          <AnimatePresence initial={false}>
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
              allMessages.map((msg, idx) => {
                // previous is the message above (older) in the list when rendering oldest -> newest
                const previous = allMessages[idx - 1];
                const showAvatar =
                  msg.sender?._id !== data?.user?._id &&
                  (!previous || previous.sender?._id !== msg.sender?._id);

                const key = msg._id ?? msg.tempId;

                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  >
                    <ChatMessage
                      sender={msg.sender}
                      message={msg}
                      showAvatar={showAvatar}
                      setReplyingTo={setReplyingTo}
                    />
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>

          <div ref={bottomRef} />
        </div>
      </div>

      <AnimatePresence>
        {typingUsers.length > 0 && (
          <motion.div
            key="typing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="text-xs text-gray-500 px-2 py-1 bg-gray-50"
          >
            {conversation?.type === "direct"
              ? "Typing..."
              : "Someone is typing..."}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll-to-bottom */}
      <AnimatePresence>
        {!isAtBottom && (
          <motion.button
            key="scroll-btn"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-primary text-white px-2 py-0.5 rounded-full shadow-xl cursor-pointer"
            onClick={() =>
              bottomRef.current?.scrollIntoView({ behavior: "smooth" })
            }
          >
            ↓
          </motion.button>
        )}
      </AnimatePresence>

      {/* Footer */}
      <ChatInput
        onSend={handleSend}
        replyingTo={replyingTo}
        setReplyingTo={setReplyingTo}
      />
    </div>
  );
}
