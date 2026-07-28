import { Filter } from "@/typescript/interface/common.interface";
import axiosInstance from "../axiosInstance";
import { endpoints } from "../endpoints";

export interface SavedFilter {
  _id: string;
  name: string;
  filters: Filter[];
}

// `userId` is set only on the coach's view of a client's task sheet; it swaps
// in the coach-scoped endpoints so both pages share one component.
export const getSavedFilters = async (
  userId?: string
): Promise<SavedFilter[]> => {
  const res = await axiosInstance.get(
    userId
      ? endpoints.savedFilter.getAllCoach(userId)
      : endpoints.savedFilter.getAll
  );
  return res.data;
};

export const addSavedFilter = async (
  body: { name: string; filters: Filter[] },
  userId?: string
): Promise<SavedFilter> => {
  const res = await axiosInstance.post(
    userId ? endpoints.savedFilter.addCoach(userId) : endpoints.savedFilter.add,
    body
  );
  return res.data;
};

export const editSavedFilter = async ({
  id,
  ...body
}: {
  id: string;
  name: string;
  filters: Filter[];
}): Promise<SavedFilter> => {
  const res = await axiosInstance.patch(endpoints.savedFilter.edit(id), body);
  return res.data;
};

export const deleteSavedFilter = async (id: string) => {
  const res = await axiosInstance.delete(endpoints.savedFilter.delete(id));
  return res.data;
};
