import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useCallback } from "react";
import moment from "moment";
import { getMessages } from "@/external-api/functions/message.api";
import { ChatConversation as Conversation } from "@/typescript/interface/chat.interface";
import { Message, MessageStatus } from "@/typescript/interface/message.interface";
import { InfiniteData, PaginatedResponse } from "@/typescript/interface/common.interface";

export const useChatMessages = (room: string) => {
  const queryClient = useQueryClient();

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

  const allMessages = useMemo(
    () =>
      messagesData?.pages
        .slice()
        .reverse()
        .flatMap((page) => [...page.data].reverse()) ?? [],
    [messagesData]
  );

  const insertOptimisticMessage = useCallback(
    (optimisticMessage: Message) => {
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

        const newPages = old.pages.map((page: any, idx: number) =>
          idx === 0 ? { ...page, data: [optimisticMessage, ...page.data] } : page
        );

        return { ...old, pages: newPages };
      });
    },
    [queryClient, room]
  );

  const updateMessageByTempId = useCallback(
    (tempId: string, updater: (m: Message) => Message) => {
      queryClient.setQueryData(["messages", room], (old: any) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.map((page: any, pageIndex: number) => {
            if (pageIndex !== 0) return page;

            return {
              ...page,
              data: page.data.map((m: Message) =>
                m.tempId === tempId ? updater(m) : m
              )
            };
          })
        };
      });
    },
    [queryClient, room]
  );

  const upsertIncomingMessage = useCallback(
    (msg: Message, currentUserId?: string, activeRoom?: string) => {
      if (!msg.chat) return;

      if (msg.tempId && msg._id) {
        queryClient.setQueryData(["messages", room], (old: any) => {
          if (!old) return old;
          const updated = old.pages.map((page: any, idx: number) => {
            if (idx !== 0) return page;

            const tempIdx = page.data.findIndex(
              (m: Message) => m.tempId && m.tempId === msg.tempId
            );

            if (tempIdx > -1) {
              const newData = [...page.data];
              newData[tempIdx] = { ...msg, status: "sent" as MessageStatus } as Message;
              return { ...page, data: newData };
            }
            return page;
          });
          return { ...old, pages: updated };
        });
      }

      queryClient.setQueryData<
        InfiniteData<PaginatedResponse<Message[]>> | undefined
      >(["messages", room], (old) => {
        if (!old) return old;

        const updatedPages = old.pages.map((page, idx) => {
          if (idx !== 0) return page;

          const alreadyExists = page.data.some(
            (m) =>
              (m._id && msg._id && m._id === msg._id) ||
              (m.tempId && msg.tempId && m.tempId === msg.tempId)
          );

          if (alreadyExists) return page;

          return {
            ...page,
            data: [{ ...(msg as Message), status: "sent" as MessageStatus }, ...page.data]
          };
        });

        return { ...old, pages: updatedPages };
      });

      // Update conversation list preview
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
            } as Conversation;

            if (msg.sender?._id !== currentUserId && msg.chat !== activeRoom) {
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
    },
    [queryClient, room]
  );

  const updateReactions = useCallback(
    (messageId: string, reactions: Message["reactions"]) => {
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
    },
    [queryClient, room]
  );

  const markConversationSeen = useCallback(
    (chatId: string, userId: string, currentUserId?: string) => {
      if (userId !== currentUserId) return;

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
          } as Conversation;

          const newList = [updatedConv, ...existing.filter((_, i) => i !== idx)];

          const getSortTime = (chat: Conversation) =>
            moment(chat.lastMessage?.createdAt ?? chat.createdAt).valueOf();

          newList.sort((a, b) => getSortTime(b) - getSortTime(a));

          return { ...old, data: newList };
        }
      );
    },
    [queryClient]
  );

  return {
    messagesData,
    allMessages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    insertOptimisticMessage,
    updateMessageByTempId,
    upsertIncomingMessage,
    updateReactions,
    markConversationSeen
  };
};
