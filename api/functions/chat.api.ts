import { PaginatedResponse } from "@/typescript/interface/common.interface";
import axiosInstance from "../axiosInstance";
import { endpoints } from "../endpoints";
import { ChatConversation } from "@/typescript/interface/chat.interface";

export const getAllConversations = async (): Promise<
  PaginatedResponse<ChatConversation[]>
> => {
  const res = await axiosInstance.get(endpoints.chat.getConversations);
  return res.data;
};

export const getConversation = async (
  roomId: string
): Promise<ChatConversation> => {
  const res = await axiosInstance.get(endpoints.chat.getConversation(roomId));
  return res.data;
};
