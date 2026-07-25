import React, { useCallback, useEffect, useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { SessionGuard } from "@/components/SessionGuard";
import NotificationBanner from "@/components/NotificationBanner";

const SIDEBAR_COLLAPSED_KEY = "sidebar:collapsed";

/** Kept in sync with the widths applied to the Sidebar root. */
const SIDEBAR_WIDTH = "312px";
const SIDEBAR_WIDTH_COLLAPSED = "76px";

export default function AppLayout({
  children,
  isPaddingBottom
}: {
  children: React.ReactNode;
  isPaddingBottom?: boolean;
}) {
  const [navopen, setNavOpen] = useState(false);
  // Desktop-only collapse. Starts expanded so SSR and the first client render
  // agree; the stored preference is applied right after mount.
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true");
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(!prev));
      return !prev;
    });
  }, []);

  return (
    <SessionGuard>
      <div
        style={
          {
            "--sidebar-width": collapsed
              ? SIDEBAR_WIDTH_COLLAPSED
              : SIDEBAR_WIDTH
          } as React.CSSProperties
        }
        className={cn(
          "h-screen bg-background flex overflow-hidden max-lg:h-auto max-lg:min-h-screen",
          !isPaddingBottom && "max-lg:h-screen"
        )}
      >
        <Sidebar
          navOpen={navopen}
          setNavOpen={setNavOpen}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapsed}
        />
        {/* min-w-0 lets this column shrink below its content width, so inner
            containers (e.g. the tasks table) own their horizontal scroll
            instead of pushing the whole page wider than the viewport. */}
        <div className="flex-1 min-w-0 inline-flex flex-col gap-1.5 min-h-0">
          <Navbar navOpen={navopen} setNavOpen={setNavOpen} />
          <Card
            className={cn(
              "flex-1 overflow-y-auto inline-flex flex-col gap-0 border-gray-200 border-r-0 border-b-0 rounded-none rounded-tl-xl p-7 max-sm:p-4 min-h-0 max-lg:rounded-tl-none",
              !isPaddingBottom && "pb-0"
            )}
          >
            <NotificationBanner />
            {children}
          </Card>
        </div>
      </div>
    </SessionGuard>
  );
}
