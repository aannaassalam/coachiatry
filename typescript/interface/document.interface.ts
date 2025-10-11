import { User } from "./user.interface";

export interface Document {
  _id: string;
  title: string;
  user: User;
  tag?: string;
  content: string;
  documentUrl: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
