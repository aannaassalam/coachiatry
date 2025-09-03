import React from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { Card } from "@/components/ui/card";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 inline-flex flex-col gap-1.5">
        <Navbar />
        <Card className="flex-1 inline-flex flex-col gap-0 border-gray-200 border-r-0 border-b-0 rounded-none rounded-tl-xl p-7">
          {children}
        </Card>
      </div>
    </div>
  );
}
