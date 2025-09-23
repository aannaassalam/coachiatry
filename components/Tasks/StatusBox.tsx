"use client";
import assets from "@/json/assets";
import { cn } from "@/lib/utils";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Check } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { Input } from "../ui/input";

const statuses = [
  { label: "Todo", color: "border-gray-400", dot: "border-2 border-dotted" },
  { label: "Struggling", color: "bg-orange-500" },
  { label: "Overdue", color: "bg-red-500" },
  { label: "Completed", color: "bg-green-500" }
];

function StatusBox() {
  const [selected, setSelected] = useState("Overdue");
  const [searchTerm, setSearchTerm] = useState("");

  // Filtered list based on search
  const filteredStatuses = useMemo(() => {
    return statuses.filter((status) =>
      status.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  return (
    <div className="">
      {/* Search box */}
      <div className="p-2 border-b border-gray-200">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-md border border-gray-300 pl-8 pr-3 py-1.5 text-sm focus:outline-none"
          />
          <Image
            src={assets.icons.searchIcon}
            width={20}
            height={20}
            alt="search icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
          />
        </div>
      </div>

      {/* Status list */}
      <div className="p-2">
        <p className="px-2 text-xs font-medium text-gray-700 mt-2">Status</p>
        <ul className="mt-2 space-y-1">
          {filteredStatuses.length > 0 ? (
            filteredStatuses.map((status) => (
              <PopoverPrimitive.Close asChild key={status.label}>
                <>
                  {status.label === "Completed" && (
                    <div className="w-full h-0.25 bg-gray-200 my-2"></div>
                  )}
                  <li
                    onClick={() => setSelected(status.label)}
                    className={cn(
                      "flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 hover:bg-gray-100 transition-all duration-200"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {status.dot ? (
                        <div
                          className={cn(
                            "h-2.5 w-2.5 rounded-full",
                            status.dot,
                            status.color
                          )}
                        />
                      ) : (
                        <div
                          className={cn(
                            "h-3.5 w-3.5 rounded-full flex justify-center items-center",
                            status.color
                          )}
                        >
                          <div
                            className={cn(
                              "h-3 w-3 rounded-full border-1 border-white",
                              status.color
                            )}
                          />
                        </div>
                      )}
                      <span className="text-sm text-gray-900">
                        {status.label}
                      </span>
                    </div>

                    {selected === status.label && (
                      <Check className="h-4 w-4 text-gray-600" />
                    )}
                  </li>
                </>
              </PopoverPrimitive.Close>
            ))
          ) : (
            <p className="px-2 py-2 text-sm text-gray-500">No results found</p>
          )}
        </ul>
      </div>
    </div>
  );
}

export default StatusBox;
