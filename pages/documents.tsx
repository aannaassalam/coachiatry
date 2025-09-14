const DocumentSheet = dynamic(() => import("@/components/DocumentSheet"), {
  ssr: false
});
import { getAllDocuments } from "@/api/functions/document.api";
import EmptyTable from "@/components/Table/EmptyTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import assets from "@/json/assets";
import AppLayout from "@/layouts/AppLayout";
import { cn } from "@/lib/utils";
import { Document } from "@/typescript/interface/document.interface";
import { useQuery } from "@tanstack/react-query";
import { Ellipsis, ListFilter } from "lucide-react";
import moment from "moment";
import dynamic from "next/dynamic";
import Image from "next/image";
import { parseAsString, useQueryState } from "nuqs";
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

const DocumentsTable = ({
  documents,
  setSelectedDocument
}: {
  documents: Document[];
  setSelectedDocument: (doc: Document) => void;
}) => {
  return (
    <div className="mt-5">
      <Table>
        <TableHeader className="bg-gray-100">
          <TableRow className="border-none">
            <TableHead className="rounded-l-md">
              <Checkbox className="bg-white" />
            </TableHead>
            <TableHead className="text-xs text-gray-500">Name</TableHead>
            <TableHead className="text-xs text-gray-500">Tags</TableHead>
            <TableHead className="text-xs text-gray-500">Date</TableHead>
            <TableHead className="text-xs text-gray-500 rounded-r-md">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.length > 0 ? (
            documents.map((document, index) => (
              <TableRow key={index}>
                <TableCell className="py-4.5">
                  <Checkbox className="bg-white" />
                </TableCell>
                <TableCell
                  className="font-medium text-sm leading-5 cursor-pointer"
                  onClick={() => setSelectedDocument(document)}
                >
                  {document.title}
                </TableCell>
                <TableCell className="py-4.5">
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
                <TableCell className="py-4.5 text-sm text-gray-600">
                  {moment(document.createdAt).format("DD-MM-YYYY")}
                </TableCell>
                <TableCell className="py-4.5">
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
            <EmptyTable message="No documents found" colSpan={5} />
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default function Documents() {
  const [tab, setTab] = useQueryState("tab", parseAsString.withDefault("all"));
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null
  );

  const { data = { data: [] } } = useQuery({
    queryKey: ["documents"],
    queryFn: getAllDocuments
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
        <Tabs value={tab} onValueChange={(value) => setTab(value)}>
          <div>
            <div className="flex items-center justify-between gap-5 pb-2">
              <TabsList className="h-auto">
                <TabsTrigger
                  value="all"
                  className="py-1.5 px-6 text-sm leading-5"
                >
                  All
                </TabsTrigger>
                <TabsTrigger
                  value="my_docs"
                  className="py-1.5 px-4 text-sm leading-5"
                >
                  My Docs
                </TabsTrigger>
                <TabsTrigger
                  value="shared"
                  className="py-1.5 px-4 text-sm leading-5"
                >
                  Shared
                </TabsTrigger>
                <TabsTrigger
                  value="archived"
                  className="py-1.5 px-4 text-sm leading-5"
                >
                  Archived
                </TabsTrigger>
              </TabsList>
              <div>
                <Button variant="ghost">
                  <Image
                    src={assets.icons.sort}
                    alt="sort"
                    width={18}
                    height={18}
                  />
                  Sort
                </Button>
                <Button variant="ghost">
                  <ListFilter />
                  Filter
                </Button>
              </div>
            </div>
            <Separator />
            <TabsContent value="all">
              <DocumentsTable
                documents={data.data}
                setSelectedDocument={(doc: Document) => {
                  setIsOpen(true);
                  setSelectedDocument(doc);
                }}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </AppLayout>
  );
}
