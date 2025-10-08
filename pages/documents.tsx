const DocumentSheet = dynamic(() => import("@/components/DocumentSheet"), {
  ssr: false
});
import DeleteDialog from "@/components/DeleteDialog";
import EmptyTable from "@/components/Table/EmptyTable";
import { RenderTableSortingIcon } from "@/components/Tasks/TasksTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  deleteDocument,
  getAllDocuments
} from "@/external-api/functions/document.api";
import AppLayout from "@/layouts/AppLayout";
import { cn } from "@/lib/utils";
import { Document } from "@/typescript/interface/document.interface";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Ellipsis, Trash } from "lucide-react";
import moment from "moment";
import dynamic from "next/dynamic";
import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs";
import { useState } from "react";

const DocumentTagColorMap: Record<string, Record<string, string>> = {
  Goals: {
    bg: "bg-amber-200/40",
    text: "text-amber-600/80",
    dotColor: "bg-amber-600/80"
  },
  Therapy: {
    bg: "bg-gray-200/70",
    text: "text-primary",
    dotColor: "bg-primary"
  },
  "Weekly Summaries": {
    bg: "bg-gray-200/70",
    text: "text-primary",
    dotColor: "bg-primary"
  },
  Weekly: {
    bg: "bg-green-100",
    text: "text-green-600/90",
    dotColor: "bg-green-600/90"
  },
  Contract: {
    text: "text-red-600/80",
    bg: "bg-red-100/80",
    dotColor: "bg-red-600/80"
  }
};

export const DocumentsTable = ({
  documents,
  setSelectedDocument,
  isLoading
}: {
  documents: Document[];
  setSelectedDocument: (doc: Document) => void;
  isLoading: boolean;
}) => {
  const { mutate, isPending } = useMutation({
    mutationFn: deleteDocument,
    meta: {
      invalidateQueries: ["documents"]
    }
  });

  return (
    <div className="mt-5 max-md:w-[95vw] max-md:overflow-auto scrollbar-hide max-[480px]:!w-[93vw]">
      <Table>
        <TableHeader className="bg-gray-100">
          <TableRow className="border-none">
            <TableHead className="rounded-l-md text-gray-500 min-w-[200px] max-md:min-w-[100px] max-md:max-w-[250px]">
              <div className="w-full flex items-center group text-xs pl-1.5">
                Name
                <RenderTableSortingIcon name="title" />
              </div>
            </TableHead>
            <TableHead className="text-xs text-gray-500">Tags</TableHead>
            <TableHead className="text-xs text-gray-500 flex items-center group">
              Date
              <RenderTableSortingIcon name="createdAt" />
            </TableHead>
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
          ) : documents.length > 0 ? (
            documents.map((document) => (
              <TableRow key={document._id}>
                <TableCell
                  className="font-medium text-sm leading-5 cursor-pointer pl-4"
                  onClick={() => setSelectedDocument(document)}
                >
                  {document.title}
                </TableCell>
                <TableCell className="py-3.5">
                  <Badge
                    className={cn(
                      "rounded-full py-0.5 px-2 flex items-center gap-1.5 font-archivo font-medium text-xs leading-4.5",
                      DocumentTagColorMap["Goals"].bg,
                      DocumentTagColorMap["Goals"].text
                    )}
                  >
                    <div
                      className={cn(
                        "size-1.5 rounded-full",
                        DocumentTagColorMap["Goals"].dotColor
                      )}
                    ></div>
                    {document.tag}
                  </Badge>
                </TableCell>
                <TableCell className="py-3.5 text-sm text-gray-600">
                  {moment(document.createdAt).format("DD-MM-YYYY")}
                </TableCell>
                <TableCell className="py-4.5">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:bg-secondary"
                      >
                        <Ellipsis className="text-gray-500" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-1 w-30" collisionPadding={20}>
                      {/* <Button
                        variant="ghost"
                        size="sm"
                        className="cursor-pointer flex items-center gap-2 w-full [&>span]:justify-start"
                        onClick={() => {
                          setSelectedDocument(document);
                        }}
                      >
                        <Pencil />
                        Edit
                      </Button> */}
                      <DeleteDialog
                        onDelete={() => mutate(document._id)}
                        isLoading={isPending}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className="cursor-pointer flex items-center gap-2 w-full text-red-500 hover:text-red-500 hover:bg-red-50 [&>span]:justify-start"
                        >
                          <Trash />
                          Delete
                        </Button>
                      </DeleteDialog>
                    </PopoverContent>
                  </Popover>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <EmptyTable message="No documents found" colSpan={5} />
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default function Documents() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null
  );

  const [sort] = useQueryState(
    "sort",
    parseAsArrayOf(parseAsString.withDefault("")).withDefault([])
  );

  const { data = { data: [] }, isLoading } = useQuery({
    queryKey: ["documents", sort],
    queryFn: () => getAllDocuments({ sort: sort.join(",") })
  });

  return (
    <AppLayout>
      <DocumentSheet
        open={isOpen}
        onOpenChange={(toggle) => {
          setIsOpen(toggle);
        }}
        documentId={selectedDocument?._id ?? ""}
      />
      <div>
        <div className="flex items-center justify-between gap-5 mb-4">
          <h1 className="font-semibold text-gray-900 text-2xl leading-7 tracking-[-3%]">
            Documents
          </h1>
          <Button
            onClick={() => {
              setSelectedDocument(null);
              setIsOpen(true);
            }}
          >
            Create Doc
          </Button>
        </div>
        <div>
          <DocumentsTable
            documents={data.data}
            setSelectedDocument={(doc: Document) => {
              setIsOpen(true);
              setSelectedDocument(doc);
            }}
            isLoading={isLoading}
          />
        </div>
      </div>
    </AppLayout>
  );
}
