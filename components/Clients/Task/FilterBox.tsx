"use client";

import { getAllCategoriesByCoach } from "@/external-api/functions/category.api";
import { getAllStatusesByCoach } from "@/external-api/functions/status.api";
import { Filter } from "@/typescript/interface/common.interface";
import { PopoverClose } from "@radix-ui/react-popover";
import { useQueries } from "@tanstack/react-query";
import { Plus, Trash2, X } from "lucide-react";
import { Archivo } from "next/font/google";
import { useParams } from "next/navigation";
import { parseAsJson, parseAsString, useQueryState } from "nuqs";
import { Button } from "../../ui/button";
import { Combobox } from "../../ui/combobox";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";

const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo" });

type FilterOption = {
  compareOperator: { label: string; value: string }[];
  compareWith: { label: string; value: string }[];
};

function FilterBox() {
  const { id: userId } = useParams();

  // ✅ store filters in URL instead of local state
  const [values, setValues] = useQueryState<Filter[]>(
    "filters",
    parseAsJson<Filter[]>((v) =>
      Array.isArray(v) ? (v as Filter[]) : null
    ).withDefault([
      { selectedKey: "", selectedOperator: "", selectedValue: "" }
    ])
  );
  const [tab] = useQueryState("tab", parseAsString.withDefault("list"));

  const [
    { data: categories = [], isLoading: isCategoryLoading },
    { data: statuses = [], isLoading: isStatusLoading }
  ] = useQueries({
    queries: [
      {
        queryKey: ["categories", userId],
        queryFn: () => getAllCategoriesByCoach(userId as string)
      },
      {
        queryKey: ["status", userId],
        queryFn: () => getAllStatusesByCoach(userId as string)
      }
    ]
  });

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
        { label: "is not", value: "is not" }
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

  return (
    <div className={`${archivo.variable}`}>
      <div className="p-4 max-sm:p-2">
        <div className="w-full flex justify-between items-center">
          <p className="tracking-[-2%] text-sm font-medium font-archivo text-gray-500">
            Select Filters
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

                {filter.selectedOperator && (
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

        <Button
          onClick={() =>
            setValues([
              ...values,
              { selectedKey: "", selectedOperator: "", selectedValue: "" }
            ])
          }
          variant="outline"
          className="mt-3 py-2"
        >
          <Plus />
          Add Filter
        </Button>
      </div>
    </div>
  );
}

export default FilterBox;
