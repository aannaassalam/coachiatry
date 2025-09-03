import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import assets from "@/json/assets";
import { Search } from "lucide-react";
import Image from "next/image";
import React from "react";

export default function Navbar() {
  return (
    <div className="px-12 py-5 flex items-center justify-end gap-6">
      <div className="border rounded-xl overflow-hidden flex">
        <div className="bg-white flex items-center pl-2.5">
          <Search className="text-gray-500 size-4.5" />
          <input
            type="text"
            className="py-2.5 pl-1 pr-2 text-gray-900 placeholder:text-gray-500 font-lato text-sm outline-none min-w-52.5"
            placeholder="Search"
          />
        </div>
        <div className="px-2.5 flex items-center gap-2">
          <Image src={assets.ai} alt="AI" width={24} height={24} />
          <p className="text-gray-900 font-semibold text-sm leading-4.5">
            Coach AI
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src={assets.avatar} alt="AH" />
          <AvatarFallback>AH</AvatarFallback>
        </Avatar>
        <div className="cursor-pointer">
          <p className="font-semibold text-gray-900 text-xs leading-4.5">
            Amanda Haydenson
          </p>
          <p className="text-gray-700 text-xs leading-4">amanahay@gmail.com</p>
        </div>
      </div>
    </div>
  );
}
