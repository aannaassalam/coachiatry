import { cn } from "@/lib/utils";
import React from "react";
import AuthNavbar from "./AuthNavbar";

export default function AuthLayout({
  children,
  className = ""
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <AuthNavbar />
      <div className={cn("flex-1 bg-auth", className)}>{children}</div>
    </div>
  );
}
