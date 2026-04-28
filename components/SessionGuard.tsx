"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export function SessionGuard({ children }: { children: React.ReactNode }) {
  const { data, status, update } = useSession();
  const router = useRouter();
  const refreshedOnceRef = useRef(false);
  // Once we've successfully resolved the session at least once we should keep
  // the UI rendered even while next-auth refetches in the background — the
  // data is still valid, and blanking the screen on each route change /
  // refetchInterval tick is what users perceive as a "blank screen between
  // pages."
  const hasResolvedRef = useRef(false);
  if (data) hasResolvedRef.current = true;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/login");
      return;
    }
    // The JWT carries a snapshot of the user at sign-in time, so values like
    // shareId/role can drift after a server-side change. Trigger one update()
    // per mount so the JWT callback re-fetches the profile and the cached
    // useSession data reflects the latest server state.
    if (status === "authenticated" && !refreshedOnceRef.current) {
      refreshedOnceRef.current = true;
      update();
    }
  }, [status, router, update]);

  // Only block render on the very first session resolve. After that, every
  // transient "loading" (from update(), refetchInterval, focus refetch)
  // keeps showing children to avoid the navigation flash.
  if (status === "loading" && !hasResolvedRef.current) return null;

  return <>{children}</>;
}
