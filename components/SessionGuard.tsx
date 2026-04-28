"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export function SessionGuard({ children }: { children: React.ReactNode }) {
  const { status, update } = useSession();
  const router = useRouter();
  const refreshedOnceRef = useRef(false);

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

  if (status === "loading") return null;

  return <>{children}</>;
}
