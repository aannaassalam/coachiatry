"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import {
  getUsersByIds,
  getUserSuggestions
} from "@/external-api/functions/user.api";
import { getInitials } from "@/lib/functions/_helpers.lib";
import { User } from "@/typescript/interface/user.interface";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Loader2, X } from "lucide-react";
import * as React from "react";
import { SmartAvatar } from "./ui/smart-avatar";
import { useSession } from "next-auth/react";

type MultiSelectUser = Pick<User, "_id" | "photo" | "email" | "fullName">;

export default function AsyncMultiSelectUsers({
  selectedUsers,
  onChange,
  disabled,
  existingUsers = []
}: {
  selectedUsers: string[];
  onChange: (users: string[]) => void;
  disabled?: boolean;
  existingUsers?: string[];
}) {
  const { data } = useSession();
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [cachedUsers, setCachedUsers] = React.useState<MultiSelectUser[]>([]);

  // 🔍 Search users (on demand)
  const {
    data: searchResults = [],
    isLoading,
    isFetching
  } = useQuery({
    queryKey: ["suggest-users", search],
    queryFn: () => getUserSuggestions(search)
  });

  // 🔄 Preload user details for selected IDs
  const { data: preloadedUsers, isLoading: isPreloadedUsersLoading } = useQuery(
    {
      queryKey: ["selected-users", selectedUsers],
      queryFn: () => getUsersByIds(selectedUsers),
      enabled: selectedUsers.length > 0
    }
  );

  // 🧠 Sync preloaded users into cache
  React.useEffect(() => {
    if (preloadedUsers && preloadedUsers.length > 0) {
      setCachedUsers((prev) => {
        const existingIds = prev.map((u) => u._id);
        const newOnes = preloadedUsers.filter(
          (u) => !existingIds.includes(u._id)
        );
        return [...prev, ...newOnes];
      });
    }
  }, [preloadedUsers]);

  // 🧩 Add or remove a user
  const toggleUser = (id: string) => {
    const user =
      searchResults?.find((_user) => _user._id === id) ||
      cachedUsers.find((_user) => _user._id === id);

    if (!selectedUsers.includes(id)) {
      setSearch("");
      if (user) {
        setCachedUsers((prev) => {
          if (!prev.find((u) => u._id === id)) return [...prev, user];
          return prev;
        });
      }
    }

    onChange(
      selectedUsers.includes(id)
        ? selectedUsers.filter((x) => x !== id)
        : [...selectedUsers, id]
    );
  };

  // ❌ Remove user manually
  const removeUser = (id: string) => {
    onChange(selectedUsers.filter((x) => x !== id));
  };

  // 🎯 Filter cached users to display only selected ones
  const selected = cachedUsers.filter((u) => selectedUsers.includes(u._id));

  return (
    <div className="w-full max-w-md">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild disabled={disabled}>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full"
            spacebetween
            disabled={isPreloadedUsersLoading}
          >
            {isPreloadedUsersLoading ? (
              "Loading..."
            ) : selected.length > 0 ? (
              <div className="flex flex-wrap gap-1 items-center text-left">
                {selected.map((user) => (
                  <Badge
                    key={user._id}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    <SmartAvatar
                      src={user.photo}
                      name={getInitials(user.fullName)}
                      className="size-4"
                      textSize="text-xs"
                    />
                    <span>{user.fullName}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeUser(user._id);
                      }}
                      className="p-0.5 hover:bg-muted rounded-sm transition-colors cursor-pointer"
                      disabled={user._id === data?.user?._id}
                    >
                      <X size={12} className="text-muted-foreground" />
                    </button>
                  </Badge>
                ))}
              </div>
            ) : (
              "Select users..."
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[350px] p-0">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search users..."
              value={search}
              onValueChange={(value) => setSearch(value)}
            />
            <CommandList>
              {isLoading || isFetching || isPreloadedUsersLoading ? (
                <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading users...
                </div>
              ) : searchResults.length === 0 ? (
                <CommandEmpty>No users found.</CommandEmpty>
              ) : (
                <CommandGroup>
                  {searchResults
                    ?.filter((user) => !existingUsers.includes(user._id))
                    .map((user) => {
                      const isSelected = selectedUsers.includes(user._id);
                      return (
                        <CommandItem
                          key={user._id}
                          onSelect={() => toggleUser(user._id)}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <SmartAvatar
                            src={user.photo}
                            name={getInitials(user.fullName)}
                            className="size-6"
                            textSize="text-xs"
                          />
                          <div className="flex flex-col text-sm">
                            <span className="font-medium">{user.fullName}</span>
                            <span className="text-xs text-muted-foreground">
                              {user.email}
                            </span>
                          </div>
                          {isSelected && (
                            <Check className="ml-auto h-4 w-4 text-primary" />
                          )}
                        </CommandItem>
                      );
                    })}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
