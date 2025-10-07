import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Checkbox } from "../ui/checkbox";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";
import moment from "moment";
import { Button } from "../ui/button";
import { Ellipsis } from "lucide-react";

// Dummy data
const dummyDocuments = [
  {
    title: "Therapy Progress Report",
    tag: "Therapy",
    createdAt: "2025-10-01"
  },
  {
    title: "Client Goals Overview",
    tag: "Goals",
    createdAt: "2025-09-28"
  },
  {
    title: "Weekly Summary - Week 3",
    tag: "Weekly",
    createdAt: "2025-09-21"
  },
  {
    title: "Service Contract Agreement",
    tag: "Contract",
    createdAt: "2025-09-15"
  },
  {
    title: "Weekly Summary - Week 2",
    tag: "Weekly Summaries",
    createdAt: "2025-09-07"
  }
];

function Documents() {
  const [documents] = useState(dummyDocuments);

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

  return (
    <div className="mt-1">
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
                <TableCell className="py-3.5">
                  <Checkbox className="bg-white" />
                </TableCell>
                <TableCell
                  className="font-medium text-sm leading-5 cursor-pointer"
                  //   onClick={() => setSelectedDocument(document)}
                >
                  {document.title}
                </TableCell>
                <TableCell className="py-3.5">
                  <Badge
                    className={cn(
                      "rounded-full py-0.5 px-2 flex items-center gap-1.5 font-archivo font-medium text-xs leading-4.5",
                      DocumentTagColorMap[document.tag]?.bg || "bg-gray-100",
                      DocumentTagColorMap[document.tag]?.text || "text-gray-600"
                    )}
                  >
                    <div
                      className={cn(
                        "size-1.5 rounded-full",
                        DocumentTagColorMap[document.tag]?.dotColor ||
                          "bg-gray-400"
                      )}
                    ></div>
                    {document.tag}
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
    </div>
  );
}

export default Documents;
