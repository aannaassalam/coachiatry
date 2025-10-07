import React from "react";
import {
  //   DialogTrigger,
  DialogContent
} from "@/components/ui/dialog";
import { Archivo, Lato } from "next/font/google";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import assets from "@/json/assets";
import Link from "next/link";
const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo" });
const lato = Lato({
  display: "swap",
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["100", "300", "400", "700", "900"]
});
function ProfileModal() {
  return (
    <DialogContent
      className={`${archivo.variable} ${lato.variable} sm:max-w-[460px] p-0 border-0 focus-visible:border-0`}
      showCloseButton={false}
    >
      <div className="w-full p-5 flex flex-col items-center gap-0">
        <Avatar className="size-21 mt-6">
          <AvatarImage src={assets.avatar} alt="AH" />
          <AvatarFallback>AH</AvatarFallback>
        </Avatar>
        <p className="text-[20px] font-semibold text-gray-900 mt-4">
          Ahamd Ekstrom Bothman
        </p>
        <p className="text-base text-gray-600">youremailaddress@gmail.com</p>
        <div className="mt-8 gap-4 w-full grid grid-cols-2">
          <Button className="bg-gray-200 text-gray-900 hover:bg-gray-300 hover:text-gray-900">
            Cancel
          </Button>
          <Link href="/clients/1">
            <Button className="w-full">View Profile</Button>
          </Link>
        </div>
      </div>
    </DialogContent>
  );
}

export default ProfileModal;
