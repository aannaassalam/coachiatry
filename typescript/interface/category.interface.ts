export interface Category {
  _id: string;
  title: string;
  public?: boolean;
  user: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
