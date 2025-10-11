import { PaginatedResponse } from "@/typescript/interface/common.interface";
import axiosInstance from "../axiosInstance";
import { endpoints } from "../endpoints";
import { Category } from "@/typescript/interface/category.interface";

export const getAllCategories = async (): Promise<Category[]> => {
  const res = await axiosInstance.get(endpoints.category.getAll);
  return res.data;
};

export const addCategory = async (body: { title: string }) => {
  const res = await axiosInstance.post(endpoints.category.add, body);
  return res;
};
