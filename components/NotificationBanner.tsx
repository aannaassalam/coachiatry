"use client";

import { initWebPush } from "@/lib/fcm";
import { cn } from "@/lib/utils";
import { Bell, BellOff, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";

type Perm = NotificationPermission | "unsupported";

const DISMISS_KEY = "notif_banner_dismissed";

/**
 * Thin, dismissible banner that nudges users to turn on web notifications, and
 * — crucially — explains when they're blocked. It only surfaces the cases the
 * app can actually detect and act on:
 *   - "default"  → never asked: offer an Enable button (requests + registers).
 *   - "denied"   → blocked at the browser level: tell them how to re-enable.
 * When permission is "granted" the banner stays hidden. Note the browser API
 * can't tell us when notifications are muted at the OS level (macOS System
 * Settings / Focus) while the site permission is "granted" — that case is
 * undetectable, so we can't warn about it here.
 *
 * Dismissal is remembered per permission-state, so flipping the permission (or
 * a fresh block) re-surfaces the relevant message instead of staying hidden.
 */
export default function NotificationBanner() {
  const [perm, setPerm] = useState<Perm | null>(null);
  const [dismissedFor, setDismissedFor] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setPerm("unsupported");
      return;
    }

    setPerm(Notification.permission);
    setDismissedFor(localStorage.getItem(DISMISS_KEY));

    // React live to permission changes (e.g. user un-blocks in site settings)
    // so the banner updates without a reload.
    let status: PermissionStatus | null = null;
    const onChange = () => setPerm(Notification.permission);
    navigator.permissions
      ?.query({ name: "notifications" as PermissionName })
      .then((s) => {
        status = s;
        status.addEventListener("change", onChange);
      })
      .catch(() => {});

    return () => status?.removeEventListener("change", onChange);
  }, []);

  const dismiss = () => {
    if (perm && perm !== "unsupported") {
      localStorage.setItem(DISMISS_KEY, perm);
      setDismissedFor(perm);
    }
  };

  const enable = async () => {
    setBusy(true);
    try {
      const token = await initWebPush();
      // initWebPush requests permission internally; reflect the result.
      setPerm(Notification.permission);
      if (!token && Notification.permission !== "granted") {
        toast.error("Notifications weren't enabled", {
          description:
            "Your browser blocked the request. You can allow them from the site settings."
        });
      }
    } finally {
      setBusy(false);
    }
  };

  // Nothing to show: unsupported, granted, still loading, or already dismissed
  // for the current permission state.
  if (
    perm === null ||
    perm === "unsupported" ||
    perm === "granted" ||
    dismissedFor === perm
  ) {
    return null;
  }

  const denied = perm === "denied";

  return (
    <div
      className={cn(
        "mb-4 flex items-center gap-3 rounded-lg border px-4 py-2.5 text-sm max-sm:px-3",
        denied
          ? "border-amber-200 bg-amber-50 text-amber-800"
          : "border-indigo-100 bg-indigo-50 text-indigo-700"
      )}
    >
      {denied ? (
        <BellOff size={18} className="shrink-0 text-amber-500" />
      ) : (
        <Bell size={18} className="shrink-0 text-indigo-500" />
      )}

      <p className="flex-1 leading-5">
        {denied ? (
          <>
            <span className="font-medium">Notifications are blocked.</span> To
            get alerts for new messages, allow notifications for this site in
            your browser&apos;s address-bar site settings, then reload.
          </>
        ) : (
          <>
            <span className="font-medium">Turn on notifications</span> to get
            alerted about new messages even when this tab isn&apos;t open.
          </>
        )}
      </p>

      {!denied && (
        <Button
          size="sm"
          onClick={enable}
          disabled={busy}
          className="shrink-0 whitespace-nowrap"
        >
          {busy ? "Enabling…" : "Enable notifications"}
        </Button>
      )}

      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className={cn(
          "shrink-0 rounded-md p-1 transition-colors",
          denied ? "hover:bg-amber-100" : "hover:bg-indigo-100"
        )}
      >
        <X size={16} />
      </button>
    </div>
  );
}
