import { addCategory } from "@/external-api/functions/category.api";
import { useMutation } from "@tanstack/react-query";
import { Archivo, Lato } from "next/font/google";
import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { DialogClose, DialogContent } from "../ui/dialog";
import { Input } from "../ui/input";
const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo" });
const lato = Lato({
  display: "swap",
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["100", "300", "400", "700", "900"]
});
function AddCategoryModal({
  onChange,
  setIsAdding
}: {
  onChange: (value: string | number) => void;
  setIsAdding: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [title, setTitle] = useState("");

  const { mutate, isPending } = useMutation({
    mutationFn: addCategory,
    onSuccess: (data) => {
      setTitle("");
      onChange(data.data._id);
    },
    meta: {
      invalidateQueries: ["categories"]
    }
  });

  useEffect(() => {
    setIsAdding(isPending);
  }, [isPending, setIsAdding]);

  return (
    <DialogContent
      className={`${archivo.variable} ${lato.variable} sm:max-w-[460px] p-0 border-0 focus-visible:border-0`}
      showCloseButton={false}
    >
      <div className="w-full p-4 flex flex-col items-start gap-3">
        <h2 className="text-xl font-archivo">Add Category</h2>
        <Input
          placeholder="Enter Category Name"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isPending}
        />
        <DialogClose className="self-end">
          <Button
            onClick={() => {
              if (title.trim()) {
                mutate({ title });
              }
            }}
            isLoading={isPending}
          >
            Add
          </Button>
        </DialogClose>
      </div>
    </DialogContent>
  );
}

export default AddCategoryModal;
