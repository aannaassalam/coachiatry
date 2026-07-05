"use client";

import { useSocket } from "@/lib/socketContext";
import { ChatConversation } from "@/typescript/interface/chat.interface";
import { PaginatedResponse } from "@/typescript/interface/common.interface";
import { Message } from "@/typescript/interface/message.interface";
import { InfiniteData, useQueryClient } from "@tanstack/react-query";
import moment from "moment";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

/**
 * Keeps the floating launcher badge + conversation list live when the user is
 * OFF the /chat page — there, ChatList's own `conversation_updated` handler is
 * not mounted, so nothing updated the `["conversations", ...]` caches in
 * realtime. Renders nothing. It is mounted only where the floating chat itself
 * renders (never on /chat), so it can't double-count with ChatList.
 */
export default function FloatingConversationsSync() {
  const socket = useSocket();
  const { data } = useSession();
  const userId = data?.user?._id;
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket) return;

    const handleConversationUpdated = (update: {
      chatId: string;
      lastMessage: Message;
      updatedAt: string;
    }) => {
      let found = false;
      queryClient.setQueriesData<
        InfiniteData<PaginatedResponse<ChatConversation[]>>
      >({ queryKey: ["conversations"] }, (old) => {
        // Skips non-infinite caches (e.g. the single-conversation lookup).
        if (!old?.pages?.length) return old;

        const all = old.pages.flatMap((p) => p.data);
        const idx = all.findIndex((c) => c._id === update.chatId);
        if (idx === -1) return old;
        found = true;

        const current = all[idx];
        const isMyMessage = update.lastMessage?.sender?._id === userId;
        const updated: ChatConversation = {
          ...current,
          lastMessage: update.lastMessage,
          updatedAt: update.updatedAt,
          unreadCount: isMyMessage
            ? current.unreadCount || 0
            : (current.unreadCount || 0) + 1
        };

        const list = [updated, ...all.filter((_, i) => i !== idx)];
        list.sort(
          (a, b) =>
            moment(b.lastMessage?.createdAt ?? b.createdAt).valueOf() -
            moment(a.lastMessage?.createdAt ?? a.createdAt).valueOf()
        );

        // Re-chunk preserving each page's size (don't collapse into page 0).
        let offset = 0;
        const pages = old.pages.map((p) => {
          const size = p.data.length;
          const dataSlice = list.slice(offset, offset + size);
          offset += size;
          return { ...p, data: dataSlice };
        });
        if (offset < list.length) {
          const l = pages.length - 1;
          pages[l] = {
            ...pages[l],
            data: [...pages[l].data, ...list.slice(offset)]
          };
        }

        return { ...old, pages };
      });

      // The conversation isn't in any loaded page (brand-new chat, or one that
      // scrolled past the loaded window) — refetch so it appears instead of
      // being silently dropped.
      if (!found) {
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      }
    };

    socket.on("conversation_updated", handleConversationUpdated);
    return () => {
      socket.off("conversation_updated", handleConversationUpdated);
    };
  }, [socket, userId, queryClient]);

  return null;
}
