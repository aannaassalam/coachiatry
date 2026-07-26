import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { sanitizeFilters } from "@/lib/functions/_helpers.lib";
import { Filter } from "@/typescript/interface/common.interface";
import { Columns3, ListFilter } from "lucide-react";
import moment from "moment";
import { parseAsJson, useQueryState } from "nuqs";
import { useState } from "react";
import AddTaskSheet from "./AddTaskSheet";
import ListView from "./ListView";
import FilterBox, {
  useAppliedSavedFilterName
} from "@/components/Tasks/FilterBox";
import ColumnBox from "@/components/Tasks/ColumnBox";
import GroupByControl from "@/components/Tasks/GroupByControl";
import { TableLayoutProvider } from "@/components/Tasks/TableLayoutContext";
import { CLIENT_TASK_COLUMN_ORDER } from "@/components/Tasks/tableColumns";

moment.updateLocale("en", {
  week: {
    dow: 1, // Monday is first day of week
    doy: 4 // week 1 must contain Jan 4th (ISO 8601 standard)
  }
});

function Tasks() {
  const [values] = useQueryState<Filter[]>(
    "filters",
    parseAsJson<Filter[]>((v) =>
      Array.isArray(v) ? (v as Filter[]) : null
    ).withDefault([
      { selectedKey: "", selectedOperator: "", selectedValue: "" }
    ])
  );

  const [isOpen, setIsOpen] = useState(false);
  const validatedFilters = sanitizeFilters(values);
  const appliedFilterName = useAppliedSavedFilterName();

  return (
    // Owns column widths / visibility for the table below and for the Columns
    // popover in the header.
    <TableLayoutProvider
      scope="client-tasks"
      defaultOrder={CLIENT_TASK_COLUMN_ORDER}
    >
      {/* header */}
      <div className="mb-0 flex items-center justify-between">
        <h1 className="text-2xl leading-7 tracking-[-3%] font-semibold text-gray-900 mb-2 max-sm:mb-0">
          Tasks
        </h1>
        <div className="flex items-center justify-start gap-5 ml-auto pb-3 max-sm:mt-3">
          <GroupByControl />
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost">
                <Columns3 />
                Columns
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[260px] p-0"
              align="end"
              collisionPadding={20}
            >
              <ColumnBox />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={validatedFilters.length > 0 ? "secondary" : "ghost"}
              >
                <ListFilter />
                <span className="max-w-[160px] truncate">
                  {appliedFilterName || "Filter"}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[720px] p-0 max-md:w-[90vw] max-sm:w-[95vw] max-sm:right-2 max-sm:relative"
              collisionPadding={20}
            >
              <FilterBox />
            </PopoverContent>
          </Popover>
          <div className="flex gap-3">
            <Button onClick={() => setIsOpen(true)}>New Task</Button>
          </div>
        </div>
      </div>
      <div>
        <Separator />
        <ListView />
      </div>

      <AddTaskSheet open={isOpen} onOpenChange={setIsOpen} />
    </TableLayoutProvider>
  );
}

export default Tasks;
