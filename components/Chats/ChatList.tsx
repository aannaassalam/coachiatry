import {
  getAllConversations,
  getConversation
} from "@/external-api/functions/chat.api";
import { getMessages } from "@/external-api/functions/message.api";
import { useDebounce } from "@/hooks/utils/useDebounce";
import { formatChatTime } from "@/lib/functions/_helpers.lib";
import { useSocket } from "@/lib/socketContext";
import { cn } from "@/lib/utils";
import { queryClient } from "@/pages/_app";
import { PaginatedResponse } from "@/typescript/interface/common.interface";
import { ChatConversation } from "@/typescript/interface/chat.interface";
import { Message } from "@/typescript/interface/message.interface";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import moment from "moment";
import { useSession } from "next-auth/react";
import { parseAsString, useQueryState } from "nuqs";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { SmartAvatar } from "../ui/smart-avatar";
import GroupModal from "./GroupModal";

const skeletons = Array.from({ length: 5 });

export default function ChatList() {
  const [room, setSelectedChat] = useQueryState(
    "room",
    parseAsString.withDefault("")
  );
  const { data } = useSession();
  const socket = useSocket();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const listRef = useRef<HTMLUListElement>(null);

  const {
    data: chatsData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ["conversations", { search: debouncedSearch }],
    queryFn: ({ pageParam }) =>
      getAllConversations({ page: pageParam, search: debouncedSearch }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.meta.currentPage < lastPage.meta.totalPages) {
        return lastPage.meta.currentPage + 1;
      }
      return undefined;
    },
    refetchOnMount: true
  });

  const chats = chatsData?.pages.flatMap((page) => page.data) ?? [];

  useEffect(() => {
    if (!socket) return;

    const handleConversationUpdated = (update: {
      chatId: string;
      lastMessage: Message;
      updatedAt: string;
    }) => {
      queryClient.setQueryData<{
        pages: PaginatedResponse<ChatConversation[]>[];
        pageParams: unknown[];
      }>(["conversations", { search: debouncedSearch }], (old) => {
        if (!old) return old;

        const firstPage = old.pages[0];
        if (!firstPage) return old;

        const allChats = old.pages.flatMap((p) => p.data);
        const idx = allChats.findIndex((c) => c._id === update.chatId);
        if (idx === -1) return old;

        const current = allChats[idx];
        const isMyMessage = update.lastMessage?.sender?._id === data?.user?._id;
        const isCurrentRoom = room === update.chatId;

        const updatedConv: ChatConversation = {
          ...current,
          lastMessage: update.lastMessage,
          updatedAt: update.updatedAt,
          unreadCount: current.unreadCount || 0
        };

        if (!isMyMessage && !isCurrentRoom) {
          updatedConv.unreadCount = (current.unreadCount || 0) + 1;
        }

        const newList = [updatedConv, ...allChats.filter((_, i) => i !== idx)];

        newList.sort(
          (a, b) =>
            moment(b.lastMessage?.createdAt ?? b.createdAt).valueOf() -
            moment(a.lastMessage?.createdAt ?? a.createdAt).valueOf()
        );

        return {
          ...old,
          pages: [
            { ...firstPage, data: newList },
            ...old.pages.slice(1).map((p) => ({ ...p, data: [] }))
          ]
        };
      });
    };

    socket.on("conversation_updated", handleConversationUpdated);
    return () => {
      socket.off("conversation_updated", handleConversationUpdated);
    };
  }, [socket, room, data?.user?._id, debouncedSearch]);

  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    if (
      el.scrollHeight - el.scrollTop - el.clientHeight < 100 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const clearUnreadOptimistic = useCallback((chatId: string) => {
    // The ["conversations", ...] key family covers infinite lists, the
    // dashboard's flat PaginatedResponse, and single-conversation lookups.
    // Branch on shape so we only patch what we actually understand.
    queryClient.setQueriesData<unknown>(
      { queryKey: ["conversations"] },
      (old: unknown) => {
        if (!old || typeof old !== "object") return old;

        const infinite = old as {
          pages?: PaginatedResponse<ChatConversation[]>[];
        };
        if (Array.isArray(infinite.pages)) {
          let changed = false;
          const pages = infinite.pages.map((page) => ({
            ...page,
            data: page.data.map((c) => {
              if (c._id === chatId && (c.unreadCount ?? 0) > 0) {
                changed = true;
                return { ...c, unreadCount: 0 };
              }
              return c;
            })
          }));
          return changed ? { ...infinite, pages } : old;
        }

        const flat = old as PaginatedResponse<ChatConversation[]>;
        if (Array.isArray(flat.data)) {
          let changed = false;
          const data = flat.data.map((c) => {
            if (c._id === chatId && (c.unreadCount ?? 0) > 0) {
              changed = true;
              return { ...c, unreadCount: 0 };
            }
            return c;
          });
          return changed ? { ...flat, data } : old;
        }

        const single = old as ChatConversation;
        if (single._id === chatId && (single.unreadCount ?? 0) > 0) {
          return { ...single, unreadCount: 0 };
        }
        return old;
      }
    );
  }, []);

  const prefetchChatRoom = useCallback((chatId: string) => {
    if (!chatId) return;
    queryClient.prefetchQuery({
      queryKey: ["conversations", chatId],
      queryFn: () => getConversation(chatId),
      staleTime: 5 * 60 * 1000
    });
    queryClient.prefetchInfiniteQuery({
      queryKey: ["messages", chatId],
      queryFn: getMessages,
      initialPageParam: 1,
      staleTime: 5 * 60 * 1000
    });
  }, []);

  return (
    <div className="w-xs mr-auto bg-white pt-4 rounded-lg flex flex-col min-h-0 max-md:w-full">
      {/* Search Input */}
      <div className="pr-3 mb-3 relative">
        <Search
          size={14}
          className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <Input
          placeholder="Search conversations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-6.5 h-8 text-xs"
        />
      </div>

      {/* Header / Content Above */}
      <div className="flex items-center justify-between gap-2 mb-3 px-3">
        <h2 className="text-sm font-semibold text-gray-800">All messages</h2>
        <GroupModal>
          <Button
            center
            size="icon"
            variant="ghost"
            className="!size-7"
            asChild
          >
            <Plus size={16} />
          </Button>
        </GroupModal>
      </div>

      {/* Scrollable List */}
      <ul
        ref={listRef}
        onScroll={handleScroll}
        className="space-y-2 overflow-y-auto pr-2 pb-6 max-h-[calc(100vh-200px)] max-md:w-full"
      >
        {isLoading ? (
          <div className="space-y-2">
            {skeletons.map((_, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-3 py-2.5 rounded-sm animate-pulse"
              >
                <div className="size-10 bg-gray-200 rounded-full" />
                <div className="space-y-1 max-md:w-full">
                  <div className="h-5 w-15 bg-gray-200 rounded-sm max-md:w-1/2" />
                  <div className="h-4 w-30 bg-gray-200 rounded-sm max-md:w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {chats.map((chat) => {
              const chatUser = chat.members.find(
                (member) => member.user._id !== data?.user?._id
              );

              const details =
                chat.type === "group"
                  ? { photo: chat.groupPhoto, name: chat.name }
                  : {
                      photo: chatUser?.user.photo,
                      name: chatUser?.user.fullName
                    };

              const renderLastMessage = () => {
                const last = chat.lastMessage;
                if (!last) return "";

                const prefix =
                  last.sender?._id === data?.user?._id && chat.isDeletable
                    ? "You: "
                    : "";

                const content =
                  last.content ||
                  (last.type === "image"
                    ? "📷 Images"
                    : last.type === "video"
                      ? "🎥 Videos"
                      : last.type === "file"
                        ? "📁 Files"
                        : "");

                return `${prefix}${content}`;
              };

              return (
                <li
                  key={chat._id}
                  className="flex cursor-pointer items-start justify-between gap-2 py-2.5 px-3 rounded-[8px] hover:bg-gray-100 transition"
                  onClick={() => {
                    if (!chat._id) return;
                    clearUnreadOptimistic(chat._id);
                    setSelectedChat(chat._id);
                  }}
                  onMouseEnter={() => chat?._id && prefetchChatRoom(chat._id)}
                >
                  <SmartAvatar
                    src={details.photo}
                    name={details.name}
                    className="size-11"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <span
                        className={cn("font-medium text-sm text-gray-900", {
                          "font-bold": chat.unreadCount > 0
                        })}
                      >
                        {details.name}
                      </span>
                    </div>
                    <p
                      className={cn("text-xs text-gray-500 truncate mt-1", {
                        "font-semibold": chat.unreadCount > 0
                      })}
                    >
                      {renderLastMessage()}
                    </p>
                  </div>
                  <div className="flex flex-col items-center justify-between gap-1">
                    <span
                      className={cn("text-xs text-gray-500 whitespace-nowrap", {
                        "font-semibold": chat.unreadCount > 0
                      })}
                    >
                      {formatChatTime(
                        chat.lastMessage?.createdAt ?? chat?.createdAt
                      )}
                    </span>
                    {chat.unreadCount > 0 && (
                      <span className="text-xs h-5 min-w-5 px-1 rounded-full bg-primary text-white flex items-center justify-center">
                        {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
            {isFetchingNextPage && (
              <div className="flex justify-center py-2">
                <div className="size-5 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
              </div>
            )}
          </>
        )}
      </ul>
    </div>
  );
}
