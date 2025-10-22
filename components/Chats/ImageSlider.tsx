"use client";

import Image from "next/image";
import { useState } from "react";
import { IoMdDownload } from "react-icons/io";
import { RxCross1 } from "react-icons/rx";
import {
  FaArrowCircleRight,
  FaArrowCircleLeft,
  FaFileAlt
} from "react-icons/fa";
import { saveAs } from "file-saver";
import * as Dialog from "@radix-ui/react-dialog";

interface ImageSliderProps {
  data: {
    _id?: string;
    url: string;
    type: string;
    size?: number;
  }[];
  open: boolean;
  id: number | null;
  close: () => void;
}

export default function ImageSlider({
  data,
  open,
  id,
  close
}: ImageSliderProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(id ?? 0);

  const selected = data[selectedImageIndex];

  return (
    <Dialog.Root open={open} onOpenChange={(val) => !val && close()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]" />
        <Dialog.Content
          className="fixed z-[9999] inset-0 flex flex-col max-w-6xl mx-auto my-auto bg-white rounded-lg shadow-xl overflow-hidden animate-in fade-in-50"
          style={{ height: "90vh", width: "90vw" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
            <p className="font-semibold text-gray-800 text-lg truncate">
              {decodeURIComponent(selected?.url).split("/").pop()}
            </p>
            <div className="flex items-center gap-3">
              <IoMdDownload
                size={22}
                onClick={() => saveAs(selected?.url, selected?._id)}
                className="cursor-pointer text-gray-700 hover:text-black transition-colors"
              />
              <RxCross1
                onClick={close}
                className="cursor-pointer text-gray-700 hover:text-black transition-colors"
                size={20}
              />
            </div>
          </div>

          {/* Main body */}
          <div className="flex flex-1 items-center justify-between px-4 relative bg-gray-50">
            <FaArrowCircleLeft
              size={32}
              className={`cursor-pointer max-md:hidden ${
                selectedImageIndex === 0
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-700 hover:text-black"
              }`}
              onClick={() =>
                selectedImageIndex > 0 &&
                setSelectedImageIndex(selectedImageIndex - 1)
              }
            />

            <div className="flex justify-center items-center flex-1">
              {selected?.type.includes("image") ? (
                <Image
                  src={selected.url}
                  alt={selected._id ?? "image"}
                  width={700}
                  height={500}
                  key={selected.url}
                  className="max-h-[66vh] max-w-[80vw] object-contain rounded-md"
                />
              ) : selected?.type.includes("video") ? (
                <video
                  width={700}
                  height={500}
                  controls
                  src={selected.url}
                  key={selected.url}
                  className="max-h-[66vh] max-w-[80vw] rounded-md"
                ></video>
              ) : (
                <div className="flex flex-col justify-center items-center text-gray-700">
                  <FaFileAlt size={60} className="mb-2" />
                  <p className="font-medium">No Preview Available</p>
                </div>
              )}
            </div>

            <FaArrowCircleRight
              size={32}
              className={`cursor-pointer max-md:hidden ${
                selectedImageIndex === data.length - 1
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-700 hover:text-black"
              }`}
              onClick={() =>
                selectedImageIndex < data.length - 1 &&
                setSelectedImageIndex(selectedImageIndex + 1)
              }
            />
          </div>

          {/* Footer thumbnails */}
          <div className="flex gap-2 px-4 py-3 border-t border-gray-200 overflow-x-auto justify-center scrollbar-hide max-[480px]:pl-[140px]">
            {data.map((file, idx) => (
              <div
                key={file.url + idx}
                onClick={() => setSelectedImageIndex(idx)}
                className={`cursor-pointer border rounded-md p-1 flex-shrink-0 transition-all ${
                  selectedImageIndex === idx
                    ? "border-primary"
                    : "border-gray-200 hover:border-gray-400"
                }`}
              >
                {file.type.includes("image") ? (
                  <Image
                    src={file.url}
                    width={60}
                    height={60}
                    alt="thumbnail"
                    className="w-[60px] h-[60px] object-cover rounded-sm"
                  />
                ) : file.type.includes("video") ? (
                  <video
                    width={60}
                    height={60}
                    src={file.url}
                    className="w-[60px] h-[60px] object-cover rounded-sm"
                  >
                    {/* <source src={file.url} type={file.type} /> */}
                  </video>
                ) : (
                  <div className="w-[60px] h-[60px] flex items-center justify-center bg-gray-100 rounded-sm">
                    <FaFileAlt className="text-gray-500" size={30} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
