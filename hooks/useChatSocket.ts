import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useSocket } from "@/lib/socketContext";
import { Message } from "@/typescript/interface/message.interface";
import { ChatConversation as Conversation } from "@/typescript/interface/chat.interface";

export type SocketHandlers = {
  onNewMessage: (msg: Message) => void;
  onReactionUpdate: (
    messageId: string,
    reactions: Message["reactions"]
  ) => void;
  onSeenBulk: (payload: { chatId: string; userId: string }) => void;
};

type Props = {
  room: string;
  conversation?: Conversation;
  friendId?: string;
  handlers: SocketHandlers;
};

export const useChatSocket = ({
  room,
  conversation,
  friendId,
  handlers
}: Props) => {
  const socket = useSocket();
  const { data } = useSession();
  const userId = data?.user?._id;
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [friendStatus, setFriendStatus] = useState<"online" | "offline">(
    "offline"
  );

  // Keep the latest handlers in a ref so the main socket effect does NOT list
  // `handlers` as a dependency. Consumers pass a fresh inline `handlers` object
  // on every render, which previously tore down and re-created all listeners
  // (and re-emitted join/leave/mark_seen) on every scroll, typing tick and
  // incoming message — spamming the server and risking dropped messages during
  // the leave→join gap.
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  // presence (direct chats only)
  useEffect(() => {
    if (!socket || conversation?.type === "group") return;
    const handleStatusUpdate = ({
      userId: uid,
      status
    }: {
      userId: string;
      status: "online" | "offline";
    }) => {
      if (uid === friendId) setFriendStatus(status);
    };

    socket.on("user_status_update", handleStatusUpdate);
    return () => {
      socket.off("user_status_update", handleStatusUpdate);
    };
  }, [socket, friendId, conversation?.type]);

  // Reset transient per-room UI state when the room changes so a stale
  // "typing…"/presence from the previous room can't leak into the new one.
  useEffect(() => {
    setTypingUsers([]);
    setFriendStatus("offline");
  }, [room]);

  // Emit mark_seen once when the room opens (its own effect so it doesn't
  // re-fire on every render). For coach/staff viewing a non-member chat the
  // backend ignores this, keeping their view read-only.
  useEffect(() => {
    if (!socket || !room || !userId) return;
    socket.emit("mark_seen", { chatId: room, userId });
  }, [socket, room, userId]);

  useEffect(() => {
    if (!socket || !room) return;

    const joinRoom = () => {
      socket.emit("join_room", {
        chatId: room,
        userId,
        friendId,
        isGroup: conversation?.type === "group"
      });
    };

    // Join on mount and rejoin on reconnection (new server socket = lost rooms)
    joinRoom();
    socket.on("connect", joinRoom);

    const handleNewMessage = (msg: Message) => {
      if (msg.chat !== room) return;
      // Room is open → advance read receipts for messages arriving from others.
      if (userId && msg.sender?._id !== userId) {
        socket.emit("mark_seen", { chatId: room, userId });
      }
      handlersRef.current.onNewMessage(msg);
    };

    const handleReaction = ({
      messageId,
      reactions
    }: {
      messageId: string;
      reactions: Message["reactions"];
    }) => {
      handlersRef.current.onReactionUpdate(messageId, reactions);
    };

    const handleTyping = ({
      chatId,
      userId: uid
    }: {
      chatId: string;
      userId: string;
    }) => {
      if (chatId !== room) return;
      if (uid && uid !== userId) {
        setTypingUsers((prev) => [...new Set([...prev, uid])]);
      }
    };

    const handleStopTyping = ({
      chatId,
      userId: uid
    }: {
      chatId: string;
      userId: string;
    }) => {
      if (chatId !== room) return;
      setTypingUsers((prev) => prev.filter((id) => id !== uid));
    };

    const handleSeenBulk = ({
      chatId,
      userId: uid
    }: {
      chatId: string;
      userId: string;
    }) => {
      if (chatId !== room) return;
      handlersRef.current.onSeenBulk({ chatId, userId: uid });
    };

    socket.on("new_message", handleNewMessage);
    socket.on("reaction_updated", handleReaction);
    socket.on("user_typing", handleTyping);
    socket.on("user_stop_typing", handleStopTyping);
    socket.on("message_seen_update_bulk", handleSeenBulk);

    return () => {
      socket.off("connect", joinRoom);
      socket.emit("leave_room", { chatId: room, userId });
      socket.off("new_message", handleNewMessage);
      socket.off("reaction_updated", handleReaction);
      socket.off("user_typing", handleTyping);
      socket.off("user_stop_typing", handleStopTyping);
      socket.off("message_seen_update_bulk", handleSeenBulk);
    };
  }, [socket, room, userId, friendId, conversation?.type]);

  return { typingUsers, friendStatus } as const;
};
