"use client";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { getSearch, SearchResult } from "@/external-api/functions/common.api";
import assets from "@/json/assets";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  Captions,
  ChevronRight,
  FileText,
  FolderOpen,
  Loader2,
  Search,
  X
} from "lucide-react";
import moment from "moment";
import Image from "next/image";
import { useRouter } from "next/navigation";
import * as React from "react";
import CoachAI from "./CoachAIPopover";
import { Badge } from "./ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

// Example data for demo
const getIcon = (type: string) => {
  switch (type) {
    case "document":
      return FolderOpen;
    case "transcript":
      return Captions;
    case "task":
      return FileText;
    default:
      return FileText;
  }
};

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState("all");
  const router = useRouter();

  // ⌘K or Ctrl+K shortcut
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const {
    data = [],
    isLoading,
    isFetching
  } = useQuery({
    queryKey: ["search", category, query],
    queryFn: () => getSearch(query, category)
  });

  const handleSelect = (item: SearchResult) => {
    setOpen(false);
    switch (item.type) {
      case "task":
        return router.push(`/tasks?task=${item._id}`);
      case "document":
        return router.push(`/documents?document=${item._id}`);
      case "transcript":
        return router.push(`/transcripts/${item._id}`);
      default:
        return router.push("/");
    }
  };

  return (
    <>
      {/* Trigger */}
      <div className="border rounded-xl overflow-hidden flex max-sm:border-none">
        <button
          onClick={() => setOpen(true)}
          className="bg-white flex items-center gap-2 py-2.5 px-2 max-sm:bg-transparent max-sm:p-1.5"
        >
          <Search className="text-gray-500 size-4.5 max-sm:size-6" />
          <span className="text-gray-900 min-w-52.5 max-lg:!min-w-0 max-lg:w-30 text-left max-sm:hidden">
            Search...
          </span>
          <kbd className="ml-auto text-xs text-gray-400 border rounded px-1.5 py-0.5 max-sm:hidden">
            ⌘K
          </kbd>
        </button>
        <Popover modal>
          <PopoverTrigger asChild>
            <div className="px-2.5 flex items-center gap-2 shrink-0 cursor-pointer max-sm:pr-1 max-sm:pl-2">
              <Image
                src={assets.ai}
                alt="AI"
                width={24}
                height={24}
                className="max-sm:size-7"
              />
              <p className="text-gray-900 font-semibold text-sm leading-4.5 max-md:hidden">
                Coach AI
              </p>
            </div>
          </PopoverTrigger>
          <PopoverContent
            className="border-none shadow-none bg-transparent"
            side="bottom"
            align="center"
            collisionPadding={180}
          >
            <CoachAI size="large" />
          </PopoverContent>
        </Popover>
      </div>

      {/* Palette */}
      <AnimatePresence>
        {open && (
          <CommandDialog open={open} onOpenChange={setOpen}>
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.15 }}
            >
              <div className="backdrop-blur-md bg-white/80 rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Search documents, task, transcriptions..."
                    value={query}
                    onValueChange={setQuery}
                    className="text-base py-3 px-4"
                  />
                  <div className="flex items-center gap-2 p-3">
                    <Badge
                      className={cn(
                        "bg-gray-200 text-gray-700 cursor-pointer rounded-lg px-3",
                        {
                          "bg-primary text-white": category === "all"
                        }
                      )}
                      onClick={() => setCategory("all")}
                    >
                      All
                    </Badge>
                    <Badge
                      className={cn(
                        "bg-gray-200 text-gray-700 cursor-pointer rounded-lg px-3",
                        {
                          "bg-primary text-white": category === "task"
                        }
                      )}
                      onClick={() => setCategory("task")}
                    >
                      Tasks
                    </Badge>
                    <Badge
                      className={cn(
                        "bg-gray-200 text-gray-700 cursor-pointer rounded-lg px-3",
                        {
                          "bg-primary text-white": category === "transcript"
                        }
                      )}
                      onClick={() => setCategory("transcript")}
                    >
                      Transcriptions
                    </Badge>
                    <Badge
                      className={cn(
                        "bg-gray-200 text-gray-700 cursor-pointer rounded-lg px-3",
                        {
                          "bg-primary text-white": category === "document"
                        }
                      )}
                      onClick={() => setCategory("document")}
                    >
                      Documents
                    </Badge>
                  </div>
                  <CommandList className="max-h-[400px] overflow-y-auto">
                    {isLoading || isFetching ? (
                      <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                        <Loader2 className="h-6 w-6 animate-spin mb-2" />
                        <p className="text-sm">Searching...</p>
                      </div>
                    ) : (
                      <>
                        {!query && (
                          <CommandGroup heading="Recent Searches">
                            {data?.map((item) => {
                              const Icon = getIcon(item.type);
                              return (
                                <CommandItem
                                  key={item._id}
                                  value={item._id}
                                  onSelect={() => handleSelect(item)}
                                  className="flex items-center group mb-2 gap-3"
                                >
                                  <div className="size-12 shrink-0 bg-gray-200 rounded-sm flex items-center justify-center">
                                    <Icon className="!size-6 text-gray-400 group-hover:text-gray-700" />
                                  </div>
                                  <div className="space-y-2 max-sm:space-y-1.5">
                                    <div className="flex items-center gap-2">
                                      <HighlightText
                                        text={item.title}
                                        query={query}
                                      />
                                    </div>
                                    <div className="flex items-center gap-5">
                                      <Badge className="capitalize bg-gray-200 text-gray-700 font-semibold text-xs max-sm:py-0.5">
                                        {item.type}
                                      </Badge>
                                      <span className="flex items-center gap-1 text-xs">
                                        <Calendar className="!size-3.5" />
                                        {moment(item.createdAt).format(
                                          "MMM DD, YYYY"
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                  <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 ml-auto" />
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        )}

                        {query && data.length > 0 && (
                          <CommandGroup heading="Results">
                            {data?.map((item) => {
                              const Icon = getIcon(item.type);
                              return (
                                <CommandItem
                                  key={item._id}
                                  value={item._id}
                                  onSelect={() => handleSelect(item)}
                                  className="flex items-center group"
                                >
                                  <div className="size-12 bg-gray-200 rounded-sm flex items-center justify-center">
                                    <Icon className="!size-6 text-gray-400 group-hover:text-gray-700" />
                                  </div>
                                  <div className="space-y-2 max-sm:space-y-1.5">
                                    <div className="flex items-center gap-2">
                                      <HighlightText
                                        text={item.title}
                                        query={query}
                                      />
                                    </div>
                                    <div className="flex items-center gap-5">
                                      <Badge className="capitalize bg-gray-200 text-gray-700 font-semibold text-xs max-sm:py-0.5">
                                        {item.type}
                                      </Badge>
                                      <span className="flex items-center gap-1 text-xs">
                                        <Calendar className="!size-3.5" />
                                        {moment(item.createdAt).format(
                                          "MMM DD, YYYY"
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                  <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 ml-auto" />
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        )}

                        {query && data?.length === 0 && (
                          <CommandEmpty>
                            <div className="flex flex-col items-center py-10 text-gray-500">
                              <X className="h-6 w-6 mb-2" />
                              <p className="text-sm font-medium">
                                No results found for &ldquo;{query}&rdquo;
                              </p>
                            </div>
                          </CommandEmpty>
                        )}
                      </>
                    )}
                  </CommandList>
                </Command>
              </div>
            </motion.div>
          </CommandDialog>
        )}
      </AnimatePresence>
    </>
  );
}

// Highlight matched text helper
function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query) return <p className="line-clamp-1">{text}</p>;
  const regex = new RegExp(`(${query})`, "gi");
  const parts = text.split(regex);
  return (
    <span className="text-sm font-medium text-gray-700 line-clamp-1">
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-yellow-200 text-gray-900 rounded px-0.5">
            {part}
          </mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </span>
  );
}
