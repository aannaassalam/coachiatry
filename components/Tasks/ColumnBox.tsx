"use client";
import assets from "@/json/assets";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";

function ColumnBox() {
  const [columns, setColumns] = useState([
    { label: "Status", active: true },
    { label: "Due Date", active: true },
    { label: "Teams", active: true },
    { label: "Category", active: true },
    { label: "Priority", active: true }
  ]);
  const [searchTerm, setSearchTerm] = useState("");

  // Filtered list based on search
  const filteredColumns = useMemo(() => {
    return columns.filter((status) =>
      status.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, columns]);

  const handleColumn = (column: { label: string; active: boolean }) => {
    setColumns((prev) =>
      prev.map((col) =>
        col.label === column.label
          ? { ...col, active: !col.active } // toggle active
          : col
      )
    );
  };
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
        <div className="w-full flex justify-between items-center">
          <p className="px-2 text-xs font-medium text-gray-700">Status</p>
          <Button
            variant="ghost"
            size="sm"
            className="px-2 text-xs font-medium text-gray-700"
          >
            Hide All
          </Button>
        </div>
        <ul className="mt-2 space-y-1">
          {filteredColumns.length > 0 ? (
            filteredColumns.map((column, id) => (
              <label
                key={id}
                // onClick={() => handleColumn(column)}
                className="text-sm cursor-pointer my-4 px-2 font-lato text-gray-900 flex justify-between"
              >
                <div className="flex items-center gap-3">{column.label}</div>
                <Switch
                  //   checked={column.active}
                  onCheckedChange={() => handleColumn(column)}
                />
              </label>
            ))
          ) : (
            <p className="px-2 py-2 text-sm text-gray-500">No results found</p>
          )}
        </ul>
      </div>
    </div>
  );
}

export default ColumnBox;
