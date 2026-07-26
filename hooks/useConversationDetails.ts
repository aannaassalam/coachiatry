import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { getConversation } from "@/external-api/functions/chat.api";
import { chatDisplay } from "@/lib/functions/_helpers.lib";
import { ChatConversation as Conversation } from "@/typescript/interface/chat.interface";

type Details = { photo?: string; name?: string };

type UseConversationDetailsReturn = {
  conversation?: Conversation;
  friend?: Conversation["members"][number];
  details: Details;
  /** The other member's account is deactivated or gone — render it muted. */
  isDeleted: boolean;
  isLoading: boolean;
};

export const useConversationDetails = (
  room: string
): UseConversationDetailsReturn => {
  const { data: session } = useSession();

  const { data: conversation, isLoading } = useQuery({
    queryKey: ["conversations", room],
    queryFn: () => getConversation(room),
    enabled: !!room
  });

  const friend = conversation?.members?.find(
    (member) => member.user?._id !== session?.user?._id
  );

  const display = chatDisplay(conversation, session?.user?._id);

  return {
    conversation,
    friend,
    // Clean name here — the header states the deleted state in its subtitle,
    // and the avatar derives initials from this.
    details: { photo: display.photo, name: display.name },
    isDeleted: display.isDeleted,
    isLoading
  };
};
