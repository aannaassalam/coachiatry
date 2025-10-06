import { PaginatedResponse } from "@/typescript/interface/common.interface";
import axiosInstance from "../axiosInstance";
import { endpoints } from "../endpoints";
import { Message } from "@/typescript/interface/message.interface";
import { QueryFunctionContext, QueryKey } from "@tanstack/react-query";

export const getMessages = async (
  ctx: QueryFunctionContext<string[], number>
): Promise<PaginatedResponse<Message[]>> => {
  const room = ctx.queryKey[1];
  const page = ctx.pageParam ?? 1;
  const res = await axiosInstance.get(endpoints.messages.getMessages(room), {
    params: {
      page,
      limit: 25
    }
  });
  return res.data;
};
