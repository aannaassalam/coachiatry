"use client";

import {
  getAllCategories,
  getAllCategoriesByCoach,
  getAllCategoriesByShare
} from "@/external-api/functions/category.api";
import {
  getAllStatuses,
  getAllStatusesByCoach,
  getAllStatusesByShare
} from "@/external-api/functions/status.api";
import {
  addSavedFilter,
  deleteSavedFilter,
  editSavedFilter,
  getSavedFilters,
  SavedFilter
} from "@/external-api/functions/savedFilter.api";
import {
  sanitizeFilters,
  VALUELESS_OPERATORS
} from "@/lib/functions/_helpers.lib";
import { cn } from "@/lib/utils";
import { Filter } from "@/typescript/interface/common.interface";
import { PopoverClose } from "@radix-ui/react-popover";
import { useMutation, useQueries, useQuery } from "@tanstack/react-query";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { Archivo } from "next/font/google";
import { parseAsJson, parseAsString, useQueryState } from "nuqs";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Button } from "../ui/button";
import { Combobox } from "../ui/combobox";
import { Input } from "../ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo" });

const EMPTY_ROW: Filter = {
  selectedKey: "",
  selectedOperator: "",
  selectedValue: ""
};

/** Order-sensitive signature — good enough to answer "is this row set dirty?". */
const signature = (rows: Filter[]) =>
  sanitizeFilters(rows)
    .map((r) => `${r.selectedKey}|${r.selectedOperator}|${r.selectedValue ?? ""}`)
    .join(";");

/**
 * Name of the saved filter currently applied, if any — lets the Filter trigger
 * button outside this popover say *which* saved filter is on.
 */
export function useAppliedSavedFilterName(): string {
  const { userId } = useParams();
  const [appliedId] = useQueryState(
    "savedFilter",
    parseAsString.withDefault("")
  );
  const { data = [] } = useQuery({
    queryKey: ["savedFilters", userId ?? null],
    queryFn: () => getSavedFilters(userId as string | undefined),
    enabled: !!appliedId
  });
  return data.find((f) => f._id === appliedId)?.name ?? "";
}

type FilterOption = {
  compareOperator: { label: string; value: string }[];
  compareWith: { label: string; value: string }[];
};

function FilterBox() {
  // ✅ store filters in URL instead of local state
  // `userId` is present only under /clients/[userId] (coach view) and `shareId`
  // only under /shared-tasks/[shareId] (a share-link watcher). Either one means
  // the status/category options must come from THAT sheet's owner, not the
  // signed-in user; with neither, this is the personal page.
  const { userId, shareId } = useParams();

  const [values, setValues] = useQueryState<Filter[]>(
    "filters",
    parseAsJson<Filter[]>((v) =>
      Array.isArray(v) ? (v as Filter[]) : null
    ).withDefault([EMPTY_ROW])
  );
  const [tab] = useQueryState("tab", parseAsString.withDefault("list"));
  // Which saved filter the current rows came from. In the URL so it survives a
  // reload / shared link alongside the rows themselves.
  const [appliedId, setAppliedId] = useQueryState(
    "savedFilter",
    parseAsString.withDefault("")
  );

  // The footer's save bar. `null` = closed. With an `id` it edits that saved
  // filter (name AND rows, whatever the rows say when Save is pressed);
  // without one it creates a new saved filter.
  const [draft, setDraft] = useState<{ id?: string; name: string } | null>(
    null
  );
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [savedSearch, setSavedSearch] = useState("");

  const [
    { data: categories = [], isLoading: isCategoryLoading },
    { data: statuses = [], isLoading: isStatusLoading },
    { data: savedFilters = [] }
  ] = useQueries({
    queries: [
      {
        queryKey: ["categories", userId ?? shareId ?? null],
        queryFn: () =>
          userId
            ? getAllCategoriesByCoach(userId as string)
            : shareId
              ? getAllCategoriesByShare(shareId as string)
              : getAllCategories()
      },
      {
        queryKey: ["status", userId ?? shareId ?? null],
        queryFn: () =>
          userId
            ? getAllStatusesByCoach(userId as string)
            : shareId
              ? getAllStatusesByShare(shareId as string)
              : getAllStatuses()
      },
      {
        queryKey: ["savedFilters", userId ?? null],
        queryFn: () => getSavedFilters(userId as string | undefined)
      }
    ]
  });

  const invalidate = { invalidateQueries: ["savedFilters"] };

  const { mutate: create, isPending: isCreating } = useMutation({
    mutationFn: (name: string) =>
      addSavedFilter(
        { name, filters: sanitizeFilters(values) },
        userId as string | undefined
      ),
    onSuccess: (saved) => {
      setAppliedId(saved._id);
      setDraft(null);
    },
    meta: invalidate
  });

  const { mutate: update, isPending: isUpdating } = useMutation({
    mutationFn: (body: { id: string; name: string; filters: Filter[] }) =>
      editSavedFilter(body),
    onSuccess: (saved) => {
      setAppliedId(saved._id);
      setDraft(null);
    },
    meta: invalidate
  });

  const { mutate: remove, isPending: isDeleting } = useMutation({
    mutationFn: deleteSavedFilter,
    onSuccess: (_data, id) => {
      if (id === appliedId) setAppliedId(null);
      if (draft?.id === id) setDraft(null);
      setConfirmDelete(null);
    },
    meta: invalidate
  });

  const applied = savedFilters.find((f) => f._id === appliedId);
  const validFilters = sanitizeFilters(values);
  const isDirty = !!applied && signature(applied.filters) !== signature(values);

  const apply = (filter: SavedFilter) => {
    // Applying pulls the rows out from under any open draft, so drop it —
    // otherwise a half-typed name would silently retarget to another filter.
    // (The pencil re-opens its own draft right after calling this.)
    setDraft(null);
    setAppliedId(filter._id);
    setValues(filter.filters.length ? filter.filters : [EMPTY_ROW]);
  };

  const clearApplied = () => {
    setAppliedId(null);
    setValues([EMPTY_ROW]);
    setDraft(null);
  };

  const saveDraft = () => {
    const name = draft?.name.trim();
    if (!name || !validFilters.length) return;
    if (draft?.id) update({ id: draft.id, name, filters: validFilters });
    else create(name);
  };

  const filterKeys = [
    { label: "Status", value: "status" },
    { label: "Due Date", value: "dueDate" }, // 👈 lowercase to match filterOptions
    { label: "Category", value: "category" },
    { label: "Priority", value: "priority" }
  ];

  const filterOptions: Record<string, FilterOption> = {
    status: {
      compareOperator: [
        { label: "is", value: "is" },
        { label: "is not", value: "is not" }
      ],
      compareWith: statuses.map((_status) => ({
        label: _status.title,
        value: _status._id
      }))
    },
    dueDate: {
      compareOperator: [
        { label: "is", value: "is" },
        { label: "is not", value: "is not" },
        { label: "is set", value: "isSet" },
        { label: "is not set", value: "isNotSet" }
      ],
      compareWith: [
        { label: "Today", value: "today" },
        { label: "Yesterday", value: "yesterday" },
        { label: "Tomorrow", value: "tomorrow" },
        { label: "This Week", value: "thisWeek" },
        { label: "Next Week", value: "nextWeek" }
      ]
    },
    category: {
      compareOperator: [
        { label: "is", value: "is" },
        { label: "is not", value: "is not" }
      ],
      compareWith: categories.map((_cat) => ({
        label: _cat.title,
        value: _cat._id
      }))
    },
    priority: {
      compareOperator: [
        { label: "is", value: "is" },
        { label: "is not", value: "is not" }
      ],
      compareWith: [
        { label: "High", value: "high" },
        { label: "Medium", value: "medium" },
        { label: "Low", value: "low" }
      ]
    }
  };

  const visibleSaved = savedFilters.filter((f) =>
    f.name.toLowerCase().includes(savedSearch.trim().toLowerCase())
  );

  return (
    <div className={`${archivo.variable} flex items-stretch max-sm:flex-col`}>
      {/* Saved filters live in their own scrolling column so the popover keeps
          its size whether there are two of them or fifty. */}
      {savedFilters.length > 0 && (
        <div className="w-[220px] shrink-0 border-r border-gray-200 p-3 max-sm:w-full max-sm:border-r-0 max-sm:border-b">
          <div className="flex items-center gap-2">
            <p className="tracking-[-2%] text-xs font-medium font-archivo text-gray-500">
              Saved Filters ({savedFilters.length})
            </p>
            {applied && (
              <button
                type="button"
                className="cursor-pointer ml-auto text-xs text-gray-500 hover:text-gray-900"
                onClick={clearApplied}
              >
                Clear
              </button>
            )}
          </div>

          {savedFilters.length > 8 && (
            <Input
              placeholder="Search"
              className="mt-2 h-7 text-xs"
              value={savedSearch}
              onChange={(e) => setSavedSearch(e.target.value)}
            />
          )}

          <div className="mt-2 flex flex-col gap-0.5 overflow-y-auto max-h-[320px] max-sm:max-h-[140px]">
            {visibleSaved.length === 0 && (
              <p className="px-2 py-1.5 text-xs text-gray-400">No matches</p>
            )}
            {visibleSaved.map((filter) => {
              const isApplied = filter._id === appliedId;
              // Confirm inline rather than in an AlertDialog: a modal steals
              // focus out of this popover, which would close it behind the
              // dialog.
              if (confirmDelete === filter._id) {
                return (
                  <div
                    key={filter._id}
                    className="flex items-center gap-1 rounded-md bg-red-50 px-2 py-1.5 text-xs text-red-700"
                  >
                    <span className="flex-1 min-w-0 truncate">Delete this?</span>
                    <button
                      type="button"
                      className="cursor-pointer p-1 hover:opacity-70 disabled:opacity-50"
                      disabled={isDeleting}
                      onClick={() => remove(filter._id)}
                      title="Yes, delete"
                    >
                      <Check className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      className="cursor-pointer p-1 hover:opacity-70"
                      onClick={() => setConfirmDelete(null)}
                      title="Cancel"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                );
              }
              return (
                <div
                  key={filter._id}
                  className={cn(
                    "group flex items-center gap-1 rounded-md pl-2 pr-1 py-1.5 text-sm",
                    isApplied
                      ? "bg-primary/10 text-gray-900 font-medium"
                      : "text-gray-700 hover:bg-gray-100",
                    // The one currently open in the editor.
                    draft?.id === filter._id && "ring-1 ring-primary/40"
                  )}
                >
                  <button
                    type="button"
                    className="cursor-pointer flex flex-1 min-w-0 items-center gap-1.5 text-left"
                    onClick={() => (isApplied ? clearApplied() : apply(filter))}
                    title={
                      isApplied
                        ? `Applied — click to clear "${filter.name}"`
                        : `Apply "${filter.name}"`
                    }
                  >
                    <Check
                      className={cn(
                        "size-3.5 shrink-0 text-primary",
                        !isApplied && "invisible"
                      )}
                    />
                    <span className="truncate">{filter.name}</span>
                  </button>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="cursor-pointer p-1 text-gray-500 opacity-0 group-hover:opacity-100 hover:text-gray-900"
                        // Editing works on the live rows, so the filter has to
                        // be applied first — then Save writes back both the new
                        // name and whatever the rows now say.
                        onClick={() => {
                          apply(filter);
                          setDraft({ id: filter._id, name: filter.name });
                        }}
                      >
                        <Pencil className="size-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Edit name &amp; filters</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="cursor-pointer p-1 text-gray-500 opacity-0 group-hover:opacity-100 hover:text-red-600"
                        onClick={() => setConfirmDelete(filter._id)}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Delete</TooltipContent>
                  </Tooltip>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0 p-4 max-sm:p-2">
        <div className="w-full flex justify-between items-center">
          <p className="tracking-[-2%] text-sm font-medium font-archivo text-gray-500">
            {draft === null
              ? "Select Filters"
              : draft.id
                ? "Edit saved filter"
                : "New saved filter"}
          </p>
          <PopoverClose>
            <Button
              variant="ghost"
              size="sm"
              className="px-2 text-xs font-medium text-gray-700"
            >
              <X className="text-gray-500" />
            </Button>
          </PopoverClose>
        </div>

        {/* Name gets its own full-width field above the rows — cramming it into
            the button row overflowed the popover. */}
        {draft !== null && (
          <div className="mt-3">
            <Input
              autoFocus
              placeholder="Filter name"
              className="h-9 w-full"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Escape") setDraft(null);
                if (e.key === "Enter") saveDraft();
              }}
            />
            <p className="mt-1 text-xs text-gray-400">
              Edit the rows below too — nothing is stored until you press Save.
            </p>
          </div>
        )}

        {values.length > 0 && (
          <div className="p-4 mt-2 bg-gray-100 rounded-[8px] flex flex-col gap-2 max-sm:p-2 max-sm:max-h-[400px] max-sm:overflow-auto">
            {values.map((filter, index) => (
              <div
                key={index}
                className="flex w-full items-center gap-3 max-sm:flex-col"
              >
                <Combobox
                  value={filter.selectedKey}
                  options={filterKeys.filter(
                    (_item) =>
                      _item.value === filter.selectedKey || // ✅ allow current row's key
                      !values.some(
                        (item, i) =>
                          (i !== index && item.selectedKey === _item.value) ||
                          (tab === "week" && _item.value === "dueDate")
                      ) // exclude if another row has it
                  )}
                  isLoading={isCategoryLoading || isStatusLoading}
                  placeholder="Select"
                  onChange={(e) => {
                    const next = [...values];
                    next[index] = {
                      ...next[index],
                      selectedKey: e.toString(),
                      selectedOperator: "",
                      selectedValue: ""
                    };
                    setValues(next);
                  }}
                  className="flex-1 max-w-[200px] max-sm:max-w-full max-sm:w-full"
                />

                {filter.selectedKey && (
                  <Combobox
                    options={filterOptions[filter.selectedKey]?.compareOperator}
                    placeholder="Select"
                    onChange={(e) => {
                      const next = [...values];
                      next[index] = {
                        ...next[index],
                        selectedOperator: e.toString(),
                        selectedValue: ""
                      };
                      setValues(next);
                    }}
                    isLoading={isCategoryLoading || isStatusLoading}
                    className="flex-1 max-w-[200px] max-sm:max-w-full max-sm:w-full"
                    value={filter.selectedOperator}
                  />
                )}

                {filter.selectedOperator &&
                  !VALUELESS_OPERATORS.includes(filter.selectedOperator) && (
                    <Combobox
                      options={filterOptions[filter.selectedKey]?.compareWith}
                      placeholder="Select"
                      onChange={(e) => {
                        const next = [...values];
                        next[index] = {
                          ...next[index],
                          selectedValue: e.toString()
                        };
                        setValues(next);
                      }}
                      isLoading={isCategoryLoading || isStatusLoading}
                      value={filter.selectedValue}
                      className="flex-1 max-w-[200px] max-sm:max-w-full max-sm:w-full"
                    />
                  )}

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      onClick={() =>
                        setValues(values.filter((_, i) => i !== index))
                      }
                      className="px-2 ml-auto hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete</TooltipContent>
                </Tooltip>
              </div>
            ))}
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            onClick={() => setValues([...values, EMPTY_ROW])}
            variant="outline"
            className="py-2"
          >
            <Plus />
            Add Filter
          </Button>

          {/* Saving is always explicit — editing rows never writes back until
              one of these buttons is pressed. */}
          {draft === null ? (
            <div className="ml-auto flex items-center gap-2">
              {isDirty && (
                <Button
                  variant="outline"
                  className="py-2"
                  onClick={() =>
                    setDraft({ id: applied!._id, name: applied!.name })
                  }
                >
                  Save changes
                </Button>
              )}
              {validFilters.length > 0 && (
                <Button
                  variant="secondary"
                  className="py-2"
                  onClick={() => setDraft({ name: "" })}
                >
                  {applied ? "Save as new" : "Save filter"}
                </Button>
              )}
            </div>
          ) : (
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="ghost"
                className="py-2"
                onClick={() => setDraft(null)}
              >
                Cancel
              </Button>
              <Button
                className="py-2"
                isLoading={isCreating || isUpdating}
                disabled={!draft.name.trim() || validFilters.length === 0}
                onClick={saveDraft}
              >
                <Check />
                Save
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FilterBox;
