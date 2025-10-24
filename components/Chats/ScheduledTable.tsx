import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { getScheduleMessages } from "@/external-api/functions/message.api";
import { ChatConversation } from "@/typescript/interface/chat.interface";
import { Message } from "@/typescript/interface/message.interface";
import { useQuery } from "@tanstack/react-query";
import moment from "moment";
import { parseAsInteger, useQueryState } from "nuqs";
import { useState } from "react";
import EmptyTable from "../Table/EmptyTable";
import { Dialog } from "../ui/dialog";
import ScheduleMessageModal from "./ScheduleModal";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "../ui/pagination";
import { createPageRange } from "@/lib/functions/_helpers.lib";

function ScheduledTable() {
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [showScheduledModal, setShowScheduledModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<
    (Omit<Message, "chat"> & { chat: ChatConversation }) | null
  >(null);

  const { data, isLoading } = useQuery({
    queryKey: ["scheduled-messages", page],
    queryFn: () => getScheduleMessages({ page })
  });

  const goToPage = (p: number) => {
    if (p < 1 || (data?.meta.totalPages && p > data?.meta.totalPages)) return;
    setPage(p);
  };

  const pageNumbers = createPageRange(1, data?.meta?.totalPages ?? 0, page);

  return (
    <div className="mt-5 max-md:w-[95vw] max-md:overflow-auto scrollbar-hide max-[480px]:!w-[93vw]">
      <Table className="">
        <TableHeader className="bg-gray-100 ">
          <TableRow className="border-none rounded-sm">
            <TableHead className="text-xs text-gray-500 max-md:min-w-[300px]">
              Messages
            </TableHead>
            <TableHead className="text-xs text-gray-500">To</TableHead>
            <TableHead className="text-xs text-gray-500">Date</TableHead>
            <TableHead className="text-xs text-gray-500">Time</TableHead>
            <TableHead className="text-xs text-gray-500">Repeat</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <>
              <TableRow className="border-b-0 hover:bg-transparent">
                <TableCell colSpan={5} className="p-0 pt-1.5">
                  <div className="h-14 w-full rounded-md bg-gray-200/80 animate-pulse" />
                </TableCell>
              </TableRow>
              <TableRow className="border-b-0 hover:bg-transparent">
                <TableCell colSpan={5} className="p-0 pt-1.5">
                  <div className="h-14 w-full rounded-md bg-gray-200/80 animate-pulse" />
                </TableCell>
              </TableRow>
              <TableRow className="border-b-0 hover:bg-transparent">
                <TableCell colSpan={5} className="p-0 pt-1.5">
                  <div className="h-14 w-full rounded-md bg-gray-200/80 animate-pulse" />
                </TableCell>
              </TableRow>
              <TableRow className="border-b-0 hover:bg-transparent">
                <TableCell colSpan={5} className="p-0 pt-1.5">
                  <div className="h-14 w-full rounded-md bg-gray-200/80 animate-pulse" />
                </TableCell>
              </TableRow>
              <TableRow className="border-b-0 hover:bg-transparent">
                <TableCell colSpan={5} className="p-0 pt-1.5">
                  <div className="h-14 w-full rounded-md bg-gray-200/80 animate-pulse" />
                </TableCell>
              </TableRow>
            </>
          ) : !!data?.data.length ? (
            data.data.map((message, index) => {
              const friend = message.chat.members.find(
                (_member) => _member?.user?._id !== message.sender?._id
              );
              return (
                <TableRow
                  key={index}
                  onClick={() => {
                    setShowScheduledModal(true);
                    setSelectedMessage(message);
                  }}
                  className="cursor-pointer"
                >
                  <TableCell className="font-medium py-4 text-gray-700 text-sm leading-6 max-w-[300px] whitespace-normal">
                    {message.content}
                  </TableCell>
                  <TableCell className="font-medium py-4 text-gray-700 text-sm leading-6 max-w-[300px] whitespace-normal">
                    {message.chat.type === "group"
                      ? message.chat.name
                      : friend?.user?.fullName}
                  </TableCell>
                  <TableCell className="py-4.5 text-sm text-gray-600">
                    {moment(message.scheduledAt).format("DD-MM-YYYY")}
                  </TableCell>
                  <TableCell className="py-4.5 text-sm text-gray-600">
                    {moment(message.scheduledAt).format("hh:mm A")}
                  </TableCell>
                  <TableCell className="py-4.5 text-sm text-gray-600">
                    {message.repeat}
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <EmptyTable message="No scheduled messages found" colSpan={5} />
          )}
        </TableBody>
      </Table>

      {data?.meta?.totalPages && data?.meta?.totalPages > 1 ? (
        <Pagination className="mt-10 justify-center">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  goToPage(page - 1);
                }}
                aria-disabled={page <= 1}
              />
            </PaginationItem>

            {pageNumbers.map((num, i) => (
              <PaginationItem key={i}>
                {num === "…" ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink
                    href="#"
                    isActive={num === page}
                    onClick={(e) => {
                      e.preventDefault();
                      goToPage(Number(num));
                    }}
                  >
                    {num}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  goToPage(page + 1);
                }}
                aria-disabled={page >= data?.meta.totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}

      <Dialog open={showScheduledModal} onOpenChange={setShowScheduledModal}>
        <ScheduleMessageModal
          selectedMessage={{
            _id: selectedMessage?._id ?? "",
            message: selectedMessage?.content || "",
            date: new Date(selectedMessage?.scheduledAt || ""),
            time: moment(selectedMessage?.scheduledAt).format("HH:mm"),
            repeat: selectedMessage?.repeat ?? "none"
          }}
          receiverName={
            selectedMessage?.chat?.name ??
            selectedMessage?.chat.members.find(
              (_member) => _member?.user?._id !== selectedMessage.sender?._id
            )?.user?.fullName ??
            ""
          }
          onClose={() => setShowScheduledModal(false)}
          editing
        />
      </Dialog>
    </div>
  );
}

export default ScheduledTable;
