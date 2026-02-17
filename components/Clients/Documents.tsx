import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  getAllDocumentsByCoach,
  getDocument
} from "@/external-api/functions/document.api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ellipsis } from "lucide-react";
import moment from "moment";
import { useParams } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import { useState } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import DocumentSheet from "./DocumentSheet";

function Documents() {
  const { userId } = useParams();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useQueryState(
    "document",
    parseAsString.withDefault("")
  );

  const { data = { data: [] }, isLoading } = useQuery({
    queryKey: ["documents", userId],
    queryFn: () =>
      getAllDocumentsByCoach({
        sort: "latest",
        tab: "all",
        userId: userId as string
      }),
    enabled: !!userId
  });

  const prefetchOnMouseEnter = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: ["documents", id],
      queryFn: () => getDocument(id),
      staleTime: 5 * 60 * 1000
    });
  };

  return (
    <div className="mt-1 max-md:w-[95vw] max-md:overflow-hidden scrollbar-hide max-[480px]:!w-[93vw]">
      <div className="w-full flex items-center justify-end mb-4">
        <Button
          onClick={() => {
            setSelectedDocument(null);
            setIsOpen(true);
          }}
        >
          Create Doc
        </Button>
      </div>
      <Table className="max-md:w-[95vw] !max-md:overflow-auto scrollbar-hide max-[480px]:!w-[93vw]">
        <TableHeader className="bg-gray-100">
          <TableRow className="border-none">
            <TableHead className="text-xs text-gray-500">Name</TableHead>
            <TableHead className="text-xs text-gray-500">Tags</TableHead>
            <TableHead className="text-xs text-gray-500">Date</TableHead>
            <TableHead className="text-xs text-gray-500 rounded-r-md">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <>
              <TableRow className="border-b-0 hover:bg-transparent">
                <TableCell colSpan={4} className="p-0 pt-1.5">
                  <div className="h-16 w-full rounded-md bg-gray-200/80 animate-pulse" />
                </TableCell>
              </TableRow>
              <TableRow className="border-b-0 hover:bg-transparent">
                <TableCell colSpan={4} className="p-0 pt-1.5">
                  <div className="h-16 w-full rounded-md bg-gray-200/80 animate-pulse" />
                </TableCell>
              </TableRow>
              <TableRow className="border-b-0 hover:bg-transparent">
                <TableCell colSpan={4} className="p-0 pt-1.5">
                  <div className="h-16 w-full rounded-md bg-gray-200/80 animate-pulse" />
                </TableCell>
              </TableRow>
              <TableRow className="border-b-0 hover:bg-transparent">
                <TableCell colSpan={4} className="p-0 pt-1.5">
                  <div className="h-16 w-full rounded-md bg-gray-200/80 animate-pulse" />
                </TableCell>
              </TableRow>
              <TableRow className="border-b-0 hover:bg-transparent">
                <TableCell colSpan={4} className="p-0 pt-1.5">
                  <div className="h-16 w-full rounded-md bg-gray-200/80 animate-pulse" />
                </TableCell>
              </TableRow>
            </>
          ) : data?.data.length > 0 ? (
            data?.data.map((document, index) => (
              <TableRow key={index}>
                <TableCell
                  className="font-medium text-sm leading-5 cursor-pointer"
                  onClick={() => setSelectedDocument(document._id)}
                  onMouseEnter={() => prefetchOnMouseEnter(document._id)}
                >
                  {document.title}
                </TableCell>
                <TableCell className="py-3.5">
                  <Badge
                    className="rounded-full py-0.5 px-2 flex items-center gap-1.5 font-archivo font-medium text-xs leading-4.5"
                    style={{
                      backgroundColor: document?.tag?.color.bg,
                      color: document?.tag?.color.text
                    }}
                  >
                    <div
                      className="size-1.5 rounded-full"
                      style={{
                        backgroundColor: document.tag?.color.text
                      }}
                    ></div>
                    {document.tag?.title}
                  </Badge>
                </TableCell>
                <TableCell className="py-3.5 text-sm text-gray-600">
                  {moment(document.createdAt).format("DD-MM-YYYY")}
                </TableCell>
                <TableCell className="py-3.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:bg-secondary"
                  >
                    <Ellipsis className="text-gray-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-gray-500">
                No documents found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <DocumentSheet
        open={!!selectedDocument || isOpen}
        onOpenChange={() => {
          setSelectedDocument(null);
          setIsOpen(false);
        }}
        documentId={selectedDocument}
        key="coach"
      />
    </div>
  );
}

export default Documents;
