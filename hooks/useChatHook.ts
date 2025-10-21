import axios from "axios";
import { useMutation } from "@tanstack/react-query";
import axiosInstance from "@/external-api/axiosInstance";

const CHUNK_SIZE = 5 * 1024 * 1024; // 5 MB

export function useChatUpload() {
  return useMutation({
    mutationFn: async ({
      file,
      chatId,
      onProgress,
      signal
    }: {
      file: File;
      chatId: string;
      onProgress?: (p: number) => void;
      signal?: AbortSignal;
    }) => {
      const fileName = encodeURIComponent(file.name.replaceAll(" ", "_"));
      const fileType = file.type;

      // Step 1: start upload
      const { data: startRes } = await axiosInstance.post(
        "/chat/upload/start",
        {
          fileName,
          fileType,
          chatId
        }
      );

      const { uploadId, key } = startRes;

      // Step 2: split into chunks
      const totalParts = Math.ceil(file.size / CHUNK_SIZE);
      const parts = Array.from({ length: totalParts }, (_, i) => i + 1);

      // Step 3: get presigned URLs
      const { data: urlRes } = await axiosInstance.post("/chat/upload/parts", {
        uploadId,
        key,
        parts
      });

      const urls = urlRes.urls;
      const uploadedParts: any[] = [];

      // Step 4: upload each part
      for (const part of urls) {
        const start = (part.partNumber - 1) * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        const res = await axios.put(part.signedUrl, chunk, {
          headers: { "Content-Type": fileType },
          signal,
          onUploadProgress: (e) => {
            const pct =
              ((uploadedParts.length * CHUNK_SIZE + e.loaded) / file.size) *
              100;
            onProgress?.(Math.min(pct, 100));
          }
        });

        uploadedParts.push({
          ETag: res.headers.etag,
          PartNumber: part.partNumber
        });
      }

      // Step 5: complete upload
      const { data: completeRes } = await axiosInstance.post(
        "/chat/upload/complete",
        {
          uploadId,
          key,
          parts: uploadedParts
        }
      );

      return completeRes.fileUrl as string;
    },
    meta: {
      showToast: false
    }
  });
}
