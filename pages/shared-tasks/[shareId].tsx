import PageTitle from "@/components/Seo/PageTitle";
import ColumnBox from "@/components/Tasks/ColumnBox";
import FilterBox from "@/components/Tasks/FilterBox";
import GroupByControl from "@/components/Tasks/GroupByControl";
import SharedListView from "@/components/Tasks/Shared/SharedListView";
import SharedWeekView from "@/components/Tasks/Shared/SharedWeekView";
import { TableLayoutProvider } from "@/components/Tasks/TableLayoutContext";
import { SHARED_TASK_COLUMN_ORDER } from "@/components/Tasks/tableColumns";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppLayout from "@/layouts/AppLayout";
import { Filter } from "@/typescript/interface/common.interface";
import { Columns3, ListFilter } from "lucide-react";
import moment from "moment";
import { parseAsJson, parseAsString, useQueryState } from "nuqs";
import { BsChevronLeft, BsChevronRight } from "react-icons/bs";

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

function SharedTasks() {
  const [tab, setTab] = useQueryState("tab", parseAsString.withDefault("list"));
  const [values] = useQueryState<Filter[]>(
    "filters",
    parseAsJson<Filter[]>((v) =>
      Array.isArray(v) ? (v as Filter[]) : null
    ).withDefault([
      { selectedKey: "", selectedOperator: "", selectedValue: "" }
    ])
  );
  const [dates, setDates] = useQueryState(
    "dates",
    parseAsJson<{ start: string; end: string }>((v) =>
      v && typeof v === "object" ? (v as { start: string; end: string }) : null
    ).withDefault({
      start: moment().startOf("week").toISOString(),
      end: moment().endOf("week").toISOString()
    })
  );

  const validatedFilters = sanitizeFilters(values);

  const goPrevWeek = () => {
    setDates((prev) => ({
      start: moment(prev.start).subtract(1, "week").toISOString(),
      end: moment(prev.end).subtract(1, "week").toISOString()
    }));
  };

  const goNextWeek = () => {
    setDates((prev) => ({
      start: moment(prev.start).add(1, "week").toISOString(),
      end: moment(prev.end).add(1, "week").toISOString()
    }));
  };
  return (
    <AppLayout>
      <PageTitle title="Shared Tasks" />
      {/* header */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl leading-7 tracking-[-3%] font-semibold text-gray-900 mb-2 max-sm:mb-0">
          Tasks
        </h1>
      </div>
      {/* Owns column widths / visibility / order for the shared table below and
          for the Columns popover in the toolbar. */}
      <TableLayoutProvider
        scope="shared-tasks"
        defaultOrder={SHARED_TASK_COLUMN_ORDER}
      >
        <Tabs
          value={tab}
          onValueChange={(value) => {
            if (value === "list") {
              setDates(null);
            }
            setTab(value);
          }}
        >
          <div>
            <div className="flex items-center justify-start gap-5 pb-3 max-sm:mt-3">
              <TabsList className="h-auto">
                <TabsTrigger
                  value="list"
                  className="py-1.5 px-6 text-sm leading-5 cursor-pointer"
                >
                  List
                </TabsTrigger>
                <TabsTrigger
                  value="week"
                  className="py-1.5 px-4 text-sm leading-5 cursor-pointer"
                >
                  Week
                </TabsTrigger>
              </TabsList>
              {tab === "week" && (
                <div className="ml-3 flex items-center gap-2 max-sm:hidden">
                  <Button variant="ghost" size="sm" onClick={goPrevWeek}>
                    <BsChevronLeft className="text-gray-600 size-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={goNextWeek}>
                    <BsChevronRight className="text-gray-600 size-3.5" />
                  </Button>
                  <p className="font-lato tracking-[-0.05px] text-gray-600">
                    {moment(dates.start).format("MMMM")}
                  </p>
                  <p className="text-sm ml-4 font-lato tracking-[-0.05px] text-gray-600">
                    {moment(dates.start).format("L")} -{" "}
                    {moment(dates.end).format("L")}
                  </p>
                </div>
              )}
              {tab === "list" && <GroupByControl />}
              <div className="ml-auto flex items-center">
                {tab === "list" && (
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
                )}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={
                        validatedFilters.length > 0 ? "secondary" : "ghost"
                      }
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
              </div>
            </div>
            {tab === "week" && (
              <div className="flex items-center gap-2 sm:hidden mb-6 mt-2">
                <Button variant="ghost" size="sm" onClick={goPrevWeek}>
                  <BsChevronLeft className="text-gray-600 size-3.5" />
                </Button>
                <Button variant="ghost" size="sm" onClick={goNextWeek}>
                  <BsChevronRight className="text-gray-600 size-3.5" />
                </Button>
                <p className="font-lato tracking-[-0.05px] text-gray-600">
                  {moment(dates.start).format("MMMM")}
                </p>
                <p className="text-sm ml-4 font-lato tracking-[-0.05px] text-gray-600">
                  {moment(dates.start).format("L")} -{" "}
                  {moment(dates.end).format("L")}
                </p>
              </div>
            )}

            <Separator />
            <TabsContent value="list">
              <SharedListView />
            </TabsContent>
            <TabsContent
              value="week"
              className="w-full weekContainer max-lg:!max-w-[93vw]"
            >
              <SharedWeekView />
            </TabsContent>
          </div>
        </Tabs>
      </TableLayoutProvider>
    </AppLayout>
  );
}

export default SharedTasks;
