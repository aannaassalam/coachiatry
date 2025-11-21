import React, { useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { SocketProvider } from "@/lib/socketContext";

export default function AppLayout({
  children,
  isPaddingBottom
}: {
  children: React.ReactNode;
  isPaddingBottom?: boolean;
}) {
  const [navopen, setNavOpen] = useState(false);
  return (
    <SocketProvider>
      <div
        className={cn(
          "h-screen bg-background flex overflow-hidden max-lg:h-auto max-lg:min-h-screen",
          !isPaddingBottom && "max-lg:h-screen"
        )}
      >
        <Sidebar navOpen={navopen} setNavOpen={setNavOpen} />
        <div className="flex-1 inline-flex flex-col gap-1.5 min-h-0">
          <Navbar navOpen={navopen} setNavOpen={setNavOpen} />
          <Card
            className={cn(
              "flex-1 overflow-y-auto inline-flex flex-col gap-0 border-gray-200 border-r-0 border-b-0 rounded-none rounded-tl-xl p-7 max-sm:p-4 min-h-0 max-lg:rounded-tl-none",
              !isPaddingBottom && "pb-0"
            )}
          >
            {children}
          </Card>
        </div>
      </div>
    </SocketProvider>
  );
}
