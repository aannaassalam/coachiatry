import { BsChevronLeft } from "react-icons/bs";
import { Ellipsis } from "lucide-react";
import { Button } from "../ui/button";
import { SmartAvatar } from "../ui/smart-avatar";
import GroupModal from "./GroupModal";
import { ChatConversation as Conversation } from "@/typescript/interface/chat.interface";
import { cn } from "@/lib/utils";

type Props = {
  conversation?: Conversation;
  details: { photo?: string; name?: string };
  isConversationLoading: boolean;
  friendStatus: "online" | "offline";
  onBack: () => void;
  canManageGroup: boolean;
};

export const ChatHeader = ({
  conversation,
  details,
  isConversationLoading,
  friendStatus,
  onBack,
  canManageGroup
}: Props) => {
  return (
    <div className="flex justify-between items-center p-4 border-b max-md:p-3 bg-white">
      {isConversationLoading ? (
        <div className="flex items-start gap-3">
          <div className="size-10 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="space-y-1">
            <div className="h-6 w-25 bg-gray-200 rounded-sm animate-pulse " />
            <div className="h-4 w-15 bg-gray-200 rounded-sm animate-pulse " />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4 max-md:gap-3">
          <BsChevronLeft
            className="text-gray-600 size-5 md:hidden cursor-pointer"
            onClick={onBack}
          />
          <SmartAvatar
            src={details.photo}
            name={details.name}
            key={conversation?.updatedAt}
            className="size-10"
          />
          <div>
            <p className="font-semibold font-lato text-base">{details.name}</p>
            {conversation?.type === "direct" && (
              <p className="text-xs font-lato flex items-center gap-1 capitalize">
                <span
                  className={cn("bg-green-500 rounded-full w-2 h-2 flex", {
                    "bg-yellow-500": friendStatus === "offline"
                  })}
                ></span>
                {friendStatus}
              </p>
            )}
          </div>
        </div>
      )}
      {conversation?.type === "group" && canManageGroup && conversation.isDeletable && (
        <GroupModal
          data={{
            name: conversation.name,
            members: conversation.members.map((_mem) => _mem.user._id),
            groupPhoto: conversation.groupPhoto
          }}
        >
          <Button variant="ghost" size="sm" className="hover:bg-secondary">
            <Ellipsis className="text-gray-500" />
          </Button>
        </GroupModal>
      )}
    </div>
  );
};
