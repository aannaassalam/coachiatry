"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import React, { useCallback, useRef, useState } from "react";
import { useTableLayout } from "./TableLayoutContext";
import { COLUMN_META, ColumnKey, columnWidthVar } from "./tableColumns";

/** Arrow-key step, in px. */
const KEY_STEP = 16;

/**
 * Drag handle straddling a header cell's right edge.
 *
 * Discoverability: a faint 1px divider is always drawn at every resizable column
 * boundary (the conventional "these edges are draggable" cue), it darkens when
 * the header row is hovered, and it grows into a full-height indigo bar with a
 * tooltip once the pointer is actually over the handle.
 *
 * While dragging, the new width is written straight to the CSS variable that
 * drives the column's <col>, so a drag never re-renders the (potentially very
 * long) row list — React state is updated once, on release. Double-click or
 * Backspace restores the column's default width; arrow keys nudge it.
 */
export default function ColumnResizer({ columnKey }: { columnKey: ColumnKey }) {
  const {
    width,
    previewWidth,
    commitWidth,
    commitWidths,
    freezeVars,
    hasCustomWidths,
    resetWidth
  } = useTableLayout();
  const [dragging, setDragging] = useState(false);
  const handleRef = useRef<HTMLSpanElement>(null);
  const drag = useRef({ startX: 0, startWidth: 0, latest: 0 });
  const meta = COLUMN_META[columnKey];

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLSpanElement>) => {
      if (event.button !== 0) return;
      // The handle sits inside a header button row — don't let the press
      // through to the column menu or the sort toggle.
      event.preventDefault();
      event.stopPropagation();

      const cell = handleRef.current?.closest("th");
      const table = handleRef.current?.closest("table");

      // Measure each column's PITCH — where the next column starts — rather than
      // the header cell's own border-box width. Under border-collapse those differ
      // by several px, and it's the pitch that a <col> width corresponds to, so
      // this is the space the drag has to work in. Getting it wrong made the press
      // visibly jump.
      const cells = Array.from(
        table?.querySelectorAll<HTMLTableCellElement>("th[data-column-key]") ??
          []
      );
      const rects = cells.map((th) => th.getBoundingClientRect());
      const pitches = cells.map(
        (_, index) =>
          (index < rects.length - 1
            ? rects[index + 1].left
            : rects[index].right) - rects[index].left
      );

      // First resize on a default layout: the table is still filling its
      // container, so every column renders wider than its stored width. Adopt
      // what's on screen as the stored widths before moving anything — the table
      // switches to honouring widths exactly with nothing shifting, and from here
      // a 1px pointer move is a 1px edge move.
      if (!hasCustomWidths && cells.length) {
        const adopted: Partial<Record<ColumnKey, number>> = {};
        const vars: [string, number][] = [];
        cells.forEach((th, index) => {
          const key = th.dataset.columnKey as ColumnKey | undefined;
          if (!key) return;
          adopted[key] = pitches[index];
          vars.push([columnWidthVar(key), pitches[index]]);
        });
        // Write the variables now as well as into state: the state sync runs in
        // an effect, i.e. potentially after a paint, which would flash.
        freezeVars(vars);
        commitWidths(adopted);
      }

      const dragged = cell ? cells.indexOf(cell) : -1;
      const startWidth = dragged >= 0 ? pitches[dragged] : width(columnKey);
      drag.current = { startX: event.clientX, startWidth, latest: startWidth };
      setDragging(true);

      const previousCursor = document.body.style.cursor;
      const previousSelect = document.body.style.userSelect;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      const onMove = (moveEvent: PointerEvent) => {
        const { startX, startWidth: from } = drag.current;
        const next = Math.max(
          meta.minWidth,
          from + (moveEvent.clientX - startX)
        );
        drag.current.latest = next;
        previewWidth(columnKey, next);
      };

      const onEnd = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onEnd);
        window.removeEventListener("pointercancel", onEnd);
        document.body.style.cursor = previousCursor;
        document.body.style.userSelect = previousSelect;
        setDragging(false);
        commitWidth(columnKey, drag.current.latest);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onEnd);
      window.addEventListener("pointercancel", onEnd);
    },
    [
      columnKey,
      meta.minWidth,
      width,
      previewWidth,
      commitWidth,
      commitWidths,
      freezeVars,
      hasCustomWidths
    ]
  );

  const onKeyDown = (event: React.KeyboardEvent<HTMLSpanElement>) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const delta = event.key === "ArrowLeft" ? -KEY_STEP : KEY_STEP;
      commitWidth(columnKey, width(columnKey) + delta);
    } else if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault();
      resetWidth(columnKey);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          ref={handleRef}
          role="separator"
          aria-orientation="vertical"
          aria-label={`Resize ${meta.label} column`}
          aria-valuenow={width(columnKey)}
          aria-valuemin={meta.minWidth}
          tabIndex={0}
          onPointerDown={onPointerDown}
          onDoubleClick={() => resetWidth(columnKey)}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={onKeyDown}
          className={cn(
            "group/resize absolute inset-y-0 right-0 z-10 flex w-3 translate-x-1/2 items-center justify-center",
            "cursor-col-resize touch-none select-none focus:outline-none"
          )}
        >
          <span
            className={cn(
              "pointer-events-none rounded-full transition-all duration-150",
              dragging
                ? "h-full w-[2px] bg-indigo-500"
                : [
                    // Resting: a faint column divider — always visible, so the
                    // boundary reads as something you can grab.
                    "h-3.5 w-px bg-gray-200",
                    "group-hover/head:bg-gray-300",
                    // Pointer on the handle: unmistakable.
                    "group-hover/resize:h-full group-hover/resize:w-[2px] group-hover/resize:bg-indigo-400",
                    "group-focus-visible/resize:h-full group-focus-visible/resize:w-[2px] group-focus-visible/resize:bg-indigo-400"
                  ]
            )}
          />
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={6} className="text-[11px]">
        Drag to resize · double-click to reset
      </TooltipContent>
    </Tooltip>
  );
}
