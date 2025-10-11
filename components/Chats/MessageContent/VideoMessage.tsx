import { MessageFile } from "@/typescript/interface/message.interface";

export default function VideoMessage({ files }: { files: MessageFile[] }) {
  return (
    <div className="flex flex-col gap-2">
      {files.map((file, idx) => (
        <div key={idx} className="relative rounded-lg overflow-hidden">
          <video
            src={file.url}
            controls
            preload="metadata"
            className="rounded-lg w-full max-h-72 bg-black"
          />
        </div>
      ))}
    </div>
  );
}
