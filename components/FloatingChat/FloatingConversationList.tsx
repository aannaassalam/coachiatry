"use client";

import { Input } from "@/components/ui/input";
import { SmartAvatar } from "@/components/ui/smart-avatar";
import { getAllConversations } from "@/external-api/functions/chat.api";
import { useDebounce } from "@/hooks/utils/useDebounce";
import { useFloatingChat } from "@/lib/floatingChatContext";
import { cn } from "@/lib/utils";
import { ChatConversation } from "@/typescript/interface/chat.interface";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import moment from "moment";
import { useSession } from "next-auth/react";
import { useCallback, useRef, useState } from "react";

const skeletons = Array.from({ length: 5 });

export default function FloatingConversationList() {
  const { data } = useSession();
  const { openChat } = useFloatingChat();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const listRef = useRef<HTMLDivElement>(null);

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
    }
  });

  const chats: ChatConversation[] =
    chatsData?.pages.flatMap((page) => page.data) ?? [];

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

  const renderLastMessage = (chat: ChatConversation) => {
    const last = chat.lastMessage;
    if (!last) return "";
    const prefix =
      last.sender?._id === data?.user?._id && chat.isDeletable ? "You: " : "";
    const content =
      last.content ||
      (last.type === "image"
        ? "📷 Image"
        : last.type === "video"
          ? "🎥 Video"
          : last.type === "file"
            ? "📁 File"
            : "");
    return `${prefix}${content}`;
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-white">
      <div className="p-2 border-b">
        <div className="relative">
          <Search
            size={12}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <Input
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-7 h-8 text-xs"
          />
        </div>
      </div>

      <div
        ref={listRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
      >
        {isLoading ? (
          <div className="p-2 space-y-1">
            {skeletons.map((_, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-2 py-2 animate-pulse"
              >
                <div className="size-9 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 w-20 bg-gray-200 rounded-sm" />
                  <div className="h-3 w-32 bg-gray-200 rounded-sm" />
                </div>
              </div>
            ))}
          </div>
        ) : chats.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-xs text-gray-500">
            No conversations yet
          </div>
        ) : (
          <ul>
            {chats.map((chat) => {
              const friend = chat.members.find(
                (m) => m.user._id !== data?.user?._id
              );
              const details =
                chat.type === "group"
                  ? { photo: chat.groupPhoto, name: chat.name }
                  : {
                      photo: friend?.user.photo,
                      name: friend?.user.fullName
                    };

              return (
                <li
                  key={chat._id}
                  onClick={() => chat._id && openChat(chat._id)}
                  className="flex items-center gap-2 px-2 py-2 cursor-pointer hover:bg-gray-50 transition border-b border-gray-50 last:border-b-0"
                >
                  <SmartAvatar
                    src={details.photo}
                    name={details.name}
                    className="size-9 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn("text-xs font-medium text-gray-900 truncate", {
                          "font-bold": chat.unreadCount > 0
                        })}
                      >
                        {details.name}
                      </span>
                      <span className="text-[10px] text-gray-500 whitespace-nowrap">
                        {chat.lastMessage?.createdAt
                          ? moment(chat.lastMessage.createdAt).fromNow(true)
                          : moment(chat.createdAt).fromNow(true)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={cn(
                          "text-[11px] text-gray-500 truncate",
                          { "font-semibold text-gray-800": chat.unreadCount > 0 }
                        )}
                      >
                        {renderLastMessage(chat)}
                      </p>
                      {chat.unreadCount > 0 && (
                        <span className="text-[10px] h-4 min-w-4 px-1 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0">
                          {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
            {isFetchingNextPage && (
              <div className="flex justify-center py-2">
                <div className="size-4 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
              </div>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
