import { PopoverClose } from "@radix-ui/react-popover";
import {
  Calendar,
  Check,
  ChevronsUpDown,
  CircleDashed,
  Crown,
  Flag,
  LucideIcon,
  Tag,
  User
} from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { COLUMN_META, ColumnKey, GROUPABLE_COLUMNS } from "./tableColumns";

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
 * Toolbar "Group by" pill. Tasks are always grouped (Status by default) — there
 * is no "ungroup", so no delete affordance is offered. Choosing a field
 * re-buckets the list; the direction orders the groups themselves.
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

  const current = COLUMN_META[group as ColumnKey] ?? COLUMN_META.status;
  const currentDir =
    DIRECTIONS.find((d) => d.value === groupDir) ?? DIRECTIONS[0];
  const CurrentIcon = GROUP_ICONS[current.key] ?? CircleDashed;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="group h-9 gap-2 rounded-full border border-indigo-100 bg-indigo-50/60 px-3.5 font-medium text-indigo-600 transition-colors hover:border-indigo-200 hover:bg-indigo-100/70 hover:text-indigo-700"
        >
          <CurrentIcon size={15} className="text-indigo-500" />
          {/* <span className="text-[11px] font-normal text-indigo-400">Group:</span> */}
          {current.label}
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
                  {current.label}
                </span>
                <ChevronsUpDown size={13} className="text-gray-400" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="w-[220px] p-1"
              collisionPadding={20}
            >
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

          {/* Direction selector */}
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
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default GroupByControl;
