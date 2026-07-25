"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import {
  COLUMN_META,
  ColumnKey,
  columnWidthVar as cssVar
} from "./tableColumns";

const STORAGE_PREFIX = "taskTable:layout:";

interface StoredLayout {
  widths?: Partial<Record<ColumnKey, number>>;
  hidden?: ColumnKey[];
  order?: ColumnKey[];
}

export interface TableLayoutValue {
  /** Every column the table can show, in the user's chosen render order. */
  order: ColumnKey[];
  /** `order` minus the columns the user has hidden. */
  visibleColumns: ColumnKey[];
  isVisible: (key: ColumnKey) => boolean;
  /**
   * Move the column at `from` to `to` within `order`. The primary column
   * (`hideable: false`) is pinned to slot 0 and both indices are clamped to
   * exclude it.
   */
  moveColumn: (from: number, to: number) => void;
  width: (key: ColumnKey) => number;
  /** `width(key)` as a `var(--…)` reference for a <col>'s style. */
  widthStyle: (key: ColumnKey) => string;
  /**
   * Write a width straight to the DOM without a React render — used while a
   * resize handle is being dragged.
   */
  previewWidth: (key: ColumnKey, px: number) => void;
  /** Store the dragged width (and persist it). */
  commitWidth: (key: ColumnKey, px: number) => void;
  /** Store several widths in one update — used to land a resize (see below). */
  commitWidths: (widths: Partial<Record<ColumnKey, number>>) => void;
  /**
   * Write width variables verbatim, no clamping and no React state. Used to pin
   * a table's *rendered* widths in place at the start of a resize, including the
   * actions column, so suspending proportional fill moves nothing.
   */
  freezeVars: (entries: [string, number][]) => void;
  /**
   * False until the user sets a width. Tables fill their container while it's
   * false and honour the stored widths exactly once it's true.
   */
  hasCustomWidths: boolean;
  resetWidth: (key: ColumnKey) => void;
  toggleColumn: (key: ColumnKey) => void;
  setHiddenColumns: (keys: ColumnKey[]) => void;
  /** Back to the default order and widths with every column shown. */
  reset: () => void;
  isDefaultLayout: boolean;
}

const TableLayoutContext = createContext<TableLayoutValue | null>(null);

const clampWidth = (key: ColumnKey, px: number) =>
  Math.max(COLUMN_META[key].minWidth, Math.round(px));

/**
 * Reconciles a stored order against the table's current column set: unknown or
 * duplicated keys are dropped, columns added since the order was saved are
 * appended, and the primary column is forced back to slot 0.
 */
function mergeOrder(
  stored: ColumnKey[] | undefined,
  fallback: ColumnKey[]
): ColumnKey[] {
  const primary = fallback.find((key) => !COLUMN_META[key].hideable);
  if (!stored?.length) return fallback;

  const seen = new Set<ColumnKey>();
  const kept = stored.filter((key) => {
    if (!fallback.includes(key) || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const merged = [...kept, ...fallback.filter((key) => !seen.has(key))];

  return primary
    ? [primary, ...merged.filter((key) => key !== primary)]
    : merged;
}

function moveWithinOrder(
  order: ColumnKey[],
  from: number,
  to: number,
  /** Number of leading slots that are pinned and can't take part. */
  pinned: number
): ColumnKey[] {
  if (from === to) return order;
  if (from < pinned || to < pinned) return order;
  if (from >= order.length || to >= order.length) return order;
  const next = [...order];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export function useTableLayout(): TableLayoutValue {
  const ctx = useContext(TableLayoutContext);
  if (!ctx) {
    throw new Error("useTableLayout must be used inside <TableLayoutProvider>");
  }
  return ctx;
}

/**
 * Holds column widths + visibility for every task table rendered beneath it, so
 * the one-table-per-group list stays in lockstep, and persists the result to
 * localStorage under `scope`.
 *
 * Widths reach the tables as CSS custom properties set on this provider's own
 * element. That indirection is what lets a resize drag update the DOM directly
 * (see ColumnResizer) instead of re-rendering every task row on every
 * pointermove.
 */
export function TableLayoutProvider({
  scope,
  defaultOrder,
  className,
  children
}: {
  /** localStorage namespace — distinct per table so layouts don't collide. */
  scope: string;
  /** Every column the table can show, in its out-of-the-box order. */
  defaultOrder: ColumnKey[];
  className?: string;
  children: React.ReactNode;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [widths, setWidths] = useState<Partial<Record<ColumnKey, number>>>({});
  const [hidden, setHidden] = useState<ColumnKey[]>([]);
  const [order, setOrder] = useState<ColumnKey[]>(defaultOrder);

  const storageKey = STORAGE_PREFIX + scope;

  // Read after mount: localStorage doesn't exist during SSR, and seeding it
  // into the initial state would desync hydration.
  useEffect(() => {
    let stored: StoredLayout | null = null;
    try {
      const raw = window.localStorage.getItem(storageKey);
      stored = raw ? (JSON.parse(raw) as StoredLayout) : null;
    } catch {
      // Unreadable or corrupt storage just means "use the defaults".
    }
    setWidths(
      Object.fromEntries(
        Object.entries(stored?.widths ?? {})
          .filter(([key, px]) => key in COLUMN_META && typeof px === "number")
          .map(([key, px]) => [key, clampWidth(key as ColumnKey, px as number)])
      )
    );
    setHidden(
      (stored?.hidden ?? []).filter(
        (key) => key in COLUMN_META && COLUMN_META[key].hideable
      )
    );
    setOrder(mergeOrder(stored?.order, defaultOrder));
    // defaultOrder is a module-level constant at every call site.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Mirrors the committed layout so persist() can write a complete record from
  // any single setter without every setter having to depend on all three slices.
  const layoutRef = useRef<StoredLayout>({});
  useEffect(() => {
    layoutRef.current = { widths, hidden, order };
  }, [widths, hidden, order]);

  const persist = useCallback(
    (patch: StoredLayout) => {
      const next = { ...layoutRef.current, ...patch };
      layoutRef.current = next;
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // Private mode / quota — the layout still applies for this session.
      }
    },
    [storageKey]
  );

  const width = useCallback(
    (key: ColumnKey) => widths[key] ?? COLUMN_META[key].defaultWidth,
    [widths]
  );

  const widthStyle = useCallback(
    (key: ColumnKey) =>
      `var(${cssVar(key)}, ${COLUMN_META[key].defaultWidth}px)`,
    []
  );

  // Single writer for the width variables. Doing this in an effect rather than
  // via a React `style` prop matters: a drag writes the variables straight to
  // the DOM (previewWidth), which React's style diffing knows nothing about, so
  // letting React own the attribute meant it could skip re-writing a value it
  // believed unchanged — and a reset would then leave the dragged width in
  // place. This effect always writes the truth from state.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    for (const key of defaultOrder) {
      host.style.setProperty(
        cssVar(key),
        `${widths[key] ?? COLUMN_META[key].defaultWidth}px`
      );
    }
  }, [defaultOrder, widths]);

  const previewWidth = useCallback((key: ColumnKey, px: number) => {
    hostRef.current?.style.setProperty(cssVar(key), `${clampWidth(key, px)}px`);
  }, []);

  const commitWidth = useCallback(
    (key: ColumnKey, px: number) => {
      setWidths((prev) => {
        const next = { ...prev, [key]: clampWidth(key, px) };
        persist({ widths: next });
        return next;
      });
    },
    [persist]
  );

  const commitWidths = useCallback(
    (incoming: Partial<Record<ColumnKey, number>>) => {
      setWidths((prev) => {
        const next = { ...prev };
        for (const [key, px] of Object.entries(incoming)) {
          if (typeof px === "number") {
            next[key as ColumnKey] = clampWidth(key as ColumnKey, px);
          }
        }
        persist({ widths: next });
        return next;
      });
    },
    [persist]
  );

  const freezeVars = useCallback((entries: [string, number][]) => {
    const host = hostRef.current;
    if (!host) return;
    for (const [name, px] of entries) {
      host.style.setProperty(name, `${px}px`);
    }
  }, []);

  const resetWidth = useCallback(
    (key: ColumnKey) => {
      // Write the default out here too — same reason as reset() below: if state
      // was already default and only the DOM had drifted, the sync effect
      // wouldn't re-run.
      hostRef.current?.style.setProperty(
        cssVar(key),
        `${COLUMN_META[key].defaultWidth}px`
      );
      setWidths((prev) => {
        if (!(key in prev)) return prev;
        const next = { ...prev };
        delete next[key];
        persist({ widths: next });
        return next;
      });
    },
    [persist]
  );

  const toggleColumn = useCallback(
    (key: ColumnKey) => {
      if (!COLUMN_META[key].hideable) return;
      setHidden((prev) => {
        const next = prev.includes(key)
          ? prev.filter((k) => k !== key)
          : [...prev, key];
        persist({ hidden: next });
        return next;
      });
    },
    [persist]
  );

  const setHiddenColumns = useCallback(
    (keys: ColumnKey[]) => {
      const next = keys.filter((key) => COLUMN_META[key].hideable);
      setHidden(next);
      persist({ hidden: next });
    },
    [persist]
  );

  const moveColumn = useCallback(
    (from: number, to: number) => {
      setOrder((prev) => {
        const pinned = prev.findIndex((key) => COLUMN_META[key].hideable);
        const next = moveWithinOrder(prev, from, to, Math.max(pinned, 0));
        if (next !== prev) persist({ order: next });
        return next;
      });
    },
    [persist]
  );

  const reset = useCallback(() => {
    // Write the defaults out immediately as well as into state: if state was
    // already default (only the DOM had drifted, mid-drag), the effect above
    // wouldn't re-run and the stale widths would survive the reset.
    for (const key of defaultOrder) {
      hostRef.current?.style.setProperty(
        cssVar(key),
        `${COLUMN_META[key].defaultWidth}px`
      );
    }
    setWidths({});
    setHidden([]);
    setOrder(defaultOrder);
    persist({ widths: {}, hidden: [], order: defaultOrder });
  }, [defaultOrder, persist]);

  const hiddenSet = useMemo(() => new Set(hidden), [hidden]);

  const value = useMemo<TableLayoutValue>(() => {
    const isVisible = (key: ColumnKey) => !hiddenSet.has(key);
    return {
      order,
      visibleColumns: order.filter(isVisible),
      isVisible,
      moveColumn,
      width,
      widthStyle,
      previewWidth,
      commitWidth,
      commitWidths,
      freezeVars,
      hasCustomWidths: Object.keys(widths).length > 0,
      resetWidth,
      toggleColumn,
      setHiddenColumns,
      reset,
      isDefaultLayout:
        hidden.length === 0 &&
        Object.keys(widths).length === 0 &&
        order.length === defaultOrder.length &&
        order.every((key, index) => key === defaultOrder[index])
    };
  }, [
    order,
    defaultOrder,
    hiddenSet,
    hidden.length,
    widths,
    width,
    widthStyle,
    previewWidth,
    commitWidth,
    commitWidths,
    freezeVars,
    resetWidth,
    toggleColumn,
    setHiddenColumns,
    moveColumn,
    reset
  ]);

  return (
    <TableLayoutContext.Provider value={value}>
      {/* No style prop — the effect above owns the width variables. Until it
          first runs, each <col> falls back to its default inside var(). */}
      <div ref={hostRef} className={className}>
        {children}
      </div>
    </TableLayoutContext.Provider>
  );
}
