import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Filter } from "@/typescript/interface/common.interface";
import { ListFilter } from "lucide-react";
import moment from "moment";
import { parseAsJson, useQueryState } from "nuqs";
import { useState } from "react";
import AddTaskSheet from "./AddTaskSheet";
import ListView from "./ListView";
import FilterBox from "./FilterBox";

moment.updateLocale("en", {
  week: {
    dow: 1, // Monday is first day of week
    doy: 4 // week 1 must contain Jan 4th (ISO 8601 standard)
  }
});

function sanitizeFilters(values: Filter[]): Filter[] {
  return values.filter(
    (f) => f.selectedKey && f.selectedOperator && f.selectedValue
  );
}

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

  return (
    <>
      {/* header */}
      <div className="mb-0 flex items-center justify-between">
        <h1 className="text-2xl leading-7 tracking-[-3%] font-semibold text-gray-900 mb-2 max-sm:mb-0">
          Tasks
        </h1>
        <div className="flex items-center justify-start gap-5 ml-auto pb-3 max-sm:mt-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={validatedFilters.length > 0 ? "secondary" : "ghost"}
              >
                <ListFilter />
                Filter
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
        {/* <div className="flex items-center justify-start gap-5 pb-3 max-sm:mt-3">
          <div className="ml-auto">
            {/* <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost">
                    <Image
                      src={assets.icons.column}
                      alt="column"
                      width={15}
                      height={15}
                    />
                    Column
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[245px] p-0 ">
                  <ColumnBox />
                </PopoverContent>
              </Popover> *
            {/* <Button variant="ghost">
                <Image
                  src={assets.icons.sort}
                  alt="sort"
                  width={18}
                  height={18}
                />
                Sort
              </Button> *
          </div>
        </div> */}

        <Separator />
        <ListView />
      </div>

      <AddTaskSheet open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}

export default Tasks;
