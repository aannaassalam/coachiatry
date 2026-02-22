import { cn } from "@/lib/utils";
import { Message } from "@/typescript/interface/message.interface";
import { User } from "@/typescript/interface/user.interface";
import { useSession } from "next-auth/react";
import FileMessage from "./MessageContent/FileMessage";
import ImageMessage from "./MessageContent/ImageMessge";
import TextMessage from "./MessageContent/TextMessage";
import VideoMessage from "./MessageContent/VideoMessage";

type ChatMessageProps = {
  sender?: User;
  message: Message;
  showAvatar?: boolean;
  setReplyingTo: React.Dispatch<React.SetStateAction<Message | null>>;
  isGroup: boolean;
  isDeletable?: boolean;
};

export default function ChatMessage({
  sender,
  message,
  showAvatar,
  setReplyingTo,
  isGroup,
  isDeletable
}: ChatMessageProps) {
  const { data } = useSession();
  const isUser =
    isDeletable &&
    (sender?._id === data?.user?._id || sender === data?.user?._id);
  const reactions = message.reactions ?? [];

  const renderMessageContent = () => {
    const sharedProps = {
      sender,
      setReplyingTo,
      showAvatar,
      message,
      isGroup
    };

    if (message.type === "text") {
      return <TextMessage {...sharedProps} isDeletable={isDeletable} />;
    }

    if (message.type === "image") {
      return (
        <ImageMessage
          {...sharedProps}
          overallProgress={message.overallProgress}
        />
      );
    }

    if (message.type === "video") {
      return (
        <VideoMessage
          {...sharedProps}
          overallProgress={message.overallProgress}
        />
      );
    }

    if (message.type === "file") {
      return (
        <FileMessage
          {...sharedProps}
          overallProgress={message.overallProgress}
        />
      );
    }

    return null;
  };

  return (
    <div
      className={cn(
        "flex my-2 group",
        isUser ? "justify-end" : "justify-start",
        !showAvatar && "my-0.5",
        reactions.length > 0 && "mb-5"
      )}
      onDoubleClick={() =>
        message.overallProgress === undefined ? setReplyingTo(message) : null
      }
    >
      {renderMessageContent()}
    </div>
  );
}
