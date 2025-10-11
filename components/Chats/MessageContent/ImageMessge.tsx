import { Dialog } from "@/components/ui/dialog";
import { MessageFile } from "@/typescript/interface/message.interface";
import Image from "next/image";
import { useState } from "react";

export default function ImageMessage({ files }: { files: MessageFile[] }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);

  if (!files?.length) return null;

  if (files.length > 4) {
    // grid view
    return (
      <div className="grid grid-cols-2 gap-1 rounded-lg overflow-hidden">
        {files.slice(0, 4).map((f, i) => (
          <div
            key={i}
            className="relative cursor-pointer"
            onClick={() => {
              setSelected(i);
              setOpen(true);
            }}
          >
            <Image
              src={f.thumbnailUrl || f.url}
              alt={`img-${i}`}
              width={200}
              height={200}
              className="object-cover w-full h-full"
            />
            {i === 3 && files.length > 4 && (
              <div className="absolute inset-0 bg-black/60 text-white flex items-center justify-center text-lg font-semibold">
                +{files.length - 4}
              </div>
            )}
          </div>
        ))}

        {/* Simple lightbox */}
        <Dialog open={open} onOpenChange={setOpen}>
          {selected !== null && (
            <Image
              src={files[selected].url}
              alt="preview"
              className="w-full h-auto"
            />
          )}
        </Dialog>
      </div>
    );
  }

  // single or small grid
  return (
    <div className={files.length > 1 ? "grid grid-cols-2 gap-1" : "flex"}>
      {files.map((f, i) => (
        <Image
          key={i}
          src={f.thumbnailUrl || f.url}
          alt={`img-${i}`}
          width={200}
          height={200}
          className="rounded-lg cursor-pointer object-cover"
          onClick={() => {
            setSelected(i);
            setOpen(true);
          }}
        />
      ))}
      <Dialog open={open} onOpenChange={setOpen}>
        {selected !== null && (
          <Image
            src={files[selected].url}
            alt="preview"
            className="w-full h-auto"
          />
        )}
      </Dialog>
    </div>
  );
}
