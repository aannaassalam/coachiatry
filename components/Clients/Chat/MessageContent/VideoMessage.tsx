import ImageSlider from "@/components/Chats/ImageSlider";
// import { Dialog, DialogContent } from "@/components/ui/dialog";
import { SmartAvatar } from "@/components/ui/smart-avatar";
import { cn } from "@/lib/utils";
import { Message } from "@/typescript/interface/message.interface";
import { User } from "@/typescript/interface/user.interface";
import { Play } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState } from "react";

export default function VideoMessage({
  sender,
  message,
  showAvatar,
  isGroup
}: {
  sender?: User;
  message: Message;
  showAvatar?: boolean;
  isGroup: boolean;
}) {
  const { data } = useSession();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const isUser = sender?._id === data?.user?._id || sender === data?.user?._id;
  const reactions = message?.reactions ?? [];

  if (!message.files || message.files.length === 0) return null;

  return (
    <div>
      {!isUser && showAvatar && isGroup && (
        <p className="pl-12 text-xs font-medium text-gray-600/90 mb-1">
          {sender?.fullName}
        </p>
      )}
      <div className="flex items-start gap-3 relative">
        {!isUser && showAvatar && (
          <SmartAvatar
            src={sender?.photo}
            name={sender?.fullName}
            key={sender?.updatedAt}
            className="size-8"
          />
        )}

        {/* If user: Emoji first then bubble; if not user: bubble then emoji */}

        <div
          className={cn(
            "max-w-xs relative px-[7px] py-[7px] rounded-lg rounded-tr-none text-sm ",
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
                    {message.replyTo?.sender?._id === data?.user?._id
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
          <div
            className={`
        grid gap-1
        ${message.files.length === 1 ? "grid-cols-1" : ""}
        ${message.files.length >= 2 ? "grid-cols-2" : ""}
        w-full max-w-xs relative
      `}
          >
            {message.files.map((file, idx) => (
              <div
                key={file.url || idx}
                className="relative w-full aspect-square rounded-lg overflow-hidden bg-black/5"
                onClick={() => {
                  setSelected(idx);
                  setOpen(true);
                }}
              >
                <video
                  src={file.url}
                  className="object-cover w-full h-full rounded-lg"
                />
                <div className="bg-black/50 flex items-center justify-center rounded-full size-10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <Play size={25} className="text-white" />
                </div>
              </div>
            ))}
            <p className="wrap-break-word mt-1">{message.content}</p>

            {/* <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
              {selected !== null && (
                <video
                  src={message.files[selected].url}
                  controls
                  className="object-cover w-full h-full rounded-lg"
                />
              )}
            </DialogContent>
          </Dialog> */}
            {open && (
              <ImageSlider
                data={message.files.map((f) => ({
                  // normalize to the shape ImageSlider expects and ensure `size` is a primitive number
                  _id: f._id,
                  url: f.url,
                  type: f.type,
                  size:
                    typeof f.size === "number"
                      ? f.size
                      : f.size
                        ? Number(f.size)
                        : undefined
                }))}
                open={open}
                close={() => setOpen(false)}
                id={selected}
              />
            )}
          </div>

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
        </div>
      </div>
    </div>
  );
}
