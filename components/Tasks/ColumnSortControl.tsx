import assets from "@/json/assets";
import { cn } from "@/lib/utils";
import { PopoverClose } from "@radix-ui/react-popover";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ChevronsUpDown,
  EyeOff,
  Layers,
  MoveHorizontal,
  X
} from "lucide-react";
import Image from "next/image";
import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import ColumnResizer from "./ColumnResizer";
import SortOrderPanel from "./SortOrderPanel";
import { useTableLayout } from "./TableLayoutContext";
import {
  COLUMN_META,
  ColumnKey,
  getColumnSortState,
  toggleColumnSort
} from "./tableColumns";

/**
 * Renders a sortable column header: the title text (click → column menu) plus a
 * sort affordance (click → toggle asc/desc/off). With a single active sort the
 * affordance is a coloured up/down arrow; with two or more it becomes an
 * "↑/↓ <priority>" badge and the menu turns into the reorderable sort panel.
 *
 * Also owns the column's resize handle, so the header cell it lives in must be
 * positioned (`relative`).
 */
function ColumnSortControl({ columnKey }: { columnKey: ColumnKey }) {
  const meta = COLUMN_META[columnKey];
  const { order, toggleColumn, resetWidth, moveColumn } = useTableLayout();

  // Slot 0 holds the pinned primary column, so the first movable column is 1.
  const position = order.indexOf(columnKey);
  const canMoveLeft = position > 1;
  const canMoveRight = position >= 1 && position < order.length - 1;

  const [sort, setSort] = useQueryState(
    "sort",
    parseAsArrayOf(parseAsString.withDefault("")).withDefault([])
  );
  const [group, setGroup] = useQueryState(
    "group",
    parseAsString.withDefault("status")
  );

  const { active, dir, index } = getColumnSortState(sort, columnKey);
  const multi = sort.length >= 2;

  const toggle = () =>
    setSort((prev) => toggleColumnSort(prev, columnKey), { shallow: true });

  return (
    <div className="flex items-center group">
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="cursor-pointer hover:text-gray-700 transition-colors"
          >
            {meta.label}
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="p-0 w-auto"
          collisionPadding={20}
        >
          {multi ? (
            <SortOrderPanel />
          ) : (
            <div className="w-[180px] p-1.5">
              <PopoverClose asChild>
                <button
                  type="button"
                  onClick={toggle}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-lato text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  <ChevronsUpDown size={15} className="text-gray-500" />
                  Sort
                </button>
              </PopoverClose>
              <PopoverClose asChild>
                <button
                  type="button"
                  onClick={() => setSort([], { shallow: true })}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-lato text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  <X size={15} className="text-gray-500" />
                  Clear sort
                </button>
              </PopoverClose>
              {meta.groupable && (
                <PopoverClose asChild>
                  <button
                    type="button"
                    disabled={group === columnKey}
                    onClick={() => setGroup(columnKey, { shallow: true })}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-lato text-gray-700 hover:bg-gray-50 cursor-pointer disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
                  >
                    <Layers
                      size={15}
                      className={cn(
                        group === columnKey ? "text-gray-300" : "text-gray-500"
                      )}
                    />
                    Group
                  </button>
                </PopoverClose>
              )}
              {(canMoveLeft || canMoveRight) && (
                <div className="my-1 border-t border-gray-100" />
              )}
              {canMoveLeft && (
                <PopoverClose asChild>
                  <button
                    type="button"
                    onClick={() => moveColumn(position, position - 1)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-lato text-gray-700 hover:bg-gray-50 cursor-pointer"
                  >
                    <ArrowLeft size={15} className="text-gray-500" />
                    Move left
                  </button>
                </PopoverClose>
              )}
              {canMoveRight && (
                <PopoverClose asChild>
                  <button
                    type="button"
                    onClick={() => moveColumn(position, position + 1)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-lato text-gray-700 hover:bg-gray-50 cursor-pointer"
                  >
                    <ArrowRight size={15} className="text-gray-500" />
                    Move right
                  </button>
                </PopoverClose>
              )}
              <PopoverClose asChild>
                <button
                  type="button"
                  onClick={() => resetWidth(columnKey)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-lato text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  <MoveHorizontal size={15} className="text-gray-500" />
                  Reset width
                </button>
              </PopoverClose>
              {meta.hideable && (
                <PopoverClose asChild>
                  <button
                    type="button"
                    onClick={() => toggleColumn(columnKey)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-lato text-gray-700 hover:bg-gray-50 cursor-pointer"
                  >
                    <EyeOff size={15} className="text-gray-500" />
                    Hide column
                  </button>
                </PopoverClose>
              )}
            </div>
          )}
        </PopoverContent>
      </Popover>

      <button
        type="button"
        onClick={toggle}
        aria-label="Sort column"
        className={cn(
          "flex items-center justify-center rounded-sm ml-2 transition-all duration-200 cursor-pointer",
          active
            ? "opacity-100 bg-indigo-50 text-indigo-500 px-1.5 py-1 gap-0.5"
            : "opacity-0 group-hover:opacity-100 p-[6px] hover:bg-gray-100"
        )}
      >
        {active ? (
          <>
            {dir === "desc" ? <ArrowDown size={12} /> : <ArrowUp size={12} />}
            {multi && (
              <span className="text-[11px] font-medium leading-none">
                {index + 1}
              </span>
            )}
          </>
        ) : (
          <span className="relative block w-[12px] h-[12px]">
            <Image src={assets.icons.tableSort} alt="sort" fill />
          </span>
        )}
      </button>

      <ColumnResizer columnKey={columnKey} />
    </div>
  );
}

export default ColumnSortControl;
