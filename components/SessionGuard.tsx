"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

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

  // Safety valve: if the first session resolve stays stuck in "loading" (e.g.
  // /api/auth/session erroring), stop blocking after a short delay so the user
  // never gets trapped on a permanent blank screen.
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/login");
      return;
    }
    if (status === "authenticated" && !refreshedOnceRef.current) {
      refreshedOnceRef.current = true;
      update();
    }
  }, [status, router, update]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const id = setInterval(() => update(), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [status, update]);

  useEffect(() => {
    if (status === "loading" && !hasResolvedRef.current) {
      const id = setTimeout(() => setLoadingTimedOut(true), 8000);
      return () => clearTimeout(id);
    }
  }, [status]);

  // Only block render on the very first session resolve. After that, every
  // transient "loading" (from update(), refetchInterval, focus refetch)
  // keeps showing children to avoid the navigation flash.
  if (status === "loading" && !hasResolvedRef.current && !loadingTimedOut) {
    return null;
  }

  return <>{children}</>;
}
