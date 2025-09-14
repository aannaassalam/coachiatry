import { Document } from "@/typescript/interface/document.interface";
import axiosInstance from "../axiosInstance";
import { endpoints } from "../endpoints";
import { PaginatedResponse } from "@/typescript/interface/common.interface";

export const getAllDocuments = async (): Promise<
  PaginatedResponse<Document[]>
> => {
  const res = await axiosInstance.get(endpoints.document.getAll);
  return res.data;
};

export const getDocument = async (documentId: string): Promise<Document> => {
  const res = await axiosInstance.get(endpoints.document.getOne(documentId), {
    params: {
      populate: "user"
    }
  });
  return res.data;
};

export const createDocument = async (body: {
  title: string;
  content: string;
}) => {
  const res = await axiosInstance.post(endpoints.document.add, body);
  return res;
};

export const editDocument = async (body: {
  title: string;
  content: string;
  documentId: string;
}) => {
  const { documentId, ...data } = body;
  const res = await axiosInstance.patch(
    endpoints.document.edit(documentId),
    data
  );
  return res;
};

export const deleteDocument = async (documentId: string) => {
  const res = await axiosInstance.delete(endpoints.document.delete(documentId));
  return res;
};
