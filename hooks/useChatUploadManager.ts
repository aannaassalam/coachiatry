import { useCallback } from "react";
import { toast } from "sonner";
import { uploadManager } from "@/services/uploadManager";
import { useChatUpload } from "@/hooks/useChatHook";

type UploadedFile = {
  url: string;
  type: string;
  size: number;
  thumbnailUrl: string | null;
  duration: number | null;
};

export type UploadCallbacks = {
  onProgress: (overallPct: number, perFile: number[]) => void;
  onFinish: (files: UploadedFile[]) => void;
  chatId: string;
};

export const useChatUploadManager = () => {
  const uploadMutation = useChatUpload();

  const uploadFiles = useCallback(
    async (tempId: string, files: File[], callbacks: UploadCallbacks) => {
      const { chatId, onProgress, onFinish } = callbacks;
      if (!files.length) return;

      const totalSize = files.reduce((a, f) => a + f.size, 0);
      const progressPerFile = Array(files.length).fill(0);
      let failedCount = 0;

      const uploadedFiles = await Promise.all(
        files.map(async (file, i) => {
          const controller = new AbortController();
          uploadManager.add(tempId, controller);

          try {
            const url = await uploadMutation.mutateAsync({
              file,
              chatId,
              signal: controller.signal,
              onProgress: (pct) => {
                progressPerFile[i] = pct;
                const uploadedBytes = files.reduce(
                  (sum, f, idx) => sum + (progressPerFile[idx] / 100) * f.size,
                  0
                );
                const overallPct = (uploadedBytes / totalSize) * 100;
                onProgress(overallPct, [...progressPerFile]);
              }
            });

            return {
              url,
              type: file.type.startsWith("video")
                ? "video"
                : file.type.startsWith("image")
                  ? "image"
                  : "file",
              size: file.size,
              thumbnailUrl: null,
              duration: null
            } as UploadedFile;
          } catch {
            // An intentional cancel is not a failure; a real error is.
            if (controller.signal.aborted) return null;
            failedCount += 1;
            return null;
          }
        })
      );

      uploadManager.clear(tempId);
      if (failedCount > 0) {
        toast.error(
          `${failedCount} file${failedCount > 1 ? "s" : ""} failed to upload. Please try again.`
        );
      }
      onFinish(uploadedFiles.filter(Boolean) as UploadedFile[]);
    },
    [uploadMutation]
  );

  return { uploadFiles } as const;
};
