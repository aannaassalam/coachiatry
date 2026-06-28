import { Task } from "@/typescript/interface/task.interface";
import { Status } from "@/typescript/interface/status.interface";
import { User } from "@/typescript/interface/user.interface";
import moment from "moment";

/**
 * Single source of truth for the sortable / groupable task table columns.
 *
 * `key` is what we keep in the URL (`?sort=` / `?group=`) and `apiField` is the
 * actual Mongoose field the backend sorts on (e.g. the Name column maps to
 * `title`). Keeping the URL keyed on column keys means the UI never has to care
 * about backend field names except when building the request string.
 */
export type ColumnKey =
  | "name"
  | "assignedTo"
  | "owner"
  | "dueDate"
  | "category"
  | "priority"
  | "status";

export interface ColumnMeta {
  key: ColumnKey;
  label: string;
  apiField: string;
  sortable: boolean;
  groupable: boolean;
}

export const COLUMN_META: Record<ColumnKey, ColumnMeta> = {
  name: { key: "name", label: "Name", apiField: "title", sortable: true, groupable: false },
  assignedTo: {
    key: "assignedTo",
    label: "Assignee",
    apiField: "assignedTo",
    sortable: true,
    groupable: true
  },
  owner: { key: "owner", label: "Owner", apiField: "user", sortable: true, groupable: true },
  dueDate: {
    key: "dueDate",
    label: "Due Date",
    apiField: "dueDate",
    sortable: true,
    groupable: true
  },
  category: {
    key: "category",
    label: "Category",
    apiField: "category",
    sortable: true,
    groupable: true
  },
  priority: {
    key: "priority",
    label: "Priority",
    apiField: "priority",
    sortable: true,
    groupable: true
  },
  status: { key: "status", label: "Status", apiField: "status", sortable: true, groupable: true }
};

/** Columns offered in the toolbar "Group by" selector, in display order. */
export const GROUPABLE_COLUMNS: ColumnMeta[] = [
  COLUMN_META.status,
  COLUMN_META.assignedTo,
  COLUMN_META.owner,
  COLUMN_META.dueDate,
  COLUMN_META.category,
  COLUMN_META.priority
];

export const PRIORITY_RANK: Record<string, number> = { low: 1, medium: 2, high: 3 };

// ---------------------------------------------------------------------------
// Sort helpers — all pure, operating on the `string[]` URL value where each
// entry is a column key optionally prefixed with "-" for descending.
// ---------------------------------------------------------------------------

export type SortDir = "asc" | "desc";

export interface ColumnSortState {
  active: boolean;
  dir: SortDir | null;
  /** zero-based position within the sort array (sort priority). */
  index: number;
}

const baseKey = (entry: string) => entry.replace(/^-/, "");

export function getColumnSortState(sort: string[], key: string): ColumnSortState {
  const index = sort.findIndex((entry) => baseKey(entry) === key);
  if (index === -1) return { active: false, dir: null, index: -1 };
  return { active: true, dir: sort[index].startsWith("-") ? "desc" : "asc", index };
}

/** off → ascending → descending → off, preserving the column's slot. */
export function toggleColumnSort(prev: string[], key: string): string[] {
  const idx = prev.findIndex((entry) => baseKey(entry) === key);
  if (idx === -1) return [...prev, key];
  if (prev[idx] === key) {
    return [...prev.slice(0, idx), `-${key}`, ...prev.slice(idx + 1)];
  }
  return [...prev.slice(0, idx), ...prev.slice(idx + 1)];
}

export function setColumnSortDir(prev: string[], key: string, dir: SortDir): string[] {
  const entry = dir === "desc" ? `-${key}` : key;
  const idx = prev.findIndex((e) => baseKey(e) === key);
  if (idx === -1) return [...prev, entry];
  return [...prev.slice(0, idx), entry, ...prev.slice(idx + 1)];
}

export function removeColumnSort(prev: string[], key: string): string[] {
  return prev.filter((entry) => baseKey(entry) !== key);
}

export function moveColumnSort(prev: string[], from: number, to: number): string[] {
  if (from === to || from < 0 || to < 0 || from >= prev.length || to >= prev.length) {
    return prev;
  }
  const next = [...prev];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

// Client-side equivalent of the backend's applySemanticSort. Because the task
// list is fetched in full, sorting never needs the network — we re-order the
// already-cached array here so toggling sort/direction/order is instant. The
// comparators mirror the server exactly (priority by severity, ref fields by
// display name, dates by value, missing values last) so the result is identical.
const strSortValue = (s?: string): { v?: number | string; missing?: boolean } =>
  s ? { v: s.toLowerCase() } : { missing: true };

function taskSortValue(key: ColumnKey, t: Task): { v?: number | string; missing?: boolean } {
  switch (key) {
    case "priority": {
      const rank = PRIORITY_RANK[(t.priority || "").toLowerCase()];
      return rank ? { v: rank } : { missing: true };
    }
    case "dueDate": {
      if (!t.dueDate) return { missing: true };
      const ms = new Date(t.dueDate).getTime();
      return Number.isNaN(ms) ? { missing: true } : { v: ms };
    }
    case "category":
      return strSortValue(t.category?.title);
    case "owner":
      return strSortValue(t.user?.fullName);
    case "assignedTo": {
      const list = Array.isArray(t.assignedTo)
        ? t.assignedTo
        : t.assignedTo
          ? [t.assignedTo as unknown as User]
          : [];
      return strSortValue(list[0]?.fullName);
    }
    case "status":
      return strSortValue(t.status?.title);
    case "name":
      return strSortValue(t.title);
    default:
      return { missing: true };
  }
}

export function sortTasks(tasks: Task[], sort: string[]): Task[] {
  if (!sort.length) return tasks;
  const keys = sort.map((entry) => ({
    key: baseKey(entry) as ColumnKey,
    dir: entry.startsWith("-") ? -1 : 1
  }));

  // Copy first — never mutate the array held in the React Query cache.
  return [...tasks].sort((a, b) => {
    for (const { key, dir } of keys) {
      const va = taskSortValue(key, a);
      const vb = taskSortValue(key, b);
      if (va.missing && vb.missing) continue;
      if (va.missing) return 1; // missing always sinks, regardless of direction
      if (vb.missing) return -1;
      const cmp =
        typeof va.v === "number" && typeof vb.v === "number"
          ? va.v - vb.v
          : String(va.v).localeCompare(String(vb.v));
      if (cmp !== 0) return cmp * dir;
    }
    // Stable tie-break: newest first (matches the default list ordering).
    return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
  });
}

/** Build the `?sort=` query string the backend expects (mapping key → apiField). */
export function apiSortString(sort: string[]): string {
  return sort
    .map((entry) => {
      const desc = entry.startsWith("-");
      const key = baseKey(entry) as ColumnKey;
      const field = COLUMN_META[key]?.apiField ?? baseKey(entry);
      return desc ? `-${field}` : field;
    })
    .join(",");
}

// ---------------------------------------------------------------------------
// Grouping — purely client-side bucketing of the (already sorted) task list.
// ---------------------------------------------------------------------------

export interface TaskGroup {
  key: string;
  label: string;
  /** present for coloured pills (status / category). */
  bg?: string;
  text?: string;
  /** only set for status groups — drives the per-group "Add Task" button. */
  statusId?: string;
  tasks: Task[];
}

const NO_VALUE = "__none__";

const firstAssignee = (task: Task): User | undefined => {
  const list = Array.isArray(task.assignedTo)
    ? task.assignedTo
    : task.assignedTo
      ? [task.assignedTo as unknown as User]
      : [];
  return list[0];
};

interface Bucket {
  key: string;
  label: string;
  bg?: string;
  text?: string;
  /** lower sorts first; used for predefined orders (priority, due date). */
  rank?: number;
}

function bucketFor(task: Task, groupKey: ColumnKey): Bucket {
  switch (groupKey) {
    case "priority": {
      const p = task.priority?.toLowerCase?.() ?? "";
      if (!p) return { key: NO_VALUE, label: "No Priority", rank: 99 };
      return { key: p, label: p.charAt(0).toUpperCase() + p.slice(1), rank: PRIORITY_RANK[p] ?? 50 };
    }
    case "category": {
      const c = task.category;
      if (!c) return { key: NO_VALUE, label: "No Category" };
      return { key: c._id, label: c.title, bg: c.color?.bg, text: c.color?.text };
    }
    case "owner": {
      const u = task.user;
      if (!u) return { key: NO_VALUE, label: "No Owner" };
      return { key: u._id, label: u.fullName || "Unknown" };
    }
    case "assignedTo": {
      const u = firstAssignee(task);
      if (!u) return { key: NO_VALUE, label: "Unassigned" };
      return { key: u._id, label: u.fullName || "Unknown" };
    }
    case "dueDate":
      return dueDateBucket(task.dueDate);
    default:
      return { key: NO_VALUE, label: "—" };
  }
}

function dueDateBucket(dueDate?: string): Bucket {
  if (!dueDate) return { key: "no-date", label: "No Due Date", rank: 5 };
  const d = moment(dueDate);
  const today = moment().startOf("day");
  if (d.isBefore(today, "day")) return { key: "overdue", label: "Overdue", rank: 0 };
  if (d.isSame(today, "day")) return { key: "today", label: "Today", rank: 1 };
  if (d.isSame(today.clone().add(1, "day"), "day"))
    return { key: "tomorrow", label: "Tomorrow", rank: 2 };
  if (d.isSame(today, "week")) return { key: "this-week", label: "This Week", rank: 3 };
  return { key: "later", label: "Later", rank: 4 };
}

/**
 * Bucket tasks into collapsible groups. `status` (the default) keeps the
 * existing behaviour of showing every status column — even empty ones — ordered
 * by `status.priority`; every other field derives its buckets from the tasks
 * present. `groupDir` controls the order of the groups themselves.
 */
export function getGroups(
  tasks: Task[],
  groupKey: ColumnKey,
  groupDir: string,
  statuses: Status[]
): TaskGroup[] {
  const dir = groupDir === "desc" ? -1 : 1;

  if (groupKey === "status") {
    const columnIds = new Set(statuses.map((s) => s?._id));
    return [...statuses]
      .sort((a, b) => ((a?.priority || 0) - (b?.priority || 0)) * dir)
      .map((s) => ({
        key: s?._id,
        label: s?.title,
        bg: s?.color?.bg,
        text: s?.color?.text,
        statusId: s?._id,
        tasks: tasks.filter(
          (task) =>
            task.status._id === s?._id ||
            (!columnIds.has(task.status._id) && task.status.title === s?.title)
        )
      }));
  }

  const buckets = new Map<string, TaskGroup & { rank?: number }>();
  const order: string[] = [];
  for (const task of tasks) {
    const b = bucketFor(task, groupKey);
    let group = buckets.get(b.key);
    if (!group) {
      group = { key: b.key, label: b.label, bg: b.bg, text: b.text, rank: b.rank, tasks: [] };
      buckets.set(b.key, group);
      order.push(b.key);
    }
    group.tasks.push(task);
  }

  const groups = order.map((k) => buckets.get(k)!);
  const hasRanks = groups.some((g) => g.rank !== undefined);
  groups.sort((a, b) => {
    // The "no value" bucket always sinks to the bottom regardless of direction.
    if (a.key === NO_VALUE) return 1;
    if (b.key === NO_VALUE) return -1;
    if (hasRanks) return ((a.rank ?? 0) - (b.rank ?? 0)) * dir;
    return a.label.localeCompare(b.label) * dir;
  });
  // `rank` is internal-only ordering metadata; harmless extra field on the
  // returned TaskGroup objects.
  return groups;
}
