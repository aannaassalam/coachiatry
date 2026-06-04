import {
  addWatchers,
  findWatcherByEmail,
  inviteWatchersByEmail
} from "@/external-api/functions/user.api";
import { User } from "@/typescript/interface/user.interface";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Mail, Plus, Search, UserPlus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { DialogFooter } from "./ui/dialog";
import { Input } from "./ui/input";
import { SmartAvatar } from "./ui/smart-avatar";

type WatcherUser = Pick<User, "_id" | "fullName" | "email" | "photo" | "role">;

type SearchState =
  | { status: "idle" }
  | { status: "found"; user: WatcherUser; alreadyWatcher: boolean }
  | { status: "notfound"; email: string }
  | { status: "self" };

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

interface AddWatchersProps {
  existingWatcherIds: string[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddWatchers({
  existingWatcherIds,
  onClose,
  onSuccess
}: AddWatchersProps) {
  const [email, setEmail] = useState("");
  const [search, setSearch] = useState<SearchState>({ status: "idle" });
  const [selectedUsers, setSelectedUsers] = useState<WatcherUser[]>([]);
  const [invitedEmails, setInvitedEmails] = useState<string[]>([]);

  const { mutate: runSearch, isPending: isSearching } = useMutation({
    mutationFn: findWatcherByEmail,
    onSuccess: (res, searchedEmail) => {
      if (res.isSelf) {
        setSearch({ status: "self" });
      } else if (res.found && res.user) {
        setSearch({
          status: "found",
          user: res.user,
          alreadyWatcher: Boolean(res.alreadyWatcher)
        });
      } else {
        setSearch({ status: "notfound", email: searchedEmail });
      }
    },
    meta: { showToast: false }
  });

  const { mutate: submit, isPending: isSubmitting } = useMutation({
    mutationFn: async () => {
      const ids = selectedUsers.map((u) => u._id);
      let lastRes;
      if (ids.length) lastRes = await addWatchers(ids);
      if (invitedEmails.length)
        lastRes = await inviteWatchersByEmail(invitedEmails);
      return lastRes;
    },
    onSuccess: () => {
      const added = selectedUsers.length;
      const invited = invitedEmails.length;
      if (added) toast.success(`${added} watcher(s) added`);
      if (invited) toast.success(`${invited} invitation(s) sent`);
      onSuccess();
      onClose();
    },
    meta: { showToast: false }
  });

  const handleSearch = () => {
    const trimmed = email.trim().toLowerCase();
    if (!isValidEmail(trimmed)) {
      toast.error("Enter a valid email address");
      return;
    }
    runSearch(trimmed);
  };

  const addSystemUser = (user: WatcherUser) => {
    if (
      !selectedUsers.some((u) => u._id === user._id) &&
      !existingWatcherIds.includes(user._id)
    ) {
      setSelectedUsers((prev) => [...prev, user]);
    }
    setEmail("");
    setSearch({ status: "idle" });
  };

  const addInvite = (inviteEmail: string) => {
    const normalized = inviteEmail.trim().toLowerCase();
    if (
      !invitedEmails.includes(normalized) &&
      !selectedUsers.some((u) => u.email.toLowerCase() === normalized)
    ) {
      setInvitedEmails((prev) => [...prev, normalized]);
    }
    setEmail("");
    setSearch({ status: "idle" });
  };

  const removeUser = (id: string) =>
    setSelectedUsers((prev) => prev.filter((u) => u._id !== id));

  const removeInvite = (e: string) =>
    setInvitedEmails((prev) => prev.filter((x) => x !== e));

  const nothingSelected =
    selectedUsers.length === 0 && invitedEmails.length === 0;

  return (
    <div className="space-y-4 p-2.5">
      {/* Email search row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="email"
            placeholder="Enter email address"
            className="pl-9 h-10"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (search.status !== "idle") setSearch({ status: "idle" });
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSearch();
              }
            }}
          />
        </div>
        <Button
          type="button"
          size="sm"
          className="h-10 gap-1.5"
          onClick={handleSearch}
          isLoading={isSearching}
        >
          {!isSearching && <Search className="h-4 w-4" />}
          Search
        </Button>
      </div>

      {/* Search result */}
      {isSearching ? (
        <div className="flex items-center gap-2 text-sm text-gray-500 px-1">
          <Loader2 className="h-4 w-4 animate-spin" />
          Searching…
        </div>
      ) : search.status === "found" ? (
        <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
          <SmartAvatar
            src={search.user.photo}
            name={search.user.fullName}
            className="size-8"
            textSize="text-xs"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {search.user.fullName}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {search.user.email}
            </p>
          </div>
          {search.alreadyWatcher ||
          selectedUsers.some((u) => u._id === search.user._id) ? (
            <span className="text-xs text-gray-400">Already added</span>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="gap-1"
              onClick={() => addSystemUser(search.user)}
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          )}
        </div>
      ) : search.status === "self" ? (
        <p className="text-sm text-gray-500 px-1">
          That&apos;s your own email — you can&apos;t watch yourself.
        </p>
      ) : search.status === "notfound" ? (
        <div className="flex items-center gap-3 rounded-lg border border-dashed border-gray-300 p-3">
          <div className="flex size-8 items-center justify-center rounded-full bg-gray-100">
            <UserPlus className="h-4 w-4 text-gray-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">No account found</p>
            <p className="text-xs text-gray-500 truncate">
              Invite {search.email} via email
            </p>
          </div>
          {invitedEmails.includes(search.email) ? (
            <span className="text-xs text-gray-400">Added</span>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="gap-1"
              onClick={() => addInvite(search.email)}
            >
              <Mail className="h-3.5 w-3.5" />
              Invite
            </Button>
          )}
        </div>
      ) : null}

      {/* Selected chips */}
      {(selectedUsers.length > 0 || invitedEmails.length > 0) && (
        <div className="flex flex-wrap gap-2 pt-1">
          {selectedUsers.map((user) => (
            <Badge
              key={user._id}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {user.fullName}
              <button
                type="button"
                onClick={() => removeUser(user._id)}
                className="ml-1 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {invitedEmails.map((e) => (
            <Badge
              key={e}
              variant="outline"
              className="flex items-center gap-1 text-blue-600 border-blue-200"
            >
              <Mail className="h-3 w-3" />
              {e}
              <button
                type="button"
                onClick={() => removeInvite(e)}
                className="ml-1 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <DialogFooter>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={isSubmitting}
          onClick={onClose}
        >
          Close
        </Button>
        <Button
          type="button"
          size="sm"
          isLoading={isSubmitting}
          disabled={nothingSelected}
          onClick={() => submit()}
        >
          {invitedEmails.length > 0 && selectedUsers.length === 0
            ? "Send Invites"
            : "Add"}
        </Button>
      </DialogFooter>
    </div>
  );
}
