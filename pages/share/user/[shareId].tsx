import { shareViewAccessToWatchers } from "@/external-api/functions/user.api";
import { queryClient } from "@/pages/_app";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { useQuery } from "@tanstack/react-query";
import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { useParams } from "next/navigation";
import { useRouter } from "next/router";
import { useEffect } from "react";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  const shareId = context.params?.shareId;

  if (!session) {
    return {
      redirect: {
        destination: `/auth/login?local_callback=/share/user/${shareId}`,
        permanent: false
      }
    };
  }

  return { props: {} };
};

export default function Index() {
  const { shareId } = useParams();
  const router = useRouter();

  const { data, isLoading, error } = useQuery({
    queryKey: ["share", shareId],
    queryFn: () => shareViewAccessToWatchers(shareId?.toString() ?? ""),
    enabled: !!shareId
  });

  useEffect(() => {
    if (data) {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      router.replace(`/shared-tasks/${data.shareId}`);
    }
  }, [data, router]);

  return (
    <div className="h-screen flex items-center justify-center">
      {isLoading ? (
        <div className="w-10 h-10 border-4 border-gray-700 border-t-transparent rounded-full animate-spin"></div>
      ) : data ? (
        <p className="text-gray-700 text-sm">Access Granted</p>
      ) : (
        <p className="text-gray-700 text-sm">
          {
            (error as { response: { data: { message: string } } } | null)
              ?.response?.data?.message
          }
        </p>
      )}
    </div>
  );
}
