import { shareViewAccessToWatchers } from "@/external-api/functions/user.api";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useRouter } from "next/router";
import { useEffect } from "react";

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
