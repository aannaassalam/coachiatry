import { User } from "@/typescript/interface/user.interface";
import axiosInstance from "../axiosInstance";
import { endpoints } from "../endpoints";

export const fetchProfile = async (token?: string): Promise<User> => {
  const res = await axiosInstance.get(endpoints.user.getProfile, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return res.data;
};

export const updateProfile = async (body: {
  fullName: string;
  email: string;
}) => {
  const res = await axiosInstance.patch(endpoints.user.updateProfile, body);
  return res;
};

export const updateProfilePicture = async (file: File) => {
  const formData = new FormData();
  formData.append("profilePicture", file);
  const res = await axiosInstance.patch(
    endpoints.user.updateProfilePicture,
    formData
  );
  return res;
};

export const shareViewAccessToWatchers = async (shareId: string) => {
  const res = await axiosInstance.get(endpoints.user.shared(shareId));
  return res.data;
};

export const revokeViewAccess = async (viewerId: string) => {
  const res = await axiosInstance.delete(endpoints.user.revokeAccess(viewerId));
  return res;
};

export const getAllWatching = async (): Promise<
  Pick<User, "_id" | "photo" | "fullName" | "shareId">[]
> => {
  const res = await axiosInstance.get(endpoints.user.getAllWatching);
  return res.data;
};

export const getMyProfile = async (): Promise<User> => {
  const res = await axiosInstance.get(endpoints.user.getProfile, {
    params: {
      populate: "sharedViewers"
    }
  });
  return res.data;
};

export const getUserSuggestions = async (
  search: string
): Promise<Pick<User, "_id" | "fullName" | "email" | "photo">[]> => {
  const res = await axiosInstance.get(endpoints.user.suggestUsers, {
    params: { search }
  });
  return res.data;
};

export const addWatchers = async (userIds: string[]) => {
  const res = await axiosInstance.post(endpoints.user.addWatchers, { userIds });
  return res;
};
