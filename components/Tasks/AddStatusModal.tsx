import React from "react";
import { DialogClose, DialogContent } from "../ui/dialog";
import { Archivo, Lato } from "next/font/google";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo" });
const lato = Lato({
  display: "swap",
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["100", "300", "400", "700", "900"]
});
function AddStatusModal() {
  return (
    <DialogContent
      className={`${archivo.variable} ${lato.variable} sm:max-w-[460px] p-0 border-0 focus-visible:border-0`}
      showCloseButton={false}
    >
      <div className="w-full p-4 flex flex-col items-start gap-3">
        <h2 className="text-xl font-archivo">Add Status</h2>
        <Input placeholder="Enter Status Name" />
        <DialogClose className="self-end">
          <Button>Add</Button>
        </DialogClose>
      </div>
    </DialogContent>
  );
}

export default AddStatusModal;
