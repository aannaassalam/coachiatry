import { SmartAvatar } from "@/components/ui/smart-avatar";
import { cn } from "@/lib/utils";
import { Message } from "@/typescript/interface/message.interface";
import { User } from "@/typescript/interface/user.interface";
import { useParams } from "next/navigation";

type TextMessageProps = {
  sender?: User;
  message: Message;
  showAvatar?: boolean;
  isGroup: boolean;
  isDeletable?: boolean;
};

export default function TextMessage({
  sender,
  message,
  showAvatar,
  isGroup,
  isDeletable
}: TextMessageProps) {
  const { userId } = useParams();
  const isUser = isDeletable
    ? sender?._id === userId || sender === userId
    : false;
  const reactions = message.reactions ?? [];

  return (
    <div>
      {!isUser && showAvatar && isGroup && (
        <p className="pl-12 text-xs font-medium text-gray-600/90 mb-1">
          {isDeletable ? sender?.fullName : "Coachiatry"}
        </p>
      )}
      <div className="flex items-start gap-3 relative">
        {!isUser && showAvatar && (
          <SmartAvatar
            src={
              isDeletable
                ? sender?.photo
                : "https://coachiatry.s3.us-east-1.amazonaws.com/Logo+Mark+(1).png"
            }
            name={isDeletable ? sender?.fullName : "Coachiatry"}
            key={sender?.updatedAt ?? "Coachiatry"}
            className="size-8"
          />
        )}
        {/* If user: Emoji first then bubble; if not user: bubble then emoji */}

        <div
          className={cn(
            "max-w-xs relative px-[14px] py-[7px] rounded-lg rounded-tr-none text-sm ",
            isUser ? "bg-primary text-white" : "bg-gray-100 text-primary",
            !isUser && !showAvatar && "ml-[2.75rem]"
          )}
        >
          {typeof message.replyTo !== "string" &&
            !!Object.keys(message.replyTo ?? {}).length && (
              <div
                className={cn(
                  "flex gap-1 mb-2 bg-gray-100 p-2 pl-1 rounded text-primary",
                  {
                    "bg-white/70": !isUser
                  }
                )}
              >
                <div className="w-1 rounded-lg bg-primary" />
                <div className="flex-1">
                  <p className="text-xs">
                    {message.replyTo?.sender?._id === userId
                      ? "You"
                      : message.replyTo?.sender?.fullName}
                  </p>
                  <p className="truncate min-w-0">
                    {message.replyTo?.content ||
                      (message.replyTo?.type === "image"
                        ? `📷 ${message.replyTo.files?.length} images`
                        : message.replyTo?.type === "video"
                          ? `🎥 ${message.replyTo.files?.length} videos`
                          : `📁 ${message.replyTo?.files?.length} files`)}
                  </p>
                </div>
              </div>
            )}
          <p className="wrap-break-word">{message.content}</p>
          {reactions.length > 0 && (
            <div
              className={cn(
                "absolute -bottom-4 left-3 border-1 border-white rounded-full py-0.5 px-1 flex items-center justify-center text-sm bg-white shadow gap-1",
                isUser && "left-auto right-3"
              )}
            >
              {reactions.map((_reaction) => (
                <span
                  className="leading-[15px] cursor-pointer"
                  key={_reaction._id}
                >
                  {_reaction.emoji}
                </span>
              ))}
            </div>
          )}
          {/* <UploadProgressOverlay progress={0} onCancel={() => {}} /> */}
        </div>

        {/* {status} */}
      </div>
    </div>
  );
}
