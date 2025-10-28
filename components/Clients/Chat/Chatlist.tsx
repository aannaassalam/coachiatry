// import assets from "@/json/assets";
import { SmartAvatar } from "@/components/ui/smart-avatar";
import { getAllConversationsByCoach } from "@/external-api/functions/chat.api";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import moment from "moment";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";

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
    M: "1m",
    MM: "%dm",
    y: "1y",
    yy: "%dy"
  }
});

export default function ChatList() {
  const [, setSelectedChat] = useQueryState(
    "room",
    parseAsString.withDefault("")
  );
  const { userId } = useParams();
  const { data } = useSession();

  const { data: chats, isLoading } = useQuery({
    queryKey: ["conversations", userId],
    queryFn: () => getAllConversationsByCoach({ userId: userId as string })
  });

  return (
    <div className="w-xs mr-auto bg-white pt-4 rounded-lg flex flex-col max-md:w-full">
      {/* Header / Content Above */}
      <div className="flex items-center justify-between gap-2 mb-3 px-3">
        <h2 className="text-sm font-semibold text-gray-800">All messages</h2>
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
              >
                <SmartAvatar
                  src={details?.photo}
                  name={details?.name}
                  key={_chat.updatedAt}
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
                    {moment(_chat.lastMessage?.createdAt).fromNow(true)}
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
