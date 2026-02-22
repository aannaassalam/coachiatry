import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { getConversation } from "@/external-api/functions/chat.api";
import { ChatConversation as Conversation } from "@/typescript/interface/chat.interface";

type Details = { photo?: string; name?: string };

type UseConversationDetailsReturn = {
  conversation?: Conversation;
  friend?: Conversation["members"][number];
  details: Details;
  isLoading: boolean;
};

export const useConversationDetails = (room: string): UseConversationDetailsReturn => {
  const { data: session } = useSession();

  const { data: conversation, isLoading } = useQuery({
    queryKey: ["conversations", room],
    queryFn: () => getConversation(room),
    enabled: !!room
  });

  const friend = conversation?.members?.find(
    (member) => member.user._id !== session?.user?._id
  );

  const details: Details = {
    photo: conversation?.type === "group" ? conversation.groupPhoto : friend?.user.photo,
    name: conversation?.type === "group" ? conversation?.name : friend?.user.fullName
  };

  return {
    conversation,
    friend,
    details,
    isLoading
  };
};
