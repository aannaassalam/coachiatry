import { Button } from "@/components/ui/button";
import AppLayout from "@/layouts/AppLayout";
import React, { useState } from "react";
import { IoIosShareAlt } from "react-icons/io";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { ListFilter } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import assets from "@/json/assets";
import { parseAsString, useQueryState } from "nuqs";
import ListView from "@/components/Tasks/ListView";
import AddTaskSheet from "@/components/Tasks/AddTaskSheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import ColumnBox from "@/components/Tasks/ColumnBox";
import FilterBox from "@/components/Tasks/FilterBox";
import { BsChevronLeft, BsChevronRight } from "react-icons/bs";
import moment from "moment";
import WeekView from "@/components/Tasks/WeekView";

function Tasks() {
  const [tab, setTab] = useQueryState("tab", parseAsString.withDefault("list"));
  const [isOpen, setIsOpen] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState(
    moment().startOf("week")
  );
  const currentWeekEnd = moment(currentWeekStart).endOf("week");
  const goPrevWeek = () => {
    setCurrentWeekStart((prev) => moment(prev).subtract(1, "week"));
  };

  const goNextWeek = () => {
    setCurrentWeekStart((prev) => moment(prev).add(1, "week"));
  };
  return (
    <AppLayout>
      {/* header */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl leading-7 tracking-[-3%] font-semibold text-gray-900 mb-2">
          Tasks
        </h1>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="sm"
            className="gap-1.5 font-semibold"
          >
            <IoIosShareAlt />
            Share
          </Button>
          <Button onClick={() => setIsOpen(true)}>New Task</Button>
        </div>
      </div>
      <Tabs value={tab} onValueChange={(value) => setTab(value)}>
        <div>
          <div className="flex items-center justify-start gap-5 pb-3">
            <TabsList className="h-auto">
              <TabsTrigger
                value="list"
                className="py-1.5 px-6 text-sm leading-5"
              >
                List
              </TabsTrigger>
              <TabsTrigger
                value="week"
                className="py-1.5 px-4 text-sm leading-5"
              >
                Week
              </TabsTrigger>
            </TabsList>
            {tab === "week" && (
              <div className="ml-3 flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={goPrevWeek}>
                  <BsChevronLeft className="text-gray-600 size-3.5" />
                </Button>
                <Button variant="ghost" size="sm" onClick={goNextWeek}>
                  <BsChevronRight className="text-gray-600 size-3.5" />
                </Button>
                <p className="font-lato tracking-[-0.05px] text-gray-600">
                  {moment(currentWeekStart).format("MMMM")}
                </p>
                <p className="text-sm ml-4 font-lato tracking-[-0.05px] text-gray-600">
                  {moment(currentWeekStart).format("L")} -{" "}
                  {moment(currentWeekEnd).format("L")}
                </p>
              </div>
            )}
            <div className="ml-auto">
              <Popover>
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
              </Popover>
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
                  <Button variant="ghost">
                    <ListFilter />
                    Filter
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[720px] !left-[-100px] p-0 relative">
                  <FilterBox />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <Separator />
          <TabsContent value="list">
            <ListView />
          </TabsContent>
          <TabsContent value="week" className="w-full">
            <WeekView />
          </TabsContent>
        </div>
      </Tabs>
      <AddTaskSheet open={isOpen} onOpenChange={setIsOpen} />
    </AppLayout>
  );
}

export default Tasks;
