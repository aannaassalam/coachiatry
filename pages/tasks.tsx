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

function Tasks() {
  const [tab, setTab] = useQueryState("tab", parseAsString.withDefault("list"));
  const [isOpen, setIsOpen] = useState(false);

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
          <div className="flex items-center justify-between gap-5 pb-3">
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
            <div>
              <Button variant="ghost">
                <Image
                  src={assets.icons.column}
                  alt="column"
                  width={15}
                  height={15}
                />
                Column
              </Button>
              {/* <Button variant="ghost">
                <Image
                  src={assets.icons.sort}
                  alt="sort"
                  width={18}
                  height={18}
                />
                Sort
              </Button> */}
              <Button variant="ghost">
                <ListFilter />
                Filter
              </Button>
            </div>
          </div>
          <Separator />
          <TabsContent value="list">
            <ListView />
          </TabsContent>
        </div>
      </Tabs>
      <AddTaskSheet open={isOpen} onOpenChange={setIsOpen} />
    </AppLayout>
  );
}

export default Tasks;
