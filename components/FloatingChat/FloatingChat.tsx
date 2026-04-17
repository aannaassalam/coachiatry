"use client";

import { useFloatingChat } from "@/lib/floatingChatContext";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import FloatingChatLauncher from "./FloatingChatLauncher";
import FloatingChatPanel from "./FloatingChatPanel";

const HIDDEN_PATH_PREFIXES = ["/auth", "/chat"];

export default function FloatingChat() {
  const { status } = useSession();
  const router = useRouter();
  const { isOpen } = useFloatingChat();

  if (status !== "authenticated") return null;
  if (HIDDEN_PATH_PREFIXES.some((p) => router.pathname.startsWith(p))) {
    return null;
  }

  return isOpen ? <FloatingChatPanel /> : <FloatingChatLauncher />;
}
