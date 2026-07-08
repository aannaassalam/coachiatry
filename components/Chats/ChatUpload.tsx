import { Upload } from "lucide-react";
import { DragEvent, useState } from "react";
import { RxCross1 } from "react-icons/rx";

interface ChatUploadProps {
  handleUpload: (files: File[]) => void;
  setChatDragShow: (show: boolean) => void;
  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
}

/**
 * Drag-and-drop overlay shown over the message pane while the user is dragging
 * files in. Dropped files are appended to the pending `files` set and the
 * overlay closes — the actual preview of pending attachments lives as a compact
 * tray inside the composer (ChatInput), not as a full-screen takeover here.
 */
export default function ChatUploadWithPreview({
  setChatDragShow,
  files,
  setFiles
}: ChatUploadProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      setFiles([...files, ...droppedFiles]);
    }
    setChatDragShow(false);
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const isFileDrag = e.dataTransfer.types.includes("Files");
    if (e.type === "dragenter" || e.type === "dragover") {
      if (isFileDrag) setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-50/90 backdrop-blur-[1px] p-4">
      <button
        onClick={() => setChatDragShow(false)}
        className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition cursor-pointer"
        aria-label="Cancel"
      >
        <RxCross1 size={20} />
      </button>

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`flex w-full max-w-md flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-colors ${
          dragActive
            ? "border-primary bg-primary/5"
            : "border-gray-300 bg-white/60"
        }`}
      >
        <div
          className={`flex size-12 items-center justify-center rounded-full transition-colors ${
            dragActive ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-500"
          }`}
        >
          <Upload size={22} />
        </div>
        <p className="text-base font-semibold text-gray-800">
          Drop files to send
        </p>
        <p className="text-sm text-gray-500">
          Images, videos and documents are supported
        </p>
      </div>
    </div>
  );
}
