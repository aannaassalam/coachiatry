import ScheduledTable from "@/components/Chats/ScheduledTable";
import { Separator } from "@/components/ui/separator";
import AppLayout from "@/layouts/AppLayout";
import Link from "next/link";
import React from "react";

function ScheduledMessages() {
  return (
    <AppLayout>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-2 items-center ">
          <Link
            href="/chat"
            className="text-sm font-lato font-normal text-gray-600 "
          >
            Chat
          </Link>
          <span className="text-xs text-gray-600">/</span>
          <h1 className="text-sm  font-lato font-semibold text-gray-900 ">
            Scheduled Message
          </h1>
        </div>
      </div>
      <Separator />
      <h2 className="text-gray-900 font-archivo text-2xl tracking-[-3%] font-semibold mt-4">
        All Scheduled Message
      </h2>
      <ScheduledTable />
    </AppLayout>
  );
}

export default ScheduledMessages;
