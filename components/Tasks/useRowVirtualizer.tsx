import { Task } from "@/typescript/interface/task.interface";
import { useEffect, useRef, useState } from "react";

// Render this many rows up front per group, and grow by this much each time the
// bottom sentinel scrolls into view.
const INITIAL_ROWS = 50;
const CHUNK = 50;

/**
 * Progressive (incremental) row rendering for a group's task table. Keeps the
 * initial DOM small for huge lists (10k tasks → ~50 rows mounted) without ever
 * touching the scroll container — a bottom sentinel observed via
 * IntersectionObserver simply reveals the next chunk as the user scrolls down.
 *
 * Deliberately NOT windowed/virtualized: windowing has to read and reposition
 * relative to the scroll element, which (with the app's nested scroll container
 * and stacked collapsible groups) bounced the page to the top whenever a group
 * opened. This approach only ever appends rows, so the scroll position is never
 * disturbed.
 */
export function useRowVirtualizer(tasks: Task[]) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_ROWS);
  const sentinelRef = useRef<HTMLTableRowElement>(null);

  // New dataset (filter/group switch) → start from the top again.
  useEffect(() => {
    setVisibleCount(INITIAL_ROWS);
  }, [tasks.length]);

  const hasMore = visibleCount < tasks.length;

  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisibleCount((c) => Math.min(c + CHUNK, tasks.length));
        }
      },
      // Prefetch a little before the user actually reaches the bottom.
      { rootMargin: "600px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, tasks.length]);

  const renderedTasks = hasMore ? tasks.slice(0, visibleCount) : tasks;

  return { renderedTasks, hasMore, sentinelRef };
}
