import ImageSlider from "@/components/Chats/ImageSlider";
// import { Dialog, DialogContent } from "@/components/ui/dialog";
import { SmartAvatar } from "@/components/ui/smart-avatar";
import { cn } from "@/lib/utils";
import { Message } from "@/typescript/interface/message.interface";
import { User } from "@/typescript/interface/user.interface";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function ImageMessage({
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
  const { userId } = useParams();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const isUser = sender?._id === userId || sender === userId;
  const reactions = message?.reactions ?? [];

  if (!message.files?.length) return null;

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
          <div className="relative">
            {/* ✅ Image Grid */}
            {message.files.length > 4 ? (
              <div className="grid grid-cols-2 gap-1 rounded-lg overflow-hidden w-full max-w-xs">
                {message.files.slice(0, 4).map((f, i) => (
                  <div
                    key={i}
                    className="relative cursor-pointer"
                    onClick={() => {
                      setSelected(i);
                      setOpen(true);
                    }}
                  >
                    <Image
                      src={f.thumbnailUrl || f.url}
                      alt={`img-${i}`}
                      width={200}
                      height={200}
                      className="object-cover w-full h-full aspect-square"
                    />
                    {i === 3 && (message.files?.length ?? 0) > 4 && (
                      <div className="absolute inset-0 bg-black/60 text-white flex items-center justify-center text-lg font-semibold">
                        +{(message.files?.length ?? 0) - 4}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div
                className={
                  message.files.length > 1
                    ? "grid grid-cols-2 gap-1 w-full max-w-xs"
                    : "flex w-full max-w-xs"
                }
              >
                {message.files.map((f, i) => (
                  <Image
                    key={i}
                    src={f.thumbnailUrl || f.url}
                    alt={`img-${i}`}
                    width={200}
                    height={200}
                    className="rounded-lg cursor-pointer object-cover aspect-square"
                    onClick={() => {
                      setSelected(i);
                      setOpen(true);
                    }}
                  />
                ))}
              </div>
            )}
            <p className="wrap-break-word mt-1">{message.content}</p>
            {/* ✅ Upload Progress Overlay */}

            {/* ✅ Lightbox
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
              {selected !== null && (
                <Image
                  src={message.files[selected].url}
                  alt="preview"
                  className="w-full h-auto"
                  width={500}
                  height={500}
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
