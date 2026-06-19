import { Transcription } from "@/typescript/interface/transcription.interface";
import axiosInstance from "../axiosInstance";
import { endpoints } from "../endpoints";
import { PaginatedResponse } from "@/typescript/interface/common.interface";

export const getAllTranscriptions = async ({
  page
}: {
  page: number;
}): Promise<PaginatedResponse<Transcription[]>> => {
  const res = await axiosInstance.get(
    endpoints.transcriptions.getAllTranscriptions,
    {
      params: {
        page,
        limit: 9,
        populate: "user"
      }
    }
  );
  return res.data;
};

export const getAllTranscriptionsByCoach = async ({
  page,
  userId,
  search
}: {
  page: number;
  userId: string;
  search: string;
}): Promise<PaginatedResponse<Transcription[]>> => {
  const res = await axiosInstance.get(
    endpoints.transcriptions.getAllTranscriptionsByCoach,
    {
      params: {
        page,
        user: userId,
        limit: 9,
        populate: "user",
        search,
        searchFields: "title"
      }
    }
  );
  return res.data;
};

// One page of a transcript's segments. `cursor`/`hasMore` drive infinite
// scroll so a long past meeting isn't loaded all at once.
export interface TranscriptionPage extends Transcription {
  cursor?: string | null;
  hasMore?: boolean;
}

export const getTranscription = async (
  id: string,
  params?: { after?: string | null; limit?: number }
): Promise<TranscriptionPage> => {
  const res = await axiosInstance.get(
    endpoints.transcriptions.getTranscription(id),
    {
      params: {
        populate: "user",
        ...(params?.after ? { after: params.after } : {}),
        ...(params?.limit ? { limit: params.limit } : {})
      }
    }
  );
  return res.data;
};

export const deleteTranscription = async (id: string) => {
  const res = await axiosInstance.delete(
    endpoints.transcriptions.deleteTranscription(id)
  );
  return res;
};

export const deleteTranscriptionByCoach = async (id: string) => {
  const res = await axiosInstance.delete(
    endpoints.transcriptions.deleteTranscriptionByCoach(id)
  );
  return res;
};
