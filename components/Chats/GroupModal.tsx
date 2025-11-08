import {
  createGroup,
  editGroup,
  leaveGroup
} from "@/external-api/functions/chat.api";
import { cn } from "@/lib/utils";
import { queryClient } from "@/pages/_app";
import { useMutation } from "@tanstack/react-query";
import { Camera } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { ReactNode, useState } from "react";
import AsyncMultiSelectUsers from "../AsyncMultiSelectUsers";
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

  const { mutate, isPending } = useMutation({
    mutationFn: createGroup,
    onSuccess: () => {
      setGroupPhoto(null);
      setDetails({
        name: "",
        members: []
      });
      setOpen(false);
    },
    meta: {
      invalidateQueries: ["conversations"]
    }
  });

  const { mutate: editMutate, isPending: isEditing } = useMutation({
    mutationFn: editGroup,
    onSuccess: () => {
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

  const handleSubmit = () => {
    if (!details.name?.trim() || details.members.length === 0) return;
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
                src={
                  typeof groupPhoto === "string"
                    ? groupPhoto
                    : URL.createObjectURL(groupPhoto)
                }
                name={details.name}
                key={groupPhoto.toString()}
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
            disabled={!details.name.trim() || details.members.length === 0}
            isLoading={isPending || isEditing}
          >
            {data ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
