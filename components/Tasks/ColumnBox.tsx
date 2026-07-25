"use client";
import assets from "@/json/assets";

import { cn } from "@/lib/utils";
import { GripVertical, Lock, MoveHorizontal } from "lucide-react";
import Image from "next/image";
import { DragEvent, useMemo, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";
import { useTableLayout } from "./TableLayoutContext";
import { COLUMN_META } from "./tableColumns";

/**
 * Column panel for the task table: reorder by dragging (native HTML5 drag, the
 * same interaction as SortOrderPanel), show/hide with the switches, and reset
 * order + widths together. Everything reads and writes the shared
 * TableLayoutProvider, so changes apply to every group's table at once and are
 * remembered across sessions.
 *
 * The primary column (Name) is pinned first and always visible — it carries the
 * expand triangle and the status dot, and it's the column that flexes to fill
 * leftover width.
 */
function ColumnBox() {
  const {
    order,
    isVisible,
    moveColumn,
    toggleColumn,
    setHiddenColumns,
    reset,
    isDefaultLayout
  } = useTableLayout();
  const [searchTerm, setSearchTerm] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const columns = useMemo(
    () => order.map((key, index) => ({ ...COLUMN_META[key], index })),
    [order]
  );

  const term = searchTerm.trim().toLowerCase();
  const filteredColumns = term
    ? columns.filter((column) => column.label.toLowerCase().includes(term))
    : columns;

  const hideable = useMemo(
    () => columns.filter((column) => column.hideable),
    [columns]
  );
  const allShown = hideable.every((column) => isVisible(column.key));

  // Dragging only makes sense against the full, unfiltered list.
  const reorderable = !term;

  /**
   * Reorder as the pointer crosses each row rather than waiting for the drop, so
   * the list — and the table behind the popover — reflow live. The dragged row
   * ends up under the cursor after every hop, so there's nothing to oscillate
   * against.
   */
  const handleDragOver = (event: DragEvent, to: number) => {
    event.preventDefault();
    if (dragIndex === null || dragIndex === to) return;
    moveColumn(dragIndex, to);
    setDragIndex(to);
  };

  return (
    <div>
      {/* Search box */}
      <div className="p-2 border-b border-gray-200">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search columns"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-md border border-gray-300 pl-8 pr-3 py-1.5 text-sm focus:outline-none"
          />
          <Image
            src={assets.icons.searchIcon}
            width={20}
            height={20}
            alt=""
            className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
          />
        </div>
      </div>

      <div className="p-1.5">
        <div className="w-full flex justify-between items-center">
          <p className="px-2 text-xs font-medium text-gray-400">
            {reorderable ? "Drag to reorder" : "Columns"}
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="px-2 text-xs font-medium text-gray-700"
            onClick={() =>
              setHiddenColumns(
                allShown ? hideable.map((column) => column.key) : []
              )
            }
          >
            {allShown ? "Hide all" : "Show all"}
          </Button>
        </div>
        <ul className="mt-1">
          {filteredColumns.length > 0 ? (
            filteredColumns.map((column) => {
              const draggable = reorderable && column.hideable;
              return (
                <li
                  key={column.key}
                  draggable={draggable}
                  onDragStart={
                    draggable
                      ? (event) => {
                          // Firefox won't start a drag without payload data.
                          event.dataTransfer.setData("text/plain", column.key);
                          event.dataTransfer.effectAllowed = "move";
                          setDragIndex(column.index);
                        }
                      : undefined
                  }
                  onDragOver={
                    draggable
                      ? (event) => handleDragOver(event, column.index)
                      : undefined
                  }
                  onDrop={
                    draggable
                      ? (event) => {
                          // The move already happened on dragOver.
                          event.preventDefault();
                          setDragIndex(null);
                        }
                      : undefined
                  }
                  onDragEnd={draggable ? () => setDragIndex(null) : undefined}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md pr-2 py-0.5 transition-colors",
                    draggable && "cursor-grab active:cursor-grabbing",
                    dragIndex === column.index
                      ? "bg-indigo-50 ring-1 ring-indigo-200"
                      : "hover:bg-gray-50"
                  )}
                >
                  {draggable ? (
                    <GripVertical
                      size={14}
                      className={cn(
                        "shrink-0",
                        dragIndex === column.index
                          ? "text-indigo-400"
                          : "text-gray-300"
                      )}
                    />
                  ) : (
                    <Lock size={12} className="mx-px shrink-0 text-gray-300" />
                  )}
                  <label
                    className={cn(
                      "flex flex-1 items-center justify-between gap-3 py-1.5 text-sm font-lato text-gray-900",
                      column.hideable ? "cursor-pointer" : "cursor-default"
                    )}
                  >
                    <span className="truncate">{column.label}</span>
                    <Switch
                      checked={isVisible(column.key)}
                      disabled={!column.hideable}
                      onCheckedChange={() => toggleColumn(column.key)}
                      aria-label={`Show ${column.label} column`}
                    />
                  </label>
                </li>
              );
            })
          ) : (
            <p className="px-2 py-2 text-sm text-gray-500">No results found</p>
          )}
        </ul>
      </div>

      <div className="border-t border-gray-200 p-1.5">
        <p className="flex items-start gap-1.5 px-2 pt-1 pb-2 text-[11px] leading-4 text-gray-400">
          <MoveHorizontal size={13} className="mt-px shrink-0" />
          Drag the divider between two column headers to resize them.
        </p>
        <Button
          variant="ghost"
          size="sm"
          disabled={isDefaultLayout}
          onClick={reset}
          className="w-full px-2 text-xs font-medium text-gray-700 [&>span]:justify-start"
        >
          Reset order &amp; widths
        </Button>
      </div>
    </div>
  );
}

export default ColumnBox;
