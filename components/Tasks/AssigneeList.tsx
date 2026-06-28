import { getTaskAssignees } from "@/external-api/functions/task.api";
import { useDebounce } from "@/hooks/utils/useDebounce";
import { User } from "@/typescript/interface/user.interface";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Check, Loader2, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "../ui/badge";
import { SmartAvatar } from "../ui/smart-avatar";

function AssigneeRow({
  user,
  currentUserId,
  assigned,
  onClick
}: {
  user: User;
  currentUserId?: string;
  assigned: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="[all:unset] w-full! !flex !items-center !gap-3 cursor-pointer rounded-md px-3 py-1.5! hover:bg-gray-50"
    >
      <span className="w-4">
        {assigned && <Check size={14} className="text-green-500 shrink-0" />}
      </span>
      <SmartAvatar
        src={user?.photo}
        name={user?.fullName}
        key={user?.updatedAt}
        className="size-5"
        textSize="text-[11px]"
      />
      <span className="font-lato font-medium text-sm text-gray-700 flex-1 truncate">
        {user?._id === currentUserId ? "me" : user?.fullName}
      </span>
      {user?.role && (
        <Badge
          variant="outline"
          className="capitalize rounded-full py-0 px-2 font-archivo font-medium text-[10px] leading-4 text-gray-500"
        >
          {user.role}
        </Badge>
      )}
    </button>
  );
}

/**
 * Searchable, infinite-scrolling assignee picker (the assignee popover body,
 * shared by both task tables). Currently-assigned users (from the task itself)
 * are pinned on top; the candidate list below is paginated from the server
 * (staff see all staff, a regular user sees their hierarchy). Clicking a row
 * calls `onToggle`, which drives the parent's optimistic assign mutation.
 */
export default function AssigneeList({
  taskId,
  assignees,
  currentUserId,
  onToggle
}: {
  taskId: string;
  assignees: User[];
  currentUserId?: string;
  onToggle: (user: User) => void;
}) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const listRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ["task-assignees", taskId, debouncedSearch],
    queryFn: ({ pageParam }) =>
      getTaskAssignees({ taskId, page: pageParam, search: debouncedSearch }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta && lastPage.meta.currentPage < lastPage.meta.totalPages
        ? lastPage.meta.currentPage + 1
        : undefined
  });

  const canAssign = data?.pages?.[0]?.canAssign ?? true;

  const assignedIds = useMemo(
    () => new Set(assignees.map((u) => u._id)),
    [assignees]
  );

  // Server already excludes assigned users, but dedupe defensively.
  const candidateList = useMemo(
    () =>
      (data?.pages.flatMap((p) => p.assignees) ?? []).filter(
        (u) => !assignedIds.has(u._id)
      ),
    [data, assignedIds]
  );

  // Pinned-on-top assignees come straight from the task; filter by search too.
  const assignedFiltered = useMemo(() => {
    const s = debouncedSearch.trim().toLowerCase();
    if (!s) return assignees;
    return assignees.filter(
      (u) =>
        (u.fullName || "").toLowerCase().includes(s) ||
        (u.email || "").toLowerCase().includes(s)
    );
  }, [assignees, debouncedSearch]);

  useEffect(() => {
    if (!hasNextPage) return;
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { root: listRef.current, rootMargin: "120px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (!canAssign) {
    return (
      <div className="px-3 py-2 text-sm text-gray-400">
        You can&apos;t change this task&apos;s assignees.
      </div>
    );
  }

  const nothingToShow =
    !isLoading && assignedFiltered.length === 0 && candidateList.length === 0;

  return (
    <div className="flex flex-col">
      <div className="flex h-9 items-center gap-2 border-b px-3">
        <Search className="size-4 shrink-0 opacity-50" />
        <input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search people..."
          className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
        />
      </div>

      <div ref={listRef} className="max-h-72 overflow-y-auto p-1">
        {assignedFiltered.map((u) => (
          <AssigneeRow
            key={u._id}
            user={u}
            currentUserId={currentUserId}
            assigned
            onClick={() => onToggle(u)}
          />
        ))}

        {assignedFiltered.length > 0 && candidateList.length > 0 && (
          <div className="my-1 border-t border-gray-100" />
        )}

        {isLoading ? (
          <div className="px-3 py-2 text-sm text-gray-400">Loading…</div>
        ) : (
          candidateList.map((u) => (
            <AssigneeRow
              key={u._id}
              user={u}
              currentUserId={currentUserId}
              assigned={false}
              onClick={() => onToggle(u)}
            />
          ))
        )}

        {nothingToShow && (
          <div className="px-3 py-2 text-sm text-gray-400">No people found</div>
        )}

        {hasNextPage && (
          <div
            ref={sentinelRef}
            className="flex items-center justify-center py-2"
          >
            {isFetchingNextPage && (
              <Loader2 className="size-4 animate-spin text-gray-400" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
