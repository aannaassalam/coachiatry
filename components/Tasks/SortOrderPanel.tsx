import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, GripVertical, X } from "lucide-react";
import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs";
import { useState } from "react";
import {
  COLUMN_META,
  ColumnKey,
  getColumnSortState,
  moveColumnSort,
  removeColumnSort,
  setColumnSortDir
} from "./tableColumns";

const baseKey = (entry: string) => entry.replace(/^-/, "") as ColumnKey;

/**
 * "Sorting order" panel shown when two or more columns are sorted. Lets the user
 * reorder the sort priority (native HTML5 drag), flip each direction and remove
 * individual sorts, plus a footer "Clear sort". Persistence ("Save this order")
 * is intentionally omitted — sort lives entirely in the URL.
 */
function SortOrderPanel() {
  const [sort, setSort] = useQueryState(
    "sort",
    parseAsArrayOf(parseAsString.withDefault("")).withDefault([])
  );
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const handleDrop = (to: number) => {
    if (dragIndex === null) return;
    setSort((prev) => moveColumnSort(prev, dragIndex, to), { shallow: true });
    setDragIndex(null);
  };

  return (
    <div className="w-[260px]">
      <p className="px-3 pt-3 pb-2 text-xs font-medium text-gray-400">
        Sorting order
      </p>
      <div className="px-1.5 pb-1.5">
        {sort.map((entry, index) => {
          const key = baseKey(entry);
          const meta = COLUMN_META[key];
          const { dir } = getColumnSortState(sort, key);
          return (
            <div
              key={key}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(index)}
              onDragEnd={() => setDragIndex(null)}
              className={cn(
                "flex items-center gap-2 rounded-md px-1.5 py-1.5 hover:bg-gray-50 cursor-grab",
                dragIndex === index && "opacity-50"
              )}
            >
              <GripVertical size={14} className="text-gray-300 shrink-0" />
              <span className="flex-1 text-sm font-lato text-gray-700 truncate">
                {meta?.label ?? key}
              </span>
              <button
                type="button"
                onClick={() =>
                  setSort(
                    (prev) =>
                      setColumnSortDir(
                        prev,
                        key,
                        dir === "desc" ? "asc" : "desc"
                      ),
                    { shallow: true }
                  )
                }
                className="flex items-center justify-center rounded-sm p-1 text-gray-500 hover:bg-gray-100 cursor-pointer"
                aria-label="Toggle direction"
              >
                {dir === "desc" ? (
                  <ArrowDown size={14} />
                ) : (
                  <ArrowUp size={14} />
                )}
              </button>
              <button
                type="button"
                onClick={() =>
                  setSort((prev) => removeColumnSort(prev, key), {
                    shallow: true
                  })
                }
                className="flex items-center justify-center rounded-sm p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
                aria-label="Remove sort"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
      <div className="border-t border-gray-100 p-1.5">
        <button
          type="button"
          onClick={() => setSort([], { shallow: true })}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-lato text-gray-700 hover:bg-gray-50 cursor-pointer"
        >
          <X size={14} className="text-gray-400" />
          Clear sort
        </button>
      </div>
    </div>
  );
}

export default SortOrderPanel;
