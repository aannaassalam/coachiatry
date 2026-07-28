import AddWatchers from "@/components/AddWatchers";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { SmartAvatar } from "@/components/ui/smart-avatar";
import {
  deleteCategory,
  getAllCategoriesByCoach
} from "@/external-api/functions/category.api";
import {
  deleteStatus,
  getAllStatusesByCoach
} from "@/external-api/functions/status.api";
import {
  getUserById,
  revokeViewAccess,
  setClientPassword,
  updateProfilePicture,
  updateUser
} from "@/external-api/functions/user.api";
import { Category } from "@/typescript/interface/category.interface";
import { Status } from "@/typescript/interface/status.interface";
import { User } from "@/typescript/interface/user.interface";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, Link2, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";

type ClientSettingsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
};

const Section = ({
  title,
  description,
  action,
  children
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <section className="border rounded-2xl">
    <div className="flex items-center justify-between gap-3 p-4">
      <div>
        <h3 className="font-lato font-semibold text-base tracking-[-2%]">
          {title}
        </h3>
        {description && (
          <p className="text-xs text-gray-500 font-lato mt-0.5">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
    <Separator />
    <div className="p-4">{children}</div>
  </section>
);

export default function ClientSettingsModal({
  open,
  onOpenChange,
  userId
}: ClientSettingsModalProps) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [watchersDialog, setWatchersDialog] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(
    null
  );
  const [replacementCategoryId, setReplacementCategoryId] = useState("");
  const [deletingStatus, setDeletingStatus] = useState<Status | null>(null);
  const [replacementStatusId, setReplacementStatusId] = useState("");

  // All three keys are already warm: the page fetches clientDetails and
  // prefetches categories/status on mount. staleTime keeps opening the modal
  // from firing three refetches (and the content shifting) every time.
  const { data: client } = useQuery({
    queryKey: ["clientDetails", userId],
    queryFn: () => getUserById(userId),
    enabled: open,
    staleTime: 5 * 60 * 1000
  });

  const { data: categories } = useQuery({
    queryKey: ["categories", userId],
    queryFn: () => getAllCategoriesByCoach(userId),
    enabled: open,
    staleTime: 5 * 60 * 1000
  });

  const { data: statuses } = useQuery({
    queryKey: ["status", userId],
    queryFn: () => getAllStatusesByCoach(userId),
    enabled: open,
    staleTime: 5 * 60 * 1000
  });

  // Seed the name field when the modal opens, NOT on every `client` change —
  // any background refetch (or a photo upload invalidating the query) used to
  // overwrite what was being typed.
  useEffect(() => {
    if (open) setFullName(client?.fullName ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, userId]);

  const watchers = (client?.sharedViewers ?? []) as Pick<
    User,
    "_id" | "fullName" | "email" | "photo" | "role"
  >[];

  const invalidateClient = () =>
    queryClient.invalidateQueries({ queryKey: ["clientDetails", userId] });

  const { mutate: saveName, isPending: isSavingName } = useMutation({
    // Name only: role and assignedCoach are left out on purpose. The backend
    // reassigns a client to the requesting coach whenever assignedCoach is
    // present, so echoing it back here would quietly drop their other coaches.
    mutationFn: () => updateUser({ userId, name: fullName.trim() }),
    onSuccess: () => {
      toast.success("Profile updated");
      invalidateClient();
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    }
  });

  const { mutate: uploadPhoto, isPending: isUploadingPhoto } = useMutation({
    mutationFn: (file: File) => updateProfilePicture(file, userId),
    onSuccess: () => {
      toast.success("Profile picture updated");
      invalidateClient();
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    }
  });

  const { mutate: savePassword, isPending: isSavingPassword } = useMutation({
    mutationFn: () => setClientPassword({ userId, password }),
    onSuccess: () => {
      toast.success("Password updated");
      setPassword("");
      setConfirmPassword("");
    }
  });

  const { mutate: revokeWatcher, isPending: isRevoking } = useMutation({
    mutationFn: (viewerId: string) => revokeViewAccess(viewerId, userId),
    onSuccess: () => {
      toast.success("Access revoked");
      invalidateClient();
    }
  });

  const { mutate: removeCategory, isPending: isDeletingCategory } = useMutation(
    {
      mutationFn: deleteCategory,
      onSuccess: (res) => {
        if (res?.status === "requires_replacement") {
          toast.error(
            `This category has ${res.taskCount} task(s). Select a replacement.`
          );
          return;
        }
        setDeletingCategory(null);
        setReplacementCategoryId("");
        queryClient.invalidateQueries({ queryKey: ["categories", userId] });
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
      },
      meta: { showToast: false }
    }
  );

  const { mutate: removeStatus, isPending: isDeletingStatus } = useMutation({
    mutationFn: deleteStatus,
    onSuccess: (res) => {
      if (res?.status === "requires_replacement") {
        toast.error(
          `This status has ${res.taskCount} task(s). Select a replacement.`
        );
        return;
      }
      setDeletingStatus(null);
      setReplacementStatusId("");
      queryClient.invalidateQueries({ queryKey: ["status", userId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    meta: { showToast: false }
  });

  const copyShareLink = async () => {
    if (!client?.shareId) return;
    await navigator.clipboard.writeText(
      `${process.env.NEXTAUTH_URL}/share/user/${client.shareId}`
    );
    toast.success("Invitation link copied");
  };

  const onSavePassword = () => {
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    savePassword();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {client?.fullName ? `${client.fullName} — settings` : "Settings"}
            </DialogTitle>
            <DialogDescription>
              Everything this person can change in their own settings, editable
              here.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Section
              title="Basic information"
              description="Profile picture and name"
            >
              <div className="flex items-center gap-4 max-sm:flex-col max-sm:items-start">
                <div className="relative shrink-0">
                  <SmartAvatar
                    src={client?.photo}
                    name={client?.fullName}
                    className="size-16 rounded-[12px]"
                  />
                  <button
                    type="button"
                    aria-label="Change profile picture"
                    disabled={isUploadingPhoto}
                    onClick={() => fileRef.current?.click()}
                    className="absolute -bottom-1 -right-1 bg-white border rounded-full p-1.5 shadow-sm hover:bg-gray-50 disabled:opacity-50"
                  >
                    <Camera size={13} className="text-gray-600" />
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadPhoto(file);
                      e.target.value = "";
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0 w-full space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    Full name
                  </label>
                  <div className="flex gap-2 max-sm:flex-col">
                    <Input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Full name"
                    />
                    <Button
                      className="shrink-0"
                      disabled={
                        isSavingName ||
                        !fullName.trim() ||
                        fullName.trim() === client?.fullName
                      }
                      onClick={() => saveName()}
                    >
                      Save
                    </Button>
                  </div>
                  <p className="text-xs text-gray-400">{client?.email}</p>
                </div>
              </div>
            </Section>

            <Section
              title="Password"
              description="Set a new password for this client. They are not notified."
            >
              <div className="flex gap-2 max-sm:flex-col">
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder="New password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <Button
                  className="shrink-0"
                  disabled={isSavingPassword || !password || !confirmPassword}
                  onClick={onSavePassword}
                >
                  Update
                </Button>
              </div>
            </Section>

            <Section
              title="Watchers"
              description="People who can view this client's sheet"
              action={
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!client?.shareId}
                    onClick={copyShareLink}
                  >
                    <Link2 size={14} /> Copy link
                  </Button>
                  <Button size="sm" onClick={() => setWatchersDialog(true)}>
                    <Plus size={14} /> Add
                  </Button>
                </div>
              }
            >
              {watchers.length ? (
                <div className="divide-y">
                  {watchers.map((watcher) => (
                    <div
                      key={watcher._id}
                      className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                    >
                      <SmartAvatar
                        src={watcher.photo}
                        name={watcher.fullName}
                        className="size-9"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {watcher.fullName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {watcher.email}
                        </p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isRevoking}
                            className="ml-auto text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            Revoke
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="sm:max-w-md">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Revoke access?</AlertDialogTitle>
                            <AlertDialogDescription>
                              {watcher.fullName} will lose access to this
                              person&apos;s tasks, and their direct chat is
                              removed. They can be added again later.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={isRevoking}>
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-500 text-white hover:bg-red-600 hover:text-white"
                              disabled={isRevoking}
                              onClick={(e) => {
                                e.preventDefault();
                                revokeWatcher(watcher._id);
                              }}
                            >
                              Revoke
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic py-4 text-center">
                  No watchers yet
                </p>
              )}
            </Section>

            <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1 items-start">
              <Section title="Categories">
                {categories?.length ? (
                  <div className="divide-y">
                    {categories.map((category) => (
                      <div
                        key={category._id}
                        className="flex items-center gap-2 py-2 first:pt-0 last:pb-0"
                      >
                        <span
                          className="size-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: category.color?.text }}
                        />
                        <span className="text-sm font-lato truncate">
                          {category.title}
                        </span>
                        {category.public ? (
                          <span className="ml-auto text-[10px] text-gray-400 font-archivo border rounded-full px-2 py-0.5">
                            system
                          </span>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-auto text-red-500 hover:text-red-600 hover:bg-red-50 h-8 px-2.5"
                            onClick={() => {
                              setDeletingCategory(category);
                              setReplacementCategoryId("");
                            }}
                          >
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic py-4 text-center">
                    No categories yet
                  </p>
                )}
              </Section>

              <Section title="Statuses">
                {statuses?.length ? (
                  <div className="divide-y">
                    {statuses.map((status) => (
                      <div
                        key={status._id}
                        className="flex items-center gap-2 py-2 first:pt-0 last:pb-0"
                      >
                        <span
                          className="size-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: status.color?.text }}
                        />
                        <span className="text-sm font-lato truncate">
                          {status.title}
                        </span>
                        {status.public ? (
                          <span className="ml-auto text-[10px] text-gray-400 font-archivo border rounded-full px-2 py-0.5">
                            system
                          </span>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-auto text-red-500 hover:text-red-600 hover:bg-red-50 h-8 px-2.5"
                            onClick={() => {
                              setDeletingStatus(status);
                              setReplacementStatusId("");
                            }}
                          >
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic py-4 text-center">
                    No statuses yet
                  </p>
                )}
              </Section>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={watchersDialog} onOpenChange={setWatchersDialog}>
        <DialogContent>
          <DialogTitle>Add watchers</DialogTitle>
          <AddWatchers
            userId={userId}
            existingWatcherIds={watchers.map((w) => w._id)}
            onClose={() => setWatchersDialog(false)}
            onSuccess={invalidateClient}
          />
        </DialogContent>
      </Dialog>

      {/* Delete category — tasks using it must be moved first, mirroring the
          replacement flow the client gets on their own settings page. */}
      <Dialog
        open={!!deletingCategory}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setDeletingCategory(null);
            setReplacementCategoryId("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogTitle>
            Delete &ldquo;{deletingCategory?.title}&rdquo;
          </DialogTitle>
          <div className="space-y-1.5">
            <p className="text-sm text-gray-600">
              Tasks in this category will move to the replacement you pick. If
              nothing uses it, it is deleted straight away.
            </p>
            <Select
              value={replacementCategoryId}
              onValueChange={setReplacementCategoryId}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select a replacement category" />
              </SelectTrigger>
              <SelectContent>
                {categories
                  ?.filter((c) => c._id !== deletingCategory?._id)
                  .map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.title}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeletingCategory(null)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={isDeletingCategory}
              onClick={() =>
                deletingCategory &&
                removeCategory({
                  categoryId: deletingCategory._id,
                  replacementCategoryId: replacementCategoryId || undefined
                })
              }
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deletingStatus}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setDeletingStatus(null);
            setReplacementStatusId("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogTitle>
            Delete &ldquo;{deletingStatus?.title}&rdquo;
          </DialogTitle>
          <div className="space-y-1.5">
            <p className="text-sm text-gray-600">
              Tasks in this status will move to the replacement you pick. If
              nothing uses it, it is deleted straight away.
            </p>
            <Select
              value={replacementStatusId}
              onValueChange={setReplacementStatusId}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select a replacement status" />
              </SelectTrigger>
              <SelectContent>
                {statuses
                  ?.filter((s) => s._id !== deletingStatus?._id)
                  .map((s) => (
                    <SelectItem key={s._id} value={s._id}>
                      {s.title}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeletingStatus(null)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={isDeletingStatus}
              onClick={() =>
                deletingStatus &&
                removeStatus({
                  statusId: deletingStatus._id,
                  replacementStatusId: replacementStatusId || undefined
                })
              }
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
