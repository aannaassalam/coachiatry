import { Separator } from "@/components/ui/separator";
import sideLinks from "@/config/sidelinks";
import assets from "@/json/assets";
import { cn } from "@/lib/utils";
import Logo from "@/ui/Logo/Logo";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";

export default function Sidebar() {
  const router = useRouter();
  const pathname = router.pathname;
  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };
  return (
    <div className="w-[312px] shrink-0 min-h-screen p-4 space-y-4">
      <Logo />
      {sideLinks.map((links, index) => {
        return (
          <React.Fragment key={index}>
            <div>
              <p className="py-1.5 px-3 uppercase text-[10px] leading-3 tracking-[5%]">
                {links.title}
              </p>
              {links.links.map((link, index) => {
                const active = isActive(link.href);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "px-2 py-2.5 flex items-center gap-2 text-gray-500 rounded-md hover:bg-gray-200/60 transition-all",
                      {
                        "bg-primary hover:bg-primary": active
                      }
                    )}
                  >
                    <Image
                      src={link.icon}
                      alt="Dashboard"
                      width={20}
                      height={20}
                      className={cn({
                        "invert brightness-0": active
                      })}
                    />
                    <p
                      className={cn(
                        "capitalize text-sm leading-5 tracking-[0.05px]",
                        {
                          "text-white": active
                        }
                      )}
                    >
                      {link.title}
                    </p>
                  </Link>
                );
              })}
            </div>
            {index !== sideLinks.length - 1 && (
              <Separator className="text-gray-200" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
