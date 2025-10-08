import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import EmptyTable from "../Table/EmptyTable";
import ScheduleMessageModal from "./ScheduleModal";
import { Dialog } from "../ui/dialog";
import moment from "moment";

function ScheduledTable() {
  const [showScheduledModal, setShowScheduledModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<{
    message: string;
    date: Date;
    time: string;
    repeat: string;
  }>({
    message: "",
    date: new Date(),
    time: "",
    repeat: ""
  });
  const [scheduledList] = useState([
    {
      message:
        "Hey Riya, just checking in on your journaling habit this week. Let me  know how it's going , Have you had at least 3 deep-breath moments today?”",
      date: new Date(),
      time: "10:30",
      repeat: "Every Thursday"
    },
    {
      message:
        "Hey Riya, just checking in on your journaling habit this week. Let me  know how it's going , Have you had at least 3 deep-breath moments today?”",
      date: new Date(),
      time: "12:30",
      repeat: "Every Thursday"
    },
    {
      message:
        "Hey Riya, just checking in on your journaling habit this week. Let me  know how it's going , Have you had at least 3 deep-breath moments today?”",
      date: new Date(),
      time: "09:30",
      repeat: "Every Thursday"
    },
    {
      message:
        "Hey Riya, just checking in on your journaling habit this week. Let me  know how it's going , Have you had at least 3 deep-breath moments today?”",
      date: new Date(),
      time: "10:30",
      repeat: "Every Thursday"
    },
    {
      message:
        "Hey Riya, just checking in on your journaling habit this week. Let me  know how it's going , Have you had at least 3 deep-breath moments today?”",
      date: new Date(),
      time: "11:30",
      repeat: "Every Thursday"
    }
  ]);

  return (
    <div className="mt-5 max-md:w-[95vw] max-md:overflow-auto scrollbar-hide max-[480px]:!w-[93vw]">
      <Table className="">
        <TableHeader className="bg-gray-100 ">
          <TableRow className="border-none rounded-sm">
            <TableHead className="text-xs text-gray-500 max-md:min-w-[300px]">
              Messages
            </TableHead>
            <TableHead className="text-xs text-gray-500">Date</TableHead>
            <TableHead className="text-xs text-gray-500">Time</TableHead>
            <TableHead className="text-xs text-gray-500">Repeat</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {scheduledList.length > 0 ? (
            scheduledList.map((message, index) => (
              <TableRow
                key={index}
                onClick={() => {
                  setShowScheduledModal(true);
                  setSelectedMessage(message);
                }}
                className="cursor-pointer"
              >
                <TableCell className="font-medium py-4 text-gray-700 text-sm leading-6 max-w-[300px] whitespace-normal">
                  {message.message}
                </TableCell>
                <TableCell className="py-4.5 text-sm text-gray-600">
                  {moment(message.date).format("DD-MM-YYYY")}
                </TableCell>
                <TableCell className="py-4.5 text-sm text-gray-600">
                  {moment(message.time, "HH:mm").format("hh:mm A")}
                </TableCell>
                <TableCell className="py-4.5 text-sm text-gray-600">
                  {message.repeat}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <EmptyTable message="No documents found" colSpan={5} />
          )}
        </TableBody>
      </Table>
      <Dialog open={showScheduledModal} onOpenChange={setShowScheduledModal}>
        <ScheduleMessageModal selectedMessage={selectedMessage} />
      </Dialog>
    </div>
  );
}

export default ScheduledTable;
