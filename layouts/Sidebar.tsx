import { Separator } from "@/components/ui/separator";
import { SmartAvatar } from "@/components/ui/smart-avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip";
import sideLinks from "@/config/sidelinks";
import { getAllWatching } from "@/external-api/functions/user.api";
import assets from "@/json/assets";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { ChevronsLeft, X } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useRouter } from "next/router";
import React from "react";

/**
 * Wraps a collapsed sidebar row so its hidden label is still discoverable.
 * Only rendered when collapsed — Radix tooltips stay closed on touch, and the
 * mobile drawer always renders expanded anyway.
 */
function CollapsedLabel({
  label,
  collapsed,
  children
}: {
  label: string;
  collapsed?: boolean;
  children: React.ReactNode;
}) {
  if (!collapsed) return <>{children}</>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side="right"
        sideOffset={10}
        className="capitalize max-lg:hidden"
      >
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

export default function Sidebar({
  navOpen,
  setNavOpen,
  collapsed,
  onToggleCollapse
}: {
  navOpen: boolean;
  setNavOpen: React.Dispatch<React.SetStateAction<boolean>>;
  /** Desktop-only icon rail. The mobile drawer is always fully expanded. */
  collapsed?: boolean;
  onToggleCollapse?: () => void;
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

  const { data = [] } = useQuery({
    queryKey: ["watchers"],
    queryFn: getAllWatching
  });

  // Collapse-only classes are all lg:-scoped so the off-canvas drawer keeps its
  // full labels regardless of the desktop preference.
  // lg:gap-0 matters: the label stays in the flex flow at zero width, so the
  // row's 8px gap would otherwise count as content and push each icon 4px left
  // of the rail's centre line.
  const railRow =
    collapsed && "lg:mx-auto lg:size-10 lg:justify-center lg:px-0 lg:gap-0";
  // Labels collapse to zero width rather than display:none so they fade out in
  // step with the sidebar's width transition instead of popping. Expanding waits
  // out most of the width animation before fading them back in, so the text
  // never appears cramped against a rail that's still opening.
  const railLabel = collapsed
    ? "lg:w-0 lg:opacity-0 lg:overflow-hidden lg:ml-0"
    : "lg:delay-150";
  // Section headings can't collapse to zero width (they're their own row), so
  // they animate their height and padding away instead of switching to hidden.
  const railHeading = collapsed
    ? "lg:h-0 lg:py-0 lg:opacity-0 lg:overflow-hidden"
    : "lg:delay-150";
  const collapseLabel = collapsed ? "Expand sidebar" : "Collapse sidebar";

  return (
    <div
      className={cn(
        "flex flex-col w-[312px] shrink-0 min-h-screen p-4 space-y-4 max-lg:fixed max-lg:z-[1000] max-lg:bg-background max-lg:-left-100 max-lg:w-[312px] transition-[width,padding] duration-300 ease-in-out",
        collapsed ? "lg:w-[76px] lg:px-3" : "lg:w-[312px]",
        navOpen && " max-lg:left-0"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between h-[34px]",
          collapsed && "lg:justify-center"
        )}
      >
        {/* The mark and the wordmark are one SVG, so collapsing is a single
            clip: shrink this box to the leading 34px square and the wordmark
            slides out of view. One animated element beats cross-fading two, and
            it can't pop the way mounting a second image did. */}
        <div
          className={cn(
            "h-[34px] w-[156px] shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out",
            collapsed && "lg:w-[34px]"
          )}
        >
          <Image
            src={assets.logo}
            alt="Coachiatry"
            width={156}
            height={34}
            className="max-w-none"
          />
        </div>
        <X
          className="lg:hidden text-primary cursor-pointer size-5"
          onClick={() => setNavOpen(false)}
        />
      </div>
      {sideLinks.map((links, index) => {
        return (
          <React.Fragment key={index}>
            <div>
              <p
                className={cn(
                  "py-1.5 px-3 uppercase text-[10px] leading-3 tracking-[5%] truncate transition-all duration-200",
                  railHeading
                )}
              >
                {links.title}
              </p>
              {links.links
                .filter((link) => {
                  if (link.title === "Clients" && !session) return false;
                  if (
                    link.title === "Clients" &&
                    session?.user?.role !== "coach"
                  )
                    return false;
                  if (
                    link.title === "Users & permissions" &&
                    !["admin", "manager"].includes(session?.user?.role ?? "")
                  )
                    return false;

                  return true;
                })
                .map((link) => {
                  const active = isActive(link.href);
                  return (
                    <CollapsedLabel
                      key={link.href}
                      label={link.title}
                      collapsed={collapsed}
                    >
                      <Link
                        href={link.href}
                        className={cn(
                          "px-2 py-2.5 flex items-center gap-2 text-gray-500 rounded-md hover:bg-gray-200/60 transition-all",
                          {
                            "bg-primary hover:bg-primary": active
                          },
                          railRow
                        )}
                      >
                        <Image
                          src={link.icon}
                          alt=""
                          width={20}
                          height={20}
                          className={cn("shrink-0", {
                            "invert brightness-0": active
                          })}
                        />
                        <p
                          className={cn(
                            "capitalize text-sm leading-5 tracking-[0.05px] truncate transition-all duration-200",
                            {
                              "text-white": active
                            },
                            railLabel
                          )}
                        >
                          {link.title}
                        </p>
                      </Link>
                    </CollapsedLabel>
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
          <p
            className={cn(
              "py-1.5 px-3 uppercase text-[10px] leading-3 tracking-[5%] truncate transition-all duration-200",
              railHeading
            )}
          >
            Watching
          </p>
        </>
      )}
      {data?.map((_user) => {
        const active = isActive(`/shared-tasks/${_user.shareId}`);
        return (
          <CollapsedLabel
            key={_user.shareId}
            label={_user.fullName}
            collapsed={collapsed}
          >
            <Link href={`/shared-tasks/${_user.shareId}`}>
              <div
                className={cn(
                  "cursor-pointer px-2 py-2.5 flex items-center gap-2 text-gray-500 rounded-md hover:bg-gray-200/60 transition-all",
                  {
                    "bg-primary hover:bg-primary": active
                  },
                  railRow
                )}
              >
                <SmartAvatar
                  src={_user?.photo}
                  name={_user?.fullName}
                  className="size-5 shrink-0"
                />
                <p
                  className={cn(
                    "capitalize text-sm leading-5 tracking-[0.05px] truncate transition-all duration-200",
                    {
                      "text-white": active
                    },
                    railLabel
                  )}
                >
                  {_user.fullName}
                </p>
              </div>
            </Link>
          </CollapsedLabel>
        );
      })}

      {/* Pinned to the bottom of the rail: it's a view control, not navigation,
          so it sits below the links rather than competing with them. Hidden on
          mobile, where the drawer closes with the X in the header instead. */}
      {onToggleCollapse && (
        <div className="mt-auto pt-4 max-lg:hidden">
          <Separator className="mb-2 text-gray-200" />
          <CollapsedLabel label={collapseLabel} collapsed={collapsed}>
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-expanded={!collapsed}
              className={cn(
                // No w-full: it would fight railRow's lg:size-10 when collapsed,
                // and the flex row already stretches to the sidebar's width.
                "cursor-pointer px-2 py-2.5 flex items-center gap-2 text-gray-500 rounded-md hover:bg-gray-200/60 transition-all",
                railRow
              )}
            >
              <ChevronsLeft
                className={cn(
                  "size-5 shrink-0 transition-transform duration-300 ease-in-out",
                  collapsed && "rotate-180"
                )}
              />
              <p
                className={cn(
                  "text-sm leading-5 tracking-[0.05px] truncate transition-all duration-200",
                  railLabel
                )}
              >
                {collapseLabel}
              </p>
            </button>
          </CollapsedLabel>
        </div>
      )}
    </div>
  );
}
