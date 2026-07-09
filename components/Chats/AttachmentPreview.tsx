"use client";

import { FileText, Plus, Send, X } from "lucide-react";
import { ChangeEvent, useEffect, useRef, useState } from "react";

interface AttachmentPreviewProps {
  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
  /** Send the current batch with an optional caption. */
  onSend: (caption: string) => void;
  /** Discard the batch and return to the conversation. */
  onClose: () => void;
}

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * WhatsApp-style attachment composer. Overlays the conversation body (the chat
 * header stays visible) and shows a large preview of the selected image/video/
 * document, a thumbnail strip to switch/remove/add files, and a caption box
 * with its own send button.
 */
export default function AttachmentPreview({
  files,
  setFiles,
  onSend,
  onClose
}: AttachmentPreviewProps) {
  const [selected, setSelected] = useState(0);
  const [caption, setCaption] = useState("");
  const [urls, setUrls] = useState<(string | null)[]>([]);
  const addInputRef = useRef<HTMLInputElement>(null);

  // Create one object URL per image/video INSIDE an effect (not during render).
  // Doing it in render + revoking in a cleanup meant React Strict Mode's
  // mount→unmount→mount cycle revoked the URL while it was still on screen,
  // which showed as a broken/blank preview until something forced a re-render.
  // Creating them here recreates fresh URLs on every run, so the visible ones
  // are always valid.
  useEffect(() => {
    const created = files.map((f) =>
      f.type.includes("image") || f.type.includes("video")
        ? URL.createObjectURL(f)
        : null
    );
    setUrls(created);
    return () => created.forEach((u) => u && URL.revokeObjectURL(u));
  }, [files]);

  // Keep `selected` in range as files are added/removed.
  useEffect(() => {
    setSelected((s) => Math.min(s, Math.max(0, files.length - 1)));
  }, [files.length]);

  const current = files[selected];
  const currentUrl = urls[selected];
  const isImage = current?.type.includes("image");
  const isVideo = current?.type.includes("video");

  const removeAt = (i: number) =>
    setFiles((prev) => prev.filter((_, idx) => idx !== i));

  const addMore = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);
    if (picked.length) setFiles((prev) => [...prev, ...picked]);
    e.target.value = "";
  };

  const send = () => {
    if (files.length === 0) return;
    onSend(caption.trim());
    setCaption("");
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-gray-50">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-white">
        <button
          type="button"
          onClick={onClose}
          aria-label="Discard attachments"
          className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>
        <p className="flex-1 truncate text-sm font-medium text-gray-800">
          {current?.name}
        </p>
        {files.length > 1 && (
          <span className="text-xs text-gray-400">
            {selected + 1} / {files.length}
          </span>
        )}
      </div>

      {/* Large preview */}
      <div className="flex-1 min-h-0 flex items-center justify-center p-4 sm:p-8">
        {(isImage || isVideo) && !currentUrl ? (
          // Brief skeleton while the object URL is created (avoids a broken img).
          <div className="size-48 max-w-full rounded-lg bg-gray-200/70 animate-pulse" />
        ) : isImage && currentUrl ? (
          // Local blob preview — native <img> renders it instantly; next/image
          // can't optimize blob: URLs and flashes broken first.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentUrl}
            alt={current?.name ?? "preview"}
            className="max-h-full max-w-full object-contain rounded-lg"
          />
        ) : isVideo && currentUrl ? (
          <video
            key={currentUrl}
            src={currentUrl}
            controls
            className="max-h-full max-w-full rounded-lg shadow-sm"
          />
        ) : (
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex size-20 items-center justify-center rounded-2xl bg-white border border-gray-200 shadow-sm">
              <FileText size={36} className="text-gray-400" />
            </div>
            <p className="text-base font-medium text-gray-800 max-w-xs truncate">
              {current?.name}
            </p>
            <p className="text-sm text-gray-400">
              {current ? formatSize(current.size) : ""} · No preview available
            </p>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="border-t bg-white px-3 py-3 flex flex-col gap-3">
        {/* Thumbnail strip + add-more. py/px padding gives the hover remove
            button room — `overflow-x-auto` also clips the Y axis, so without it
            the button (which sits at -top/-right) gets cut off. */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide px-1.5 py-2">
          {files.map((file, i) => {
            const url = urls[i];
            const active = i === selected;
            const isMedia =
              file.type.includes("image") || file.type.includes("video");
            return (
              <div
                key={`${file.name}-${i}`}
                className="relative shrink-0 group"
              >
                <button
                  type="button"
                  onClick={() => setSelected(i)}
                  className={`block size-12 overflow-hidden rounded-md border-2 transition-colors ${
                    active ? "border-primary" : "border-transparent"
                  }`}
                >
                  {isMedia && !url ? (
                    <span className="block size-full bg-gray-200 animate-pulse" />
                  ) : file.type.includes("image") && url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={url}
                      alt={file.name}
                      className="size-full object-cover"
                    />
                  ) : file.type.includes("video") && url ? (
                    <video
                      src={url}
                      className="size-full object-cover bg-black"
                    />
                  ) : (
                    <span className="flex size-full items-center justify-center bg-gray-100">
                      <FileText size={18} className="text-gray-500" />
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  aria-label={`Remove ${file.name}`}
                  className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-gray-700 text-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black"
                >
                  <X size={11} />
                </button>
              </div>
            );
          })}
          <button
            type="button"
            onClick={() => addInputRef.current?.click()}
            aria-label="Add more files"
            className="flex size-12 shrink-0 items-center justify-center rounded-md border-2 border-dashed border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <Plus size={20} />
          </button>
          <input
            ref={addInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={addMore}
          />
        </div>

        {/* Caption + send */}
        <div className="flex items-end gap-2">
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Add a caption..."
            rows={1}
            className="flex-1 resize-none rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:border-primary/40 max-h-28"
          />
          <button
            type="button"
            onClick={send}
            aria-label="Send"
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-colors hover:opacity-90 cursor-pointer"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
