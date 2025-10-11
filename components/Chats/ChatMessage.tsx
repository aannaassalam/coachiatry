import { cn } from "@/lib/utils";
import { Message } from "@/typescript/interface/message.interface";
import { User } from "@/typescript/interface/user.interface";
import { useSession } from "next-auth/react";
import React from "react";
import FileMessage from "./MessageContent/FileMessage";
import ImageMessage from "./MessageContent/ImageMessge";
import TextMessage from "./MessageContent/TextMessage";
import VideoMessage from "./MessageContent/VideoMessage";

type ChatMessageProps = {
  sender?: User;
  message: Message;
  showAvatar?: boolean;
  setReplyingTo: React.Dispatch<React.SetStateAction<Message | null>>;
};

export default function ChatMessage({
  sender,
  message,
  showAvatar,
  setReplyingTo
}: ChatMessageProps) {
  const { data } = useSession();
  const isUser = sender?._id === data?.user?._id;
  const reactions = message.reactions ?? [];

  const renderMessageContent = () => {
    switch (message.type) {
      case "text":
        return (
          <TextMessage
            sender={sender}
            setReplyingTo={setReplyingTo}
            showAvatar={showAvatar}
            message={message}
          />
        );
      case "image":
        return <ImageMessage files={message.files || []} />;
      case "video":
        return <VideoMessage files={message.files || []} />;
      case "file":
        return <FileMessage files={message.files || []} />;
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        "flex my-2 group",
        isUser ? "justify-end" : "justify-start",
        !showAvatar && "my-0.5",
        reactions.length > 0 && "mb-5"
      )}
      onDoubleClick={() => setReplyingTo(message)}
    >
      {renderMessageContent()}
    </div>
  );
}
