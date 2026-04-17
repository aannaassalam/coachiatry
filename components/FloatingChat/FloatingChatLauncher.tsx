"use client";

import { getAllConversations } from "@/external-api/functions/chat.api";
import { useFloatingChat } from "@/lib/floatingChatContext";
import { useInfiniteQuery } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";

export default function FloatingChatLauncher() {
  const { openPanel } = useFloatingChat();

  const { data } = useInfiniteQuery({
    queryKey: ["conversations", { search: "" }],
    queryFn: ({ pageParam }) =>
      getAllConversations({ page: pageParam, search: "" }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.meta.currentPage < lastPage.meta.totalPages) {
        return lastPage.meta.currentPage + 1;
      }
      return undefined;
    }
  });

  const unread =
    data?.pages
      .flatMap((p) => p.data)
      .reduce((sum, c) => sum + (c.unreadCount || 0), 0) ?? 0;

  return (
    <button
      type="button"
      onClick={openPanel}
      className="fixed bottom-4 right-4 z-50 size-13 rounded-full bg-primary text-white shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
      aria-label="Open messages"
    >
      <MessageCircle size={22} />
      {unread > 0 && (
        <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center border-2 border-white">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </button>
  );
}
