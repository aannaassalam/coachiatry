import { addStatus } from "@/external-api/functions/status.api";
import { useMutation } from "@tanstack/react-query";
import { Archivo, Lato } from "next/font/google";
import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Dialog, DialogClose, DialogContent } from "../ui/dialog";
import { Input } from "../ui/input";

const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo" });

const lato = Lato({
  display: "swap",
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["100", "300", "400", "700", "900"]
});

const predefinedColors = [
  { bg: "#FEE2E2", text: "#B91C1C" }, // Crimson Red
  { bg: "#FEF3C7", text: "#92400E" }, // Amber Gold
  { bg: "#DCFCE7", text: "#166534" }, // Emerald Green
  { bg: "#DBEAFE", text: "#1E3A8A" }, // Azure Blue
  { bg: "#E0E7FF", text: "#3730A3" }, // Indigo
  { bg: "#F5E1FE", text: "#86198F" }, // Orchid Purple
  { bg: "#E0F2FE", text: "#075985" }, // Sky Teal
  { bg: "#FFF1F2", text: "#9D174D" }, // Rose Pink
  { bg: "#F0FDF4", text: "#166534" }, // Mint Green
  { bg: "#FEF9C3", text: "#854D0E" } // Mustard Yellow
];

function AddStatusModal({
  onChange,
  setIsAdding,
  isOpen,
  onClose
}: {
  onChange: (value: string | number) => void;
  setIsAdding: React.Dispatch<React.SetStateAction<boolean>>;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [selectedColor, setSelectedColor] = useState<
    (typeof predefinedColors)[0]
  >(predefinedColors[0]);

  const { mutate, isPending } = useMutation({
    mutationFn: addStatus,
    onSuccess: (data) => {
      setTitle("");
      setSelectedColor(predefinedColors[0]);
      onChange(data.data._id);
    },
    meta: {
      invalidateQueries: ["status"]
    }
  });

  useEffect(() => {
    setIsAdding(isPending);
  }, [isPending, setIsAdding]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={() => {
        onClose();
        setTitle("");
        setSelectedColor(predefinedColors[0]);
      }}
    >
      <DialogContent
        className={`${archivo.variable} ${lato.variable} sm:max-w-[460px] p-0 border-0 focus-visible:border-0`}
        showCloseButton={false}
      >
        <div className="w-full p-4 flex flex-col items-start gap-3">
          <h2 className="text-xl font-archivo">Add Status</h2>
          <Input
            placeholder="Enter Status Name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isPending}
          />
          <div className="w-full">
            <p className="text-sm text-gray-500 mb-2">Choose Color</p>
            <div className="flex flex-wrap gap-2">
              {predefinedColors.map((color, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`size-8.5 cursor-pointer rounded-full border transition-all
                  ${selectedColor?.bg === color.bg ? `ring-2 ring-offset-2 ring-[${color.text}]` : "hover:ring-2 hover:ring-gray-300"}
                `}
                  style={{
                    backgroundColor: color.bg,
                    color: color.text
                  }}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </div>
          </div>

          <DialogClose className="self-end">
            <Button
              onClick={() => {
                if (title.trim()) {
                  mutate({ title, color: selectedColor });
                }
              }}
              isLoading={isPending}
            >
              Add
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AddStatusModal;
