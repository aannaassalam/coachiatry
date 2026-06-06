import PageTitle from "@/components/Seo/PageTitle";
import {
  acceptGroupInvite,
  getGroupInvite
} from "@/external-api/functions/chat.api";
import { queryClient } from "@/pages/_app";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { useMutation, useQuery } from "@tanstack/react-query";
import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { useRouter } from "next/router";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  const token = context.params?.token;

  // Not logged in → send to login, then come right back here to accept.
  if (!session) {
    return {
      redirect: {
        destination: `/auth/login?local_callback=/group-invite/${token}`,
        permanent: false
      }
    };
  }

  return { props: {} };
};

export default function GroupInvitePage() {
  const router = useRouter();
  const acceptedRef = useRef(false);

  // Read the token from next/router (reliable in the pages router; useParams
  // from next/navigation can be null on the first render here).
  const tokenStr =
    typeof router.query.token === "string" ? router.query.token : "";

  const { data: invite, isLoading: isInviteLoading } = useQuery({
    queryKey: ["group-invite", tokenStr],
    queryFn: () => getGroupInvite(tokenStr),
    enabled: !!tokenStr,
    retry: false
  });

  const {
    mutate: accept,
    isError,
    isSuccess,
    data: acceptResult
  } = useMutation({
    mutationFn: () => acceptGroupInvite(tokenStr),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: () => {
      toast.error("Couldn't join the group. Taking you to your chats.");
    },
    meta: { showToast: false }
  });

  // Auto-accept once router is ready and the invite preview resolves.
  useEffect(() => {
    if (router.isReady && invite && !acceptedRef.current) {
      acceptedRef.current = true;
      accept();
    }
  }, [router.isReady, invite, accept]);

  // Navigate AFTER the mutation settles, from a dedicated effect rather than
  // inside the mutation callback. Calling router.replace from within onSuccess
  // runs during React's commit/render window where the transition can get
  // cancelled — driving it from an effect lets Next complete it cleanly.
  useEffect(() => {
    if (isSuccess && acceptResult?.chatId) {
      router.replace(`/chat?room=${acceptResult.chatId}`);
    }
  }, [isSuccess, acceptResult, router]);

  useEffect(() => {
    if (isError) {
      router.replace("/chat");
    }
  }, [isError, router]);

  return (
    <div className="h-screen flex items-center justify-center">
      <PageTitle title="Group Invite" />
      {isInviteLoading ? (
        <div className="w-10 h-10 border-4 border-gray-700 border-t-transparent rounded-full animate-spin" />
      ) : isError || !invite?.chat ? (
        <p className="text-gray-700 text-sm">
          This invitation is no longer valid.
        </p>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-gray-700 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-700 text-sm">
            Joining {invite.chat.name || "the group"}…
          </p>
        </div>
      )}
    </div>
  );
}
