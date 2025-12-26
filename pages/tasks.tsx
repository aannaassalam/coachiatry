import AddTaskSheet from "@/components/Tasks/AddTaskSheet";
import FilterBox from "@/components/Tasks/FilterBox";
import ListView from "@/components/Tasks/ListView";
import WeekView from "@/components/Tasks/WeekView";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppLayout from "@/layouts/AppLayout";
import { Filter } from "@/typescript/interface/common.interface";
import { ListFilter } from "lucide-react";
import moment from "moment";
import { useSession } from "next-auth/react";
import { parseAsJson, parseAsString, useQueryState } from "nuqs";
import { useState } from "react";
import { BsChevronLeft, BsChevronRight } from "react-icons/bs";
import { IoIosShareAlt } from "react-icons/io";
import { toast } from "sonner";

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
  const { data } = useSession();
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

  const [isOpen, setIsOpen] = useState(false);
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
      {/* header */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl leading-7 tracking-[-3%] font-semibold text-gray-900 mb-2 max-sm:mb-0">
          Tasks
        </h1>
        <div className="flex gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className="gap-1.5 font-semibold"
              >
                <IoIosShareAlt />
                Share
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle>Share Access</DialogTitle>
              <div className="p-2 bg-white border rounded-sm flex items-center gap-2 w-full overflow-hidden">
                <p
                  className="w-100 truncate text-sm text-gray-700"
                  title={`${process.env.NEXTAUTH_URL}/share/user/${data?.user?.shareId}`}
                >
                  {`${process.env.NEXTAUTH_URL}/share/user/${data?.user?.shareId}`}
                </p>
                <Button
                  onClick={async () => {
                    await navigator.clipboard.writeText(
                      `${process.env.NEXTAUTH_URL}/share/user/${data?.user?.shareId}` ||
                        ""
                    );
                    toast.success("Link copied to clipboard!");
                  }}
                  size="sm"
                >
                  Copy
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button onClick={() => setIsOpen(true)}>New Task</Button>
        </div>
      </div>
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
              </Popover> */}
              {/* <Button variant="ghost">
                <Image
                  src={assets.icons.sort}
                  alt="sort"
                  width={18}
                  height={18}
                />
                Sort
              </Button> */}
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
            <ListView />
          </TabsContent>
          <TabsContent
            value="week"
            className="w-full weekContainer max-lg:!max-w-[93vw]"
          >
            <WeekView />
          </TabsContent>
        </div>
      </Tabs>

      <AddTaskSheet open={isOpen} onOpenChange={setIsOpen} />
    </AppLayout>
  );
}

export default Tasks;
