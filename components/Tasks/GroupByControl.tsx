import { PopoverClose } from "@radix-ui/react-popover";
import {
  Calendar,
  Check,
  ChevronsUpDown,
  CircleDashed,
  Crown,
  Flag,
  List,
  LucideIcon,
  Tag,
  Trash2,
  User
} from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { COLUMN_META, ColumnKey, GROUPABLE_COLUMNS } from "./tableColumns";

/** Sentinel `group` value meaning "don't group — show a single flat list". */
export const NO_GROUP = "none";

/** A representative icon per groupable column, shown in the pill + selector. */
const GROUP_ICONS: Partial<Record<ColumnKey, LucideIcon>> = {
  status: CircleDashed,
  assignedTo: User,
  owner: Crown,
  dueDate: Calendar,
  category: Tag,
  priority: Flag
};

const DIRECTIONS: { value: string; label: string }[] = [
  { value: "asc", label: "Ascending" },
  { value: "desc", label: "Descending" }
];

/**
 * Toolbar "Group by" pill. Tasks group by Status by default; choosing a field
 * re-buckets the list and the direction orders the groups themselves. Grouping
 * can also be removed ("No grouping") — the list then renders as a single flat,
 * createdAt-sorted table.
 */
function GroupByControl() {
  const [group, setGroup] = useQueryState(
    "group",
    parseAsString.withDefault("status")
  );
  const [groupDir, setGroupDir] = useQueryState(
    "groupDir",
    parseAsString.withDefault("asc")
  );

  const isGrouped = group !== NO_GROUP;
  const current = isGrouped
    ? (COLUMN_META[group as ColumnKey] ?? COLUMN_META.status)
    : null;
  const currentDir =
    DIRECTIONS.find((d) => d.value === groupDir) ?? DIRECTIONS[0];
  const CurrentIcon = current
    ? (GROUP_ICONS[current.key] ?? CircleDashed)
    : List;
  const currentLabel = current ? current.label : "No grouping";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="group h-9 gap-2 rounded-full border border-indigo-100 bg-indigo-50/60 px-3.5 font-medium text-indigo-600 transition-colors hover:border-indigo-200 hover:bg-indigo-100/70 hover:text-indigo-700"
        >
          <CurrentIcon size={15} className="text-indigo-500" />
          {/* <span className="text-[11px] font-normal text-indigo-400">Group:</span> */}
          {currentLabel}
          <ChevronsUpDown
            size={13}
            className="text-indigo-300 transition-colors group-hover:text-indigo-400"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[360px] p-4"
        collisionPadding={20}
      >
        <p className="text-xs font-medium text-gray-400 mb-2">Group by</p>
        <div className="flex items-center gap-2">
          {/* Field selector */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex-1 flex items-center justify-between gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm font-lato text-gray-700 hover:border-gray-300 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <CurrentIcon size={15} className="text-gray-500" />
                  {currentLabel}
                </span>
                <ChevronsUpDown size={13} className="text-gray-400" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="w-[220px] p-1"
              collisionPadding={20}
            >
              <PopoverClose asChild>
                <button
                  type="button"
                  onClick={() => setGroup(NO_GROUP, { shallow: true })}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-lato text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  <List size={15} className="text-gray-500" />
                  <span className="flex-1 text-left">No grouping</span>
                  {!isGrouped && (
                    <Check size={14} className="text-indigo-500" />
                  )}
                </button>
              </PopoverClose>
              <div className="my-1 h-px bg-gray-100" />
              {GROUPABLE_COLUMNS.map((col) => {
                const Icon = GROUP_ICONS[col.key] ?? CircleDashed;
                return (
                  <PopoverClose asChild key={col.key}>
                    <button
                      type="button"
                      onClick={() => setGroup(col.key, { shallow: true })}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-lato text-gray-700 hover:bg-gray-50 cursor-pointer"
                    >
                      <Icon size={15} className="text-gray-500" />
                      <span className="flex-1 text-left">{col.label}</span>
                      {group === col.key && (
                        <Check size={14} className="text-indigo-500" />
                      )}
                    </button>
                  </PopoverClose>
                );
              })}
            </PopoverContent>
          </Popover>

          {/* Direction selector — only relevant when actually grouping. */}
          {isGrouped && (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex items-center justify-between gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm font-lato text-gray-700 hover:border-gray-300 cursor-pointer"
                >
                  {currentDir.label}
                  <ChevronsUpDown size={13} className="text-gray-400" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-[180px] p-1"
                collisionPadding={20}
              >
                {DIRECTIONS.map((d) => (
                  <PopoverClose asChild key={d.value}>
                    <button
                      type="button"
                      onClick={() => setGroupDir(d.value, { shallow: true })}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-lato text-gray-700 hover:bg-gray-50 cursor-pointer"
                    >
                      <span className="flex-1 text-left">{d.label}</span>
                      {groupDir === d.value && (
                        <Check size={14} className="text-indigo-500" />
                      )}
                    </button>
                  </PopoverClose>
                ))}
              </PopoverContent>
            </Popover>
          )}

          {/* Remove grouping — collapses everything into a single flat list. */}
          {isGrouped && (
            <PopoverClose asChild>
              <button
                type="button"
                onClick={() => setGroup(NO_GROUP, { shallow: true })}
                title="Remove grouping"
                className="flex items-center justify-center rounded-md border border-gray-200 p-2 text-gray-400 hover:border-gray-300 hover:text-red-600 cursor-pointer"
              >
                <Trash2 size={15} />
              </button>
            </PopoverClose>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default GroupByControl;
