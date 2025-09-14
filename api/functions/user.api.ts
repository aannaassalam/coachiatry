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
