import { User } from "./user.interface";

export interface MessageFile {
  url: string;
  type: string;
  size: Number;
  thumbnailUrl: string;
  duration: Number;
}

export interface MessageReaction {
  _id?: string;
  user?: string;
  emoji: String;
  reactedAt: string;
}

export type MessageStatus =
  | "pending"
  | "sent"
  | "delivered"
  | "seen"
  | "failed";

export interface Message {
  _id?: string;
  chat: string;
  sender?: User | undefined;
  type: "text" | "image" | "video" | "file" | "system";
  content: string;
  files?: MessageFile[];
  reactions?: MessageReaction[];
  replyTo?: Message | null;
  scheduledAt?: Date;
  createdAt?: string;
  updatedAt?: string;
  status: MessageStatus;
  deletedAt?: string;
  tempId?: string;
}
