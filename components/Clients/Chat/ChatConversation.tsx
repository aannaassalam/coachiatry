/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { SmartAvatar } from "@/components/ui/smart-avatar";
import { getConversationByCoach } from "@/external-api/functions/chat.api";
import { getMessages } from "@/external-api/functions/message.api";
import { cn } from "@/lib/utils";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useParams } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useMemo, useRef, useState } from "react";
import { BsChevronLeft } from "react-icons/bs";
import ChatMessage from "./ChatMessage";

export default function ChatConversation() {
  const topRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const didInitialScroll = useRef(false);
  const prevMessageCount = useRef(0);
  const [room, setSelectedChat] = useQueryState(
    "room",
    parseAsString.withDefault("")
  );
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [chatDragShow, setChatDragShow] = useState(false);

  const messageKeyMap = useRef<Map<string, string>>(new Map());
  const { id: userId } = useParams();

  useEffect(() => {
    messageKeyMap.current.clear();
  }, [room]);

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
    queryKey: ["conversations", room, userId],
    queryFn: () => getConversationByCoach(room),
    enabled: !!room
  });

  const friend = conversation?.members?.find(
    (_member) => _member.user._id !== (userId as string)
  );

  const details: { photo?: string; name?: string } = {
    photo: friend?.user.photo,
    name: friend?.user.fullName
  };

  if (conversation && conversation.type === "group") {
    details.photo = conversation.groupPhoto;
    details.name = conversation.name;
  }

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

  useEffect(() => {
    if (containerRef.current) {
      if (chatDragShow) {
        containerRef.current.style.overflow = "hidden";
      } else {
        containerRef.current.style.overflow = "auto";
      }
    }
  }, [containerRef, chatDragShow]);

  return (
    <div
      className={cn(
        "flex flex-col h-full max-h-140 border-r border-l border-gray-200 relative max-md:absolute max-md:w-full ",
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
            <SmartAvatar
              src={details.photo}
              name={details.name}
              key={conversation?.updatedAt}
              className="size-10"
            />
            <div>
              <p className="font-semibold font-lato text-base">
                {details.name}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div
        ref={containerRef}
        className={cn(
          "flex-1 min-h-0 overflow-y-auto p-4 bg-gray-50 relative",
          {
            "p-0": chatDragShow
          }
        )}
        onScroll={() => {
          if (!containerRef.current) return;
          const { scrollTop, scrollHeight, clientHeight } =
            containerRef.current;
          setIsAtBottom(scrollHeight - scrollTop - clientHeight < 50);
        }}
        onDragOver={() => setChatDragShow(true)}
        onDragEnd={() => setChatDragShow(false)}
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
                  msg.sender?._id !== userId &&
                  (!previous || previous.sender?._id !== msg.sender?._id);

                return (
                  <motion.div
                    key={msg._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  >
                    <ChatMessage
                      sender={msg.sender}
                      message={msg}
                      showAvatar={showAvatar}
                      isGroup={conversation?.type === "group"}
                    />
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>

          <div ref={bottomRef} />
        </div>
      </div>

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
    </div>
  );
}
