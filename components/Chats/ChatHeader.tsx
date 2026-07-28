import { BsChevronLeft } from "react-icons/bs";
import {
  Archive,
  ArchiveRestore,
  Ellipsis,
  Settings,
  Trash2
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { setChatArchived } from "@/external-api/functions/chat.api";
import { useState } from "react";
import { Button } from "../ui/button";
import { SmartAvatar } from "../ui/smart-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "../ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "../ui/alert-dialog";
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
  isDeletedUserChat?: boolean;
  onDeleteConversation?: () => void;
  isDeletingConversation?: boolean;
};

export const ChatHeader = ({
  conversation,
  details,
  isConversationLoading,
  friendStatus,
  onBack,
  canManageGroup,
  isDeletedUserChat,
  onDeleteConversation,
  isDeletingConversation
}: Props) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);
  const { data: session } = useSession();

  const { mutate: toggleArchive, isPending: isArchiving } = useMutation({
    mutationFn: setChatArchived,
    meta: { invalidateQueries: ["conversations"] }
  });

  const myMembership = conversation?.members?.find(
    (_mem) => _mem.user?._id === session?.user?._id
  );
  const canEditGroup =
    conversation?.type === "group" &&
    canManageGroup &&
    conversation.isDeletable;
  const canDelete = conversation?.type === "direct" && isDeletedUserChat;

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
            <p
              className={cn("font-semibold font-lato text-base", {
                "text-gray-400": isDeletedUserChat
              })}
            >
              {details.name}
            </p>
            {conversation?.type === "direct" &&
              (isDeletedUserChat ? (
                <p className="text-xs font-lato text-gray-400">
                  Deleted account
                </p>
              ) : (
                <p className="text-xs font-lato flex items-center gap-1 capitalize">
                  <span
                    className={cn("bg-green-500 rounded-full w-2 h-2 flex", {
                      "bg-yellow-500": friendStatus === "offline"
                    })}
                  ></span>
                  {friendStatus}
                </p>
              ))}
          </div>
        </div>
      )}
      {/* One menu for every room action: group settings, archive, delete. */}
      {conversation && (canEditGroup || myMembership || canDelete) && (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-secondary"
                disabled={isDeletingConversation}
              >
                <Ellipsis className="text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canEditGroup && (
                <DropdownMenuItem
                  className="gap-2"
                  onSelect={() => setGroupOpen(true)}
                >
                  <Settings className="size-4" />
                  Group settings
                </DropdownMenuItem>
              )}
              {/* Only a member can archive — a coach viewing a client's room
                  isn't one, and the API rejects it. */}
              {myMembership && (
                <DropdownMenuItem
                  className="gap-2"
                  disabled={isArchiving}
                  onSelect={() =>
                    toggleArchive({
                      chatId: conversation._id!,
                      archived: !myMembership.archived
                    })
                  }
                >
                  {myMembership.archived ? (
                    <>
                      <ArchiveRestore className="size-4" />
                      Unarchive chat
                    </>
                  ) : (
                    <>
                      <Archive className="size-4" />
                      Archive chat
                    </>
                  )}
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem
                  className="gap-2 text-red-600 focus:text-red-600"
                  onSelect={(e) => {
                    e.preventDefault();
                    setConfirmOpen(true);
                  }}
                >
                  <Trash2 className="size-4 text-red-600" />
                  Clear chat & delete conversation
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {canEditGroup && (
            <GroupModal
              open={groupOpen}
              onOpenChange={setGroupOpen}
              data={{
                name: conversation.name,
                members: conversation.members
                  .filter((_mem) => _mem.user?._id)
                  .map((_mem) => _mem.user._id),
                groupPhoto: conversation.groupPhoto
              }}
            />
          )}

          <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <AlertDialogContent className="sm:max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete conversation</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently deletes this conversation and all its
                  messages for you. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel
                  type="button"
                  disabled={isDeletingConversation}
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-500 text-white hover:bg-red-600 hover:text-white"
                  onClick={(e) => {
                    e.preventDefault();
                    onDeleteConversation?.();
                  }}
                  disabled={isDeletingConversation}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
};
