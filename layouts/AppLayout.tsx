import React from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function AppLayout({
  children,
  isPaddingBottom
}: {
  children: React.ReactNode;
  isPaddingBottom?: boolean;
}) {
  return (
    <div className="h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 inline-flex flex-col gap-1.5 min-h-0">
        <Navbar />
        <Card
          className={cn(
            "flex-1 inline-flex flex-col gap-0 border-gray-200 border-r-0 border-b-0 rounded-none rounded-tl-xl p-7 min-h-0",
            !isPaddingBottom && "pb-0"
          )}
        >
          {children}
        </Card>
      </div>
    </div>
  );
}
