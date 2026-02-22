// import assets from "@/json/assets";
import {
  getAllConversations,
  getConversation
} from "@/external-api/functions/chat.api";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import moment from "moment";
import { useSession } from "next-auth/react";
import { parseAsString, useQueryState } from "nuqs";
import { SmartAvatar } from "../ui/smart-avatar";
import { useEffect } from "react";
import { useSocket } from "@/lib/socketContext";
import { queryClient } from "@/pages/_app";
import { PaginatedResponse } from "@/typescript/interface/common.interface";
import { ChatConversation } from "@/typescript/interface/chat.interface";
import { Message } from "@/typescript/interface/message.interface";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";
import GroupModal from "./GroupModal";
import { getMessages } from "@/external-api/functions/message.api";

moment.updateLocale("en", {
  relativeTime: {
    future: "in %s",
    past: "%s",
    s: "%ds",
    ss: "%ds",
    m: "1m",
    mm: "%dm",
    h: "1h",
    hh: "%dh",
    w: "1w",
    ww: "%dw",
    d: "1d",
    dd: "%dd",
    M: "1M",
    MM: "%dM",
    y: "1y",
    yy: "%dy"
  }
});

export default function ChatList() {
  const [room, setSelectedChat] = useQueryState(
    "room",
    parseAsString.withDefault("")
  );
  const { data } = useSession();
  const socket = useSocket();

  const { data: chats, isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => getAllConversations(),
    refetchOnMount: true
  });

  useEffect(() => {
    if (!socket || socket.connected === false) return;

    const handleConversationUpdated = (update: {
      chatId: string;
      lastMessage: Message;
      updatedAt: string;
    }) => {
      queryClient.setQueryData<PaginatedResponse<ChatConversation[]>>(
        ["conversations"],
        (old) => {
          if (!old) return old;

          const existing = Array.isArray(old.data) ? [...old.data] : [];
          const idx = existing.findIndex((c) => c._id === update.chatId);

          const isMyMessage =
            update.lastMessage?.sender?._id === data?.user?._id;
          const isCurrentRoom = room === update.chatId;

          const current = existing[idx];
          const updatedConv = {
            ...current,
            lastMessage: update.lastMessage,
            updatedAt: update.updatedAt,
            unreadCount: current.unreadCount || 0
          } as ChatConversation;

          if (idx > -1) {
            // ✅ Only increase unread count if:
            // - this message is NOT mine
            // - and I am NOT currently inside that chat
            if (!isMyMessage && !isCurrentRoom) {
              updatedConv.unreadCount = (current.unreadCount || 0) + 1;
            }
          }

          const newList = [
            updatedConv,
            ...existing.filter((_, i) => i !== idx)
          ];

          // ✅ Sort newest → oldest
          const getSortTime = (chat: ChatConversation) =>
            moment(chat.lastMessage?.createdAt ?? chat.createdAt).valueOf();

          newList.sort((a, b) => getSortTime(b) - getSortTime(a));

          return { ...old, data: newList };
        }
      );
    };

    socket.on("conversation_updated", handleConversationUpdated);
    return () => {
      socket.off("conversation_updated", handleConversationUpdated);
    };
  }, [socket, socket?.connected, room, data?.user?._id]);

  const prefetchChatRoom = (room: string) => {
    queryClient.prefetchQuery({
      queryKey: ["conversations", room],
      queryFn: () => getConversation(room),
      staleTime: 5 * 60 * 1000
    });
    queryClient.prefetchInfiniteQuery({
      queryKey: ["messages", room],
      queryFn: getMessages,
      initialPageParam: 1,
      staleTime: 5 * 60 * 1000
    });
  };

  return (
    <div className="w-xs mr-auto bg-white pt-4 rounded-lg flex flex-col min-h-0 max-md:w-full">
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
      <ul className="space-y-2 overflow-y-auto pr-2 pb-6 max-h-[calc(100vh-200px)] max-md:w-full">
        {isLoading ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-sm animate-pulse">
              <div className="size-10 bg-gray-200 rounded-full" />
              <div className="space-y-1 max-md:w-full">
                <div className="h-5 w-15 bg-gray-200 rounded-sm max-md:w-1/2" />
                <div className="h-4 w-30 bg-gray-200 rounded-sm max-md:w-full" />
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-sm animate-pulse">
              <div className="size-10 bg-gray-200 rounded-full" />
              <div className="space-y-1 max-md:w-full">
                <div className="h-5 w-15 bg-gray-200 rounded-sm max-md:w-1/2" />
                <div className="h-4 w-30 bg-gray-200 rounded-sm max-md:w-full" />
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-sm animate-pulse">
              <div className="size-10 bg-gray-200 rounded-full" />
              <div className="space-y-1 max-md:w-full">
                <div className="h-5 w-15 bg-gray-200 rounded-sm max-md:w-1/2" />
                <div className="h-4 w-30 bg-gray-200 rounded-sm max-md:w-full" />
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-sm animate-pulse">
              <div className="size-10 bg-gray-200 rounded-full" />
              <div className="space-y-1 max-md:w-full">
                <div className="h-5 w-15 bg-gray-200 rounded-sm max-md:w-1/2" />
                <div className="h-4 w-30 bg-gray-200 rounded-sm max-md:w-full" />
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-sm animate-pulse">
              <div className="size-10 bg-gray-200 rounded-full" />
              <div className="space-y-1 max-md:w-full">
                <div className="h-5 w-15 bg-gray-200 rounded-sm max-md:w-1/2" />
                <div className="h-4 w-30 bg-gray-200 rounded-sm max-md:w-full" />
              </div>
            </div>
          </div>
        ) : (
          chats?.data?.map((_chat) => {
            const chatUser = _chat.members.find(
              (_member) => _member.user._id !== data?.user?._id
            );
            const details: { photo?: string; name?: string } = {
              photo: chatUser?.user.photo,
              name: chatUser?.user.fullName
            };

            if (_chat && _chat.type === "group") {
              details.photo = _chat.groupPhoto;
              details.name = _chat.name;
            }

            return (
              <li
                key={_chat._id}
                className="flex cursor-pointer items-start justify-between gap-2 py-2.5 px-3 rounded-[8px] hover:bg-gray-100 transition"
                onClick={() => setSelectedChat(_chat._id!)}
                onMouseEnter={() => _chat?._id && prefetchChatRoom(_chat?._id)}
              >
                <SmartAvatar
                  src={details?.photo}
                  name={details?.name}
                  className="size-11"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center">
                    <span
                      className={cn("font-medium  text-sm text-gray-900", {
                        "font-bold": _chat.unreadCount > 0
                      })}
                    >
                      {details.name}
                    </span>
                    {/* {msg.unread && (
                      <span className="w-[7px] h-[7px] rounded-full bg-primary"></span>
                    )} */}
                  </div>
                  <p
                    className={cn("text-xs text-gray-500 truncate mt-1", {
                      "font-semibold": _chat.unreadCount > 0
                    })}
                  >
                    {_chat.lastMessage?.sender?._id === data?.user?._id &&
                    _chat.isDeletable
                      ? "You: "
                      : null}
                    {_chat.lastMessage?.content ||
                      (_chat.lastMessage?.type === "image"
                        ? "📷 Images"
                        : _chat.lastMessage?.type === "video"
                          ? "🎥 Videos"
                          : _chat.lastMessage?.type === "file"
                            ? "📁 Files"
                            : undefined)}
                  </p>
                </div>
                <div className="flex flex-col items-center justify-between gap-1">
                  <span
                    className={cn("text-xs text-gray-500 whitespace-nowrap", {
                      "font-semibold": _chat.unreadCount > 0
                    })}
                  >
                    {_chat.lastMessage?.createdAt
                      ? moment(_chat.lastMessage?.createdAt).fromNow(true)
                      : moment(_chat?.createdAt).fromNow(true)}
                  </span>
                  {_chat.unreadCount > 0 && (
                    <span className="text-xs h-5 min-w-5 px-1 rounded-full bg-primary text-white flex items-center justify-center">
                      {_chat.unreadCount > 99 ? "99+" : _chat.unreadCount}
                    </span>
                  )}
                </div>
                {/* </div> */}
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
