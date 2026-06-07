import {
  createGroup,
  editGroup,
  inviteToGroupByEmail,
  leaveGroup
} from "@/external-api/functions/chat.api";
import { cn } from "@/lib/utils";
import { queryClient } from "@/pages/_app";
import { useMutation } from "@tanstack/react-query";
import { Camera } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import AsyncMultiSelectUsers from "../AsyncMultiSelectUsers";
import GroupInviteEmails from "./GroupInviteEmails";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger
} from "../ui/dialog";
import { Input } from "../ui/input";
import { SmartAvatar } from "../ui/smart-avatar";

type Details = {
  name: string;
  members: string[];
};

export default function GroupModal({
  children,
  data
}: {
  children: ReactNode;
  data?: Partial<Details> & { groupPhoto?: string };
}) {
  const [room, setRoom] = useQueryState("room", parseAsString.withDefault(""));
  const [open, setOpen] = useState(false);
  const [groupPhoto, setGroupPhoto] = useState<File | string | null>(
    data?.groupPhoto ?? null
  );
  const [details, setDetails] = useState<Details>({
    name: data?.name ?? "",
    members: data?.members ?? []
  });
  // Emails for people who can't be added directly (not in system, or no access).
  const [inviteEmails, setInviteEmails] = useState<string[]>([]);

  const previewUrl = useMemo(() => {
    if (typeof groupPhoto === "string" || !groupPhoto) {
      return groupPhoto;
    }
    // This function is only called when groupPhoto changes
    return URL.createObjectURL(groupPhoto);
  }, [groupPhoto]);

  // Cleanup effect for memory (revokes the previous URL when a new one is created or component unmounts)
  useEffect(() => {
    return () => {
      // Only revoke if groupPhoto is a File (i.e., we created an Object URL)
      if (groupPhoto instanceof File && previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl, groupPhoto]);

  // Fire-and-forget email invites once we know the group id. Backend skips
  // people already addable/added and only emails those out of reach.
  const sendInvitesIfAny = async (chatId: string) => {
    if (!chatId || inviteEmails.length === 0) return;
    try {
      await inviteToGroupByEmail({ chatId, emails: inviteEmails });
      toast.success(`${inviteEmails.length} invitation(s) sent`);
    } catch {
      toast.error("Failed to send some invitations");
    }
  };

  const { mutate, isPending } = useMutation({
    mutationFn: createGroup,
    onSuccess: async (group: { _id?: string }) => {
      await sendInvitesIfAny(group?._id ?? "");
      setGroupPhoto(null);
      setDetails({
        name: "",
        members: []
      });
      setInviteEmails([]);
      setOpen(false);
    },
    meta: {
      invalidateQueries: ["conversations"]
    }
  });

  const { mutate: editMutate, isPending: isEditing } = useMutation({
    mutationFn: editGroup,
    onSuccess: async () => {
      await sendInvitesIfAny(room);
      setInviteEmails([]);
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["conversations", room] });
    },
    meta: {
      invalidateQueries: ["conversations"]
    }
  });

  const { mutate: leave, isPending: isLeaving } = useMutation({
    mutationFn: leaveGroup,
    onSuccess: () => {
      setOpen(false);
      setRoom(null);
    },
    meta: {
      invalidateQueries: ["conversations"]
    }
  });

  const hasRecipients = details.members.length > 0 || inviteEmails.length > 0;

  const handleSubmit = () => {
    if (!details.name?.trim() || !hasRecipients) return;
    if (!data && typeof groupPhoto !== "string")
      mutate({ ...details, groupPhoto });
    if (data) editMutate({ ...details, groupPhoto, chatId: room });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>{children}</DialogTrigger>
      <DialogContent className="w-sm">
        <DialogTitle>{data ? "Edit" : "Create"} Group</DialogTitle>
        <div className="space-y-3 flex flex-col">
          <div className="relative size-25 mr-2 group self-center">
            {groupPhoto && (
              <SmartAvatar
                src={previewUrl ?? undefined}
                // name={details.name}
                // key={previewUrl?.toString()}
                className="size-25"
              />
            )}
            <div
              className={cn(
                "absolute inset-0 bg-black/25 flex items-center justify-center rounded-full cursor-pointer transition-opacity z-1 opacity-0 pointer-events-none",
                {
                  "group-hover:opacity-100": groupPhoto,
                  "opacity-100": !groupPhoto
                }
              )}
            >
              <Camera className="text-white" />
            </div>
            <input
              type="file"
              accept="image/*"
              className="absolute inset-0 opacity-0 cursor-pointer"
              style={{ zIndex: 2 }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setGroupPhoto(file);
              }}
              disabled={isPending || isEditing}
            />
          </div>
          <div className="space-y-1">
            <span className="text-sm font-medium text-gray-700">Name</span>
            <Input
              type="text"
              placeholder="Enter group name"
              className="h-12 font-medium text-base bg-gray-50/60"
              value={details.name}
              onChange={(e) =>
                setDetails((prev) => ({ ...prev, name: e.target.value }))
              }
              disabled={isPending || isEditing}
            />
          </div>
          <div className="space-y-1">
            <span className="text-sm font-medium text-gray-700">Members</span>
            <AsyncMultiSelectUsers
              selectedUsers={details.members}
              onChange={(users) =>
                setDetails((prev) => ({ ...prev, members: users }))
              }
              existingUsers={[]}
              exclude={data?.members ?? []}
              disabled={isPending || isEditing}
            />
          </div>
          <div className="space-y-1">
            <span className="text-sm font-medium text-gray-700">
              Invite by email
            </span>
            <GroupInviteEmails
              emails={inviteEmails}
              onChange={setInviteEmails}
              disabled={isPending || isEditing}
            />
          </div>
        </div>
        <DialogFooter className="!flex-col">
          {data ? (
            <Button
              center
              className="w-full border-red-500 text-red-500 hover:text-red-500"
              onClick={() => leave(room)}
              disabled={isEditing}
              isLoading={isLeaving}
              variant="outline"
            >
              Leave group
            </Button>
          ) : null}
          <Button
            center
            className="w-full"
            onClick={handleSubmit}
            disabled={!details.name.trim() || !hasRecipients}
            isLoading={isPending || isEditing}
          >
            {data ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
