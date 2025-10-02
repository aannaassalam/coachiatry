"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Archivo } from "next/font/google";
import { Plus, Trash2, X } from "lucide-react";
import { Combobox } from "../ui/combobox";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { PopoverClose } from "@radix-ui/react-popover";
const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo" });
type FilterOption = {
  compareOperator: { label: string; value: string }[];
  compareWith: { label: string; value: string }[];
};

function FilterBox() {
  const [values, setValues] = useState([
    {
      selectedKey: "",
      selectedOperator: "",
      selectedValue: ""
    }
  ]);
  const [filterKeys] = useState([
    { label: "Status", value: "status" },
    { label: "Due Date", value: "duedate" },
    { label: "Category", value: "category" },
    { label: "Priority", value: "priority" }
  ]);

  const [filterOptions] = useState<Record<string, FilterOption>>({
    status: {
      compareOperator: [
        { label: "is", value: "is" },
        { label: "is not", value: "is not" }
      ],
      compareWith: [
        {
          label: "Todo",
          value: "todo"
        },
        {
          label: "Struggling",
          value: "struggling"
        },
        {
          label: "Overdue",
          value: "overdue"
        },
        {
          label: "Completed",
          value: "completed"
        }
      ]
    },
    duedate: {
      compareOperator: [
        { label: "is", value: "is" },
        { label: "is not", value: "is not" }
      ],
      compareWith: [
        {
          label: "Today",
          value: "today"
        },
        {
          label: "Yesterday",
          value: "yesterday"
        },
        {
          label: "Tomorrow",
          value: "tomorrow"
        },
        {
          label: "This Week",
          value: "thisweek"
        },
        {
          label: "Next Week",
          value: "nextweek"
        }
      ]
    },
    category: {
      compareOperator: [
        { label: "is", value: "is" },
        { label: "is not", value: "is not" }
      ],
      compareWith: [
        {
          label: "Goal",
          value: "goal"
        },
        {
          label: "Fitness",
          value: "fitness"
        },
        {
          label: "Productive",
          value: "productive"
        },
        {
          label: "Health",
          value: "health"
        }
      ]
    },
    priority: {
      compareOperator: [
        { label: "is", value: "is" },
        { label: "is not", value: "is not" }
      ],
      compareWith: [
        {
          label: "High",
          value: "high"
        },
        {
          label: "Medium",
          value: "medium"
        },
        {
          label: "Low",
          value: "low"
        }
      ]
    }
  });
  // console.log(values.selectedKey);
  return (
    <div className={`${archivo.variable}`}>
      <div className="p-4">
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
          <div className="p-4 mt-2 bg-gray-100 rounded-[8px] flex flex-col gap-2">
            {values.map((filter, index) => (
              <div key={index} className="flex w-full items-center gap-3">
                <Combobox
                  value={filter.selectedKey}
                  options={filterKeys}
                  placeholder="Select"
                  onChange={(e) => {
                    setValues((prev) => {
                      const next = [...prev]; // clone array
                      next[index] = {
                        // update just this filter
                        ...next[index],
                        selectedKey: e,
                        selectedOperator: "", // optional: reset next fields
                        selectedValue: ""
                      };
                      return next;
                    });
                  }}
                  className="flex-1 max-w-[200px]"
                />

                {filter.selectedKey && (
                  <Combobox
                    options={filterOptions[filter.selectedKey]?.compareOperator}
                    placeholder="Select"
                    onChange={(e) => {
                      setValues((prev) => {
                        const next = [...prev];
                        next[index] = {
                          ...next[index],
                          selectedOperator: e,
                          selectedValue: ""
                        };
                        return next;
                      });
                    }}
                    className="flex-1 max-w-[200px]"
                    value={filter.selectedOperator}
                  />
                )}

                {filter.selectedOperator && (
                  <Combobox
                    options={filterOptions[filter.selectedKey]?.compareWith}
                    placeholder="Select"
                    onChange={(e) => {
                      setValues((prev) => {
                        const next = [...prev];
                        next[index] = {
                          ...next[index],
                          selectedValue: e
                        };
                        return next;
                      });
                    }}
                    value={filter.selectedValue}
                    className="flex-1 max-w-[200px]"
                  />
                )}

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      onClick={() =>
                        setValues((prev) => prev.filter((_, i) => i !== index))
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
            setValues((prev) => [
              ...prev,
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
