import axiosInstance from "../axiosInstance";
import { endpoints } from "../endpoints";

export const chatWithAi = async (body: {
  query?: string;
  action?: string;
  page: string;
  id?: string;
}) => {
  const res = await axiosInstance.post(endpoints.ai.chatWithAi, body);
  return res.data;
};
