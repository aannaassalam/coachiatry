import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip";
import {
  deleteTranscriptionByCoach,
  getAllTranscriptionsByCoach
} from "@/external-api/functions/transcriptions.api";
import { useDebounce } from "@/hooks/utils/useDebounce";
import { createPageRange } from "@/lib/functions/_helpers.lib";
import { Transcription } from "@/typescript/interface/transcription.interface";
import { useMutation, useQuery } from "@tanstack/react-query";
import { FileText, Search, Trash2 } from "lucide-react";
import moment from "moment";
import { motion } from "motion/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import DeleteDialog from "../DeleteDialog";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "../ui/pagination";
import { SmartAvatar } from "../ui/smart-avatar";

const TranscriptionItem = ({
  transcription,
  page
}: {
  transcription: Transcription;
  page: number;
}) => {
  const { userId } = useParams();
  const [isHovered, setIsHovered] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: deleteTranscriptionByCoach,
    meta: {
      invalidateQueries: ["transcriptions", page, userId]
    }
  });

  return (
    <label
      key={transcription._id}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="overflow-hidden flex cursor-pointer items-center justify-between w-full rounded-lg hover:bg-gray-50 border-1 border-gray-50 px-4 py-2.5 transition-colors group"
    >
      {/* Left section */}
      <div className="flex items-center gap-3 transition-all duration-200">
        {/* <Checkbox
                    className={cn(
                      "w-4 h-4 mr-4 group-hover:mr-1 transition-all duration-200",
                      isSelected && "mr-1"
                    )}
                    onClick={() => handleSelect(transcription._id)}
                  /> */}
        <SmartAvatar
          src={transcription.user.photo}
          name={transcription.user.fullName}
          className="size-8"
        />
        <div className="flex flex-col">
          <span className="text-sm font-medium font-lato text-gray-900">
            {transcription.title}
          </span>
          <span className="text-sm font-lato text-gray-500">
            {moment(transcription.createdAt).format("MMMM D, YYYY")}
          </span>
        </div>
      </div>
      {/* Right actions */}

      <motion.div
        animate={{
          right: isHovered ? 0 : -100,
          opacity: isHovered ? 1 : 0
        }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="flex items-center text-gray-500 relative"
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href={`/transcripts/${transcription._id}`}>
              <Button variant="ghost" className="px-2 hover:text-gray-700">
                <FileText className="w-4 h-4" />
              </Button>
            </Link>
          </TooltipTrigger>
          <TooltipContent>View Transcript</TooltipContent>
        </Tooltip>
        <DeleteDialog
          onDelete={() => mutate(transcription._id)}
          isLoading={isPending}
        >
          <Button variant="ghost" className="px-2 hover:text-red-600">
            <Trash2 className="w-4 h-4" />
          </Button>
        </DeleteDialog>
      </motion.div>
    </label>
  );
};

function Transcriptions() {
  const { userId } = useParams();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useQuery({
    queryKey: ["transcriptions", page, userId, debouncedSearch],
    queryFn: () =>
      getAllTranscriptionsByCoach({
        page,
        userId: userId as string,
        search: debouncedSearch
      })
  });

  const goToPage = (p: number) => {
    if (p < 1 || (data?.meta.totalPages && p > data?.meta.totalPages)) return;
    setPage(p);
  };

  const pageNumbers = createPageRange(1, data?.meta?.totalPages ?? 0, page);

  return (
    <div className="px-2 my-2">
      <div className="bg-white flex items-center pl-2.5 border-1 border-gray-200 rounded-lg w-[250px] max-sm:w-full">
        <Search className="text-gray-500 size-4.5 mr-2" />
        <input
          type="text"
          className="py-2.5 pl-1 pr-2 text-gray-900 placeholder:text-gray-500 font-lato text-sm outline-none "
          placeholder="Search List"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <p className="font-lato font-semibold text-base mt-3">Meetings</p>
      <div className="flex flex-col gap-3 mt-4">
        {isLoading ? (
          <>
            <div className="h-15.5 w-full rounded-md bg-gray-200/80 animate-pulse" />
            <div className="h-15.5 w-full rounded-md bg-gray-200/80 animate-pulse" />
            <div className="h-15.5 w-full rounded-md bg-gray-200/80 animate-pulse" />
            <div className="h-15.5 w-full rounded-md bg-gray-200/80 animate-pulse" />
            <div className="h-15.5 w-full rounded-md bg-gray-200/80 animate-pulse" />
          </>
        ) : data?.data && data?.data?.length > 0 ? (
          data?.data?.map((transcription) => (
            <TranscriptionItem
              key={transcription._id}
              transcription={transcription}
              page={page}
            />
          ))
        ) : (
          <div className="flex items-center w-full justify-center">
            <span className="italic text-gray-500">
              No transcriptions found
            </span>
          </div>
        )}
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
      </div>
    </div>
  );
}

export default Transcriptions;
