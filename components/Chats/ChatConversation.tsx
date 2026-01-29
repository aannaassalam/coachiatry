/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { getConversation } from "@/external-api/functions/chat.api";
import { getMessages } from "@/external-api/functions/message.api";
import { useChatUpload } from "@/hooks/useChatHook";
import { useSocket } from "@/lib/socketContext";
import { cn } from "@/lib/utils";
import { queryClient } from "@/pages/_app";
import { uploadManager } from "@/services/uploadManager";
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
import { BsChevronLeft } from "react-icons/bs";
import { Button } from "../ui/button";
import { SmartAvatar } from "../ui/smart-avatar";
import ChatInput from "./ChatInput";
import ChatMessage from "./ChatMessage";
import ChatUploadWithPreview from "./ChatUpload";
import GroupModal from "./GroupModal";

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
  const [friendStatus, setFriendStatus] = useState<"online" | "offline">(
    "offline"
  );
  const [chatDragShow, setChatDragShow] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const messageKeyMap = useRef<Map<string, string>>(new Map());

  const uploadMutation = useChatUpload();

  const getStableKey = (msg: Message) => {
    // prefer a known unique identifier (tempId or _id)
    const id = msg.tempId || msg._id;

    if (!id) {
      // fallback if neither exists — shouldn’t happen, but for safety
      return `unknown-${Math.random().toString(36).substring(2, 9)}`;
    }

    // if we already have a key for this message, return it
    if (messageKeyMap.current.has(id)) {
      return messageKeyMap.current.get(id)!;
    }

    // otherwise create one and store it
    const stableKey = crypto.randomUUID();
    messageKeyMap.current.set(id, stableKey);
    return stableKey;
  };

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
    queryKey: ["conversations", room],
    queryFn: () => getConversation(room),
    enabled: !!room
  });

  const friend = conversation?.members?.find(
    (_member) => _member.user._id !== data?.user?._id
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

  useEffect(() => {
    if (!socket) return;
    if (conversation?.type === "group") return;

    const handleStatusUpdate = ({
      userId,
      status
    }: {
      userId: string;
      status: "online" | "offline";
    }) => {
      if (userId === friend?.user._id) {
        setFriendStatus(status);
      }
    };

    socket.on("user_status_update", handleStatusUpdate);

    return () => {
      socket.off("user_status_update", handleStatusUpdate);
    };
  }, [socket, friend?.user._id, conversation]);

  // SOCKET HANDLERS
  useEffect(() => {
    if (!socket) return;
    if (!room) return;

    socket.emit("join_room", {
      chatId: room,
      userId: data?.user?._id,
      friendId: friend?.user._id,
      isGroup: conversation?.type === "group"
    });

    socket.emit("mark_seen", { chatId: room, userId: data?.user?._id });

    // NEW MESSAGE (from server)
    socket.on("new_message", (msg: Message) => {
      if (msg.chat !== room) return;

      if (msg.tempId && msg._id) {
        const oldKey = messageKeyMap.current.get(msg.tempId);
        if (oldKey) {
          messageKeyMap.current.set(msg._id, oldKey);
        }
      }

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
                status: "sent" as MessageStatus
              };
              return { ...page, data: newData };
            }

            if (alreadyExists) {
              return page;
            }

            // **Append** to the end of page.data (newest at bottom after our flattening)
            return {
              ...page,
              data: [{ ...msg, status: "sent" as MessageStatus }, ...page.data]
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

            if (msg.sender?._id !== data?.user?._id && msg.chat !== room) {
              updatedConv.unreadCount = (updatedConv.unreadCount || 0) + 1;
            }

            newData = [...old.data];
            newData[idx] = updatedConv;
          } else {
            newData = [...old.data];
          }

          const getSortTime = (chat: Conversation) =>
            moment(chat.lastMessage?.createdAt ?? chat.createdAt).valueOf();

          newData.sort((a, b) => getSortTime(b) - getSortTime(a));

          return { ...old, data: newData };
        }
      );
    });

    // Delivery, seen, reaction updates (same as before)
    socket.on("message_seen_update_bulk", ({ chatId, userId }) => {
      if (chatId !== room) return;

      // if (userId !== data?.user?._id) {
      //   queryClient.setQueryData<InfiniteData<PaginatedResponse<Message[]>>>(
      //     ["messages", chatId],
      //     (old) => {
      //       if (!old) return old;

      //       const updatedPages = old.pages.map((page) => ({
      //         ...page,
      //         data: page.data.map((m) =>
      //           m.sender?._id === data?.user?._id
      //             ? { ...m, status: "seen" as MessageStatus }
      //             : m
      //         )
      //       }));

      //       return { ...old, pages: updatedPages };
      //     }
      //   );
      // }

      // also update chat list preview
      if (userId === data?.user?._id) {
        queryClient.setQueryData<PaginatedResponse<Conversation[]>>(
          ["conversations"],
          (old) => {
            if (!old) return old;
            const existing = [...old.data];
            const idx = existing.findIndex((c) => c._id === chatId);
            if (idx === -1) return old;

            const updatedConv = {
              ...existing[idx],
              unreadCount: 0
            };

            const newList = [
              updatedConv,
              ...existing.filter((_, i) => i !== idx)
            ];

            const getSortTime = (chat: Conversation) =>
              moment(chat.lastMessage?.createdAt ?? chat.createdAt).valueOf();

            newList.sort((a, b) => getSortTime(b) - getSortTime(a));

            return { ...old, data: newList };
          }
        );
      }
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
  }, [socket, room, data?.user?._id, friend?.user?._id, conversation?.type]);

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
  const handleSend = async (text: string, files: File[]) => {
    if (!data?.user?._id || !socket) return;
    if (!text && files.length === 0) return;

    setChatDragShow(false);

    const tempId = Date.now().toString();
    const now = new Date().toISOString();

    const optimisticMessage: Omit<Message, "replyTo" | "sender" | "repeat"> & {
      replyTo?: string;
      sender?: string; // 👈 NEW
    } = {
      chat: room,
      sender: data?.user?._id,
      type:
        files.length > 0
          ? files[0].type.startsWith("image")
            ? "image"
            : files[0].type.startsWith("video")
              ? "video"
              : "file"
          : ("text" as Message["type"]),
      content: text,
      replyTo: replyingTo?._id,
      files: files.map((f) => ({
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
      status: "pending",
      createdAt: now,
      overallProgress: 0
    };

    // Optimistic update
    queryClient.setQueryData(["messages", room], (old: any) => {
      if (!old) {
        return {
          pageParams: [1],
          pages: [
            {
              data: [optimisticMessage],
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

      // produce copy of pages with new message prepended to newest page (pages[0] is newest in your backend)
      const newPages = old.pages.map((page: any, idx: number) =>
        idx === 0 ? { ...page, data: [optimisticMessage, ...page.data] } : page
      );

      return { ...old, pages: newPages };
    });

    if (files.length > 0) {
      const totalSize = files.reduce((a, f) => a + f.size, 0);
      const progressPerFile = Array(files.length).fill(0);

      const uploadedFiles = await Promise.all(
        files.map(async (file, i) => {
          const controller = new AbortController();
          uploadManager.add(tempId, controller); // ✅ register it

          try {
            const url = await uploadMutation.mutateAsync({
              file,
              chatId: room,
              signal: controller.signal,
              onProgress: (pct) => {
                progressPerFile[i] = pct;
                const uploadedBytes = files.reduce(
                  (sum, f, idx) => sum + (progressPerFile[idx] / 100) * f.size,
                  0
                );
                const overallPct = (uploadedBytes / totalSize) * 100;

                queryClient.setQueryData(["messages", room], (old: any) => {
                  if (!old) return old;

                  return {
                    ...old,
                    pages: old.pages.map((page: any, pageIndex: number) => {
                      // Only update the newest page (index 0)
                      if (pageIndex !== 0) return page;

                      return {
                        ...page,
                        data: page.data.map((m: any) =>
                          m.tempId === tempId
                            ? {
                                ...m,
                                overallProgress:
                                  overallPct < 100 ? overallPct : 0, // update progress immutably
                                files: m.files?.map((f: any, fi: number) =>
                                  i === fi ? { ...f, progress: pct } : f
                                )
                              }
                            : m
                        )
                      };
                    })
                  };
                });
              }
            });

            return {
              url,
              type: file.type.startsWith("video")
                ? "video"
                : file.type.startsWith("image")
                  ? "image"
                  : "file",
              size: file.size
            };
          } catch {
            if (controller.signal.aborted) {
              console.log("Upload cancelled:", file.name);
              return null;
            }
            return null;
          }
        })
      );

      uploadManager.clear(tempId); // ✅ cleanup after done

      // Final update (success or fail)
      const validFiles = uploadedFiles.filter(Boolean);
      queryClient.setQueryData(["messages", room], (old: any) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.map((page: any, pageIndex: number) => {
            if (pageIndex !== 0) return page; // update only the newest page

            return {
              ...page,
              data: page.data.map((m: any) =>
                m.tempId === tempId
                  ? {
                      ...m,
                      files: validFiles,
                      status: validFiles.length > 0 ? "sent" : "failed",
                      overallProgress: 100,
                      // Optional: mark each file as "uploading: false"
                      ...(validFiles?.length
                        ? {
                            files: validFiles.map((f: any) => ({
                              ...f,
                              uploading: false,
                              progress: 100
                            }))
                          }
                        : {})
                    }
                  : m
              )
            };
          })
        };
      });

      if (validFiles.length > 0) {
        socket.emit("send_message", {
          ...optimisticMessage,
          files: validFiles,
          status: "sent"
        });
      }
    } else {
      socket.emit("send_message", optimisticMessage);
    }
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  useEffect(() => {
    if (containerRef.current) {
      if (chatDragShow) {
        containerRef.current.style.overflow = "hidden";
      } else {
        containerRef.current.style.overflow = "auto";
      }
    }
  }, [containerRef, chatDragShow]);

  const handleUpload = (newFiles: File[]) => {
    setFiles(newFiles); // keep centralized file state
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
              {conversation?.type === "direct" && (
                <p className="text-xs font-lato flex items-center gap-1 capitalize">
                  <span
                    className={cn("bg-green-500 rounded-full w-2 h-2 flex", {
                      "bg-yellow-500": friendStatus === "offline"
                    })}
                  ></span>
                  {friendStatus}
                </p>
              )}
            </div>
          </div>
        )}
        {conversation?.type === "group" &&
          conversation.members.find((_mem) => _mem.user._id === data?.user?._id)
            ?.role === "owner" &&
          conversation.isDeletable && (
            <GroupModal
              data={{
                name: conversation.name,
                members: conversation.members.map((_mem) => _mem.user._id),
                groupPhoto: conversation.groupPhoto
              }}
            >
              <Button variant="ghost" size="sm" className="hover:bg-secondary">
                <Ellipsis className="text-gray-500" />
              </Button>
            </GroupModal>
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
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes("Files")) setChatDragShow(true);
        }}
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
                const showAvatar = conversation?.isDeletable
                  ? msg.sender?._id !== data?.user?._id &&
                    (!previous || previous.sender?._id !== msg.sender?._id)
                  : true;

                return (
                  <motion.div
                    key={getStableKey(msg)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  >
                    <ChatMessage
                      sender={msg.sender}
                      message={msg}
                      showAvatar={showAvatar}
                      setReplyingTo={
                        conversation?.isDeletable ? setReplyingTo : () => null
                      }
                      isGroup={conversation?.type === "group"}
                      isDeletable={conversation?.isDeletable}
                    />
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>

          <div ref={bottomRef} />
        </div>
        {chatDragShow && conversation?.isDeletable && (
          <ChatUploadWithPreview
            files={files} // pass files from parent
            handleUpload={handleUpload}
            setFiles={setFiles} // allow child to modify
            setChatDragShow={setChatDragShow}
          />
        )}
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
      {conversation?.isDeletable && (
        <ChatInput
          onSend={handleSend}
          replyingTo={replyingTo}
          setReplyingTo={setReplyingTo}
          files={files} // current files state
          setFiles={setFiles} // allow child to modify
          setChatDragShow={setChatDragShow}
          receiverName={conversation?.name ?? friend?.user?.fullName ?? ""}
        />
      )}
    </div>
  );
}
