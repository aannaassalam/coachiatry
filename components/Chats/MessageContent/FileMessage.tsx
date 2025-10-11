import { Download, FileText } from "lucide-react";
import { MessageFile } from "@/typescript/interface/message.interface";

export default function FileMessage({ files }: { files: MessageFile[] }) {
  return (
    <div className="flex flex-col gap-2">
      {files.map((f, i) => (
        <a
          href={f.url}
          download
          key={i}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 border text-sm"
        >
          <FileText className="text-primary" size={18} />
          <div className="flex-1 truncate">
            {decodeURIComponent(f.url.split("/").pop() ?? "file")}
          </div>
          <Download size={16} className="text-gray-500" />
        </a>
      ))}
    </div>
  );
}
