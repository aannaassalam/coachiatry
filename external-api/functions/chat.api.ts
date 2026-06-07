import { PaginatedResponse } from "@/typescript/interface/common.interface";
import axiosInstance from "../axiosInstance";
import { endpoints } from "../endpoints";
import { ChatConversation } from "@/typescript/interface/chat.interface";

export const getAllConversations = async (
  filters?: Record<string, any>,
  options?: { token?: string }
): Promise<PaginatedResponse<ChatConversation[]>> => {
  const res = await axiosInstance.get(endpoints.chat.getConversations, {
    params: { ...filters },
    headers: options?.token
      ? { Authorization: `Bearer ${options.token}` }
      : undefined
  });
  return res.data;
};

export const getConversation = async (
  roomId: string
): Promise<ChatConversation> => {
  const res = await axiosInstance.get(endpoints.chat.getConversation(roomId));
  return res.data;
};

export const getAllConversationsByCoach = async ({
  filters,
  userId
}: {
  filters?: Record<string, any>;
  userId: string;
}): Promise<PaginatedResponse<ChatConversation[]>> => {
  const res = await axiosInstance.get(
    endpoints.chat.getConversationsByCoach(userId),
    {
      params: { ...filters }
    }
  );
  return res.data;
};

export const getConversationByCoach = async (
  roomId: string
): Promise<ChatConversation> => {
  const res = await axiosInstance.get(
    endpoints.chat.getConversationByCoach(roomId)
  );
  return res.data;
};

export const createGroup = async (body: {
  name: string;
  members: string[];
  groupPhoto: File | null;
}) => {
  const formData = new FormData();
  formData.append("name", body.name);
  body.members.forEach((_mem, i) => {
    formData.append(`members[${i}]`, _mem);
  });
  if (body.groupPhoto) formData.append("groupPhoto", body.groupPhoto);

  const res = await axiosInstance.post(endpoints.chat.createGroup, formData);
  return res.data;
};

export const editGroup = async (body: {
  name: string;
  members: string[];
  groupPhoto: File | string | null;
  chatId: string;
}) => {
  const formData = new FormData();
  formData.append("chatId", body.chatId);
  formData.append("name", body.name);
  body.members.forEach((_mem, i) => {
    formData.append(`members[${i}]`, _mem);
  });
  if (body.groupPhoto) formData.append("groupPhoto", body.groupPhoto);

  const res = await axiosInstance.post(endpoints.chat.editGroup, formData);
  return res.data;
};

export const leaveGroup = async (chatId: string) => {
  const res = await axiosInstance.delete(endpoints.chat.leaveGroup(chatId));
  return res;
};

export const inviteToGroupByEmail = async (body: {
  chatId: string;
  emails: string[];
}) => {
  const res = await axiosInstance.post(endpoints.chat.inviteToGroup, body);
  return res.data;
};

export interface GroupInvitePreview {
  token: string;
  email: string;
  accepted: boolean;
  chat: {
    _id: string;
    name?: string;
    groupPhoto?: string;
    type: string;
  } | null;
  invitedBy: {
    _id: string;
    fullName: string;
    photo?: string;
  } | null;
}

export const getGroupInvite = async (
  token: string
): Promise<GroupInvitePreview> => {
  const res = await axiosInstance.get(endpoints.chat.getGroupInvite(token));
  return res.data;
};

export const acceptGroupInvite = async (
  token: string
): Promise<{ chatId: string }> => {
  const res = await axiosInstance.post(endpoints.chat.acceptGroupInvite(token));
  return res.data;
};
