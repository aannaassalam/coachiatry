import { Button } from "@/components/ui/button";
import assets from "@/json/assets";
import Image from "next/image";
import React from "react";

export default function AuthNavbar() {
  return (
    <div className="px-12 py-5 flex gap-5 justify-between items-center border-b border-gray-300">
      <Image src={assets.logo} alt="Logo" width={155} height={32} />
      <div className="flex items-center justify-between gap-4">
        <p>Don't have account?</p>
        <Button>Sign Up</Button>
      </div>
    </div>
  );
}
