import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useSocket } from "@/lib/socketContext";
import { Message } from "@/typescript/interface/message.interface";
import { ChatConversation as Conversation } from "@/typescript/interface/chat.interface";

export type SocketHandlers = {
  onNewMessage: (msg: Message) => void;
  onReactionUpdate: (messageId: string, reactions: Message["reactions"]) => void;
  onSeenBulk: (payload: { chatId: string; userId: string }) => void;
};

type Props = {
  room: string;
  conversation?: Conversation;
  friendId?: string;
  handlers: SocketHandlers;
};

export const useChatSocket = ({ room, conversation, friendId, handlers }: Props) => {
  const socket = useSocket();
  const { data } = useSession();
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [friendStatus, setFriendStatus] = useState<"online" | "offline">("offline");

  // presence (direct chats only)
  useEffect(() => {
    if (!socket || conversation?.type === "group") return;
    const handleStatusUpdate = ({ userId, status }: { userId: string; status: "online" | "offline" }) => {
      if (userId === friendId) setFriendStatus(status);
    };

    socket.on("user_status_update", handleStatusUpdate);
    return () => {
      socket.off("user_status_update", handleStatusUpdate);
    };
  }, [socket, friendId, conversation?.type]);

  useEffect(() => {
    if (!socket || !room) return;

    socket.emit("join_room", {
      chatId: room,
      userId: data?.user?._id,
      friendId,
      isGroup: conversation?.type === "group"
    });

    socket.emit("mark_seen", { chatId: room, userId: data?.user?._id });

    const handleNewMessage = (msg: Message) => {
      if (msg.chat !== room) return;
      handlers.onNewMessage(msg);
    };

    const handleReaction = ({ messageId, reactions }: { messageId: string; reactions: Message["reactions"] }) => {
      handlers.onReactionUpdate(messageId, reactions);
    };

    const handleTyping = ({ userId }: { userId: string }) => {
      if (data?.user?._id !== userId) {
        setTypingUsers((prev) => [...new Set([...prev, userId])]);
      }
    };

    const handleStopTyping = ({ userId }: { userId: string }) => {
      setTypingUsers((prev) => prev.filter((id) => id !== userId));
    };

    const handleSeenBulk = ({ chatId, userId }: { chatId: string; userId: string }) => {
      if (chatId !== room) return;
      handlers.onSeenBulk({ chatId, userId });
    };

    socket.on("new_message", handleNewMessage);
    socket.on("reaction_updated", handleReaction);
    socket.on("user_typing", handleTyping);
    socket.on("user_stop_typing", handleStopTyping);
    socket.on("message_seen_update_bulk", handleSeenBulk);

    return () => {
      socket.emit("leave_room", { chatId: room, userId: data?.user?._id });
      socket.off("new_message", handleNewMessage);
      socket.off("reaction_updated", handleReaction);
      socket.off("user_typing", handleTyping);
      socket.off("user_stop_typing", handleStopTyping);
      socket.off("message_seen_update_bulk", handleSeenBulk);
    };
  }, [socket, room, data?.user?._id, friendId, conversation?.type, handlers]);

  return { typingUsers, friendStatus } as const;
};
