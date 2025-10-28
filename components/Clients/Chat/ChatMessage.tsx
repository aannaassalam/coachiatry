import { cn } from "@/lib/utils";
import { Message } from "@/typescript/interface/message.interface";
import { User } from "@/typescript/interface/user.interface";
import { useParams } from "next/navigation";
import FileMessage from "./MessageContent/FileMessage";
import ImageMessage from "./MessageContent/ImageMessge";
import TextMessage from "./MessageContent/TextMessage";
import VideoMessage from "./MessageContent/VideoMessage";

type ChatMessageProps = {
  sender?: User;
  message: Message;
  showAvatar?: boolean;
  isGroup: boolean;
  isDeletable?: boolean;
};

export default function ChatMessage({
  sender,
  message,
  showAvatar,
  isGroup,
  isDeletable
}: ChatMessageProps) {
  const { userId } = useParams();
  const isUser = isDeletable
    ? sender?._id === userId || sender === userId
    : false;
  const reactions = message.reactions ?? [];

  const renderMessageContent = () => {
    switch (message.type) {
      case "text":
        return (
          <TextMessage
            sender={sender}
            showAvatar={showAvatar}
            message={message}
            isGroup={isGroup}
            isDeletable={isDeletable}
          />
        );
      case "image":
        return (
          <ImageMessage
            sender={sender}
            showAvatar={showAvatar}
            message={message}
            isGroup={isGroup}
          />
        );
      case "video":
        return (
          <VideoMessage
            sender={sender}
            showAvatar={showAvatar}
            message={message}
            isGroup={isGroup}
          />
        );
      case "file":
        return (
          <FileMessage
            sender={sender}
            showAvatar={showAvatar}
            message={message}
            isGroup={isGroup}
          />
        );
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
    >
      {renderMessageContent()}
    </div>
  );
}
