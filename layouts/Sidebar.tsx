import { Separator } from "@/components/ui/separator";
import { SmartAvatar } from "@/components/ui/smart-avatar";
import sideLinks from "@/config/sidelinks";
import { getAllWatching } from "@/external-api/functions/user.api";
import assets from "@/json/assets";
import { cn } from "@/lib/utils";
import Logo from "@/ui/Logo/Logo";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useRouter } from "next/router";
import React from "react";

export default function Sidebar({
  navOpen,
  setNavOpen
}: {
  navOpen: boolean;
  setNavOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const router = useRouter();
  const { shareId } = useParams();
  const pathname = router.pathname;
  const { data: session } = useSession();

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname
      .replace("[shareId]", shareId?.toString() ?? "")
      .startsWith(href);
  };

  const { data = [], isLoading } = useQuery({
    queryKey: ["watchers"],
    queryFn: getAllWatching
  });

  return (
    <div
      className={cn(
        "w-[312px] shrink-0 min-h-screen p-4 space-y-4 max-lg:fixed max-lg:z-[1000] max-lg:bg-background max-lg:-left-100 transition-all duration-300",
        navOpen && " max-lg:left-0"
      )}
    >
      <div className="flex items-center justify-between">
        <Logo />
        <X
          className="lg:hidden text-primary cursor-pointer size-5"
          onClick={() => setNavOpen(false)}
        />
      </div>
      {sideLinks.map((links, index) => {
        return (
          <React.Fragment key={index}>
            <div>
              <p className="py-1.5 px-3 uppercase text-[10px] leading-3 tracking-[5%]">
                {links.title}
              </p>
              {links.links
                .filter((link) => {
                  if (link.title === "Clients" && !session) return false;
                  if (
                    link.title === "Clients" &&
                    session?.user?.role === "user"
                  )
                    return false;

                  return true;
                })
                .map((link, index) => {
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
      {data.length > 0 && (
        <>
          <Separator className="text-gray-200" />
          <p className="py-1.5 px-3 uppercase text-[10px] leading-3 tracking-[5%]">
            Watching
          </p>
        </>
      )}
      {data?.map((_user) => {
        const active = isActive(`/shared-tasks/${_user.shareId}`);
        return (
          <Link key={_user.shareId} href={`/shared-tasks/${_user.shareId}`}>
            <div
              className={cn(
                "cursor-pointer px-2 py-2.5 flex items-center gap-2 text-gray-500 rounded-md hover:bg-gray-200/60 transition-all",
                {
                  "bg-primary hover:bg-primary": active
                }
              )}
            >
              <SmartAvatar
                src={_user?.photo}
                name={_user?.fullName}
                className="size-5"
              />
              <p
                className={cn(
                  "capitalize text-sm leading-5 tracking-[0.05px]",
                  {
                    "text-white": active
                  }
                )}
              >
                {_user.fullName}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
