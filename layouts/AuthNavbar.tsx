import { Button } from "@/components/ui/button";
import assets from "@/json/assets";
import Logo from "@/ui/Logo/Logo";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";

export default function AuthNavbar() {
  const router = useRouter();

  return (
    <div className="px-12 py-5 flex gap-5 justify-between items-center border-b border-gray-300 max-sm:px-4">
      <Logo />
      <div className="flex items-center justify-between gap-4">
        <p className="max-sm:hidden">
          {router.pathname.includes("/auth/register")
            ? "Already have account?"
            : "Don't have account?"}
        </p>
        <Button asChild className="!w-auto">
          <Link
            href={
              router.pathname.includes("/auth/register")
                ? "/auth/login"
                : "/auth/register"
            }
          >
            {router.pathname.includes("/auth/register") ? "Sign In" : "Sign Up"}
          </Link>
        </Button>
      </div>
    </div>
  );
}
