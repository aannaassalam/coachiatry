import ChatCoach from "@/components/Clients/Chat";
import Documents from "@/components/Clients/Documents";
import Tasks from "@/components/Clients/Task";
import Transcriptions from "@/components/Clients/Transcriptions";
import Loader from "@/components/Loader";
import PageTitle from "@/components/Seo/PageTitle";
import { Button } from "@/components/ui/button";
import { SmartAvatar } from "@/components/ui/smart-avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAllCategoriesByCoach } from "@/external-api/functions/category.api";
import { getAllConversationsByCoach } from "@/external-api/functions/chat.api";
import { getAllDocumentsByCoach } from "@/external-api/functions/document.api";
import { getAllStatusesByCoach } from "@/external-api/functions/status.api";
import { getAllTasksByCoach } from "@/external-api/functions/task.api";
import { getAllTranscriptionsByCoach } from "@/external-api/functions/transcriptions.api";
import { getUserById } from "@/external-api/functions/user.api";
import AppLayout from "@/layouts/AppLayout";
import { cn } from "@/lib/utils";
import { User } from "@/typescript/interface/user.interface";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import moment from "moment";
import Link from "next/link";
import { useParams } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect } from "react";

const ClientInfo = ({
  details
}: {
  details?: Pick<User, "_id" | "fullName" | "email" | "photo" | "createdAt">;
}) => {
  const [, setTab] = useQueryState(
    "tab",
    parseAsString.withDefault("transcriptions")
  );

  return (
    // Compact single-row band: avatar, name + email/joined on one line, action
    // pinned right. Was a 6-unit-padded card with a 86px avatar and stacked
    // rows, which pushed the tabs and the actual content below the fold.
    <div className="px-4 py-3 rounded-[12px] border-1 border-gray-100 flex items-center gap-3 mt-2 w-full max-sm:flex-col max-sm:items-start max-sm:gap-2">
      <SmartAvatar
        src={details?.photo}
        name={details?.fullName}
        className="size-11 rounded-[12px]"
      />
      <div className="min-w-0 flex flex-col">
        <p className="font-archivo text-base font-semibold text-gray-900 truncate">
          {details?.fullName}
        </p>
        <div className="flex items-center gap-2 text-xs text-gray-600 font-lato">
          <Link
            href={`mailto:${details?.email}`}
            className="truncate hover:text-gray-900"
          >
            {details?.email}
          </Link>
          <span className="text-gray-300">•</span>
          <span className="whitespace-nowrap">
            Joined {moment(details?.createdAt).format("MMM DD, YYYY")}
          </span>
        </div>
      </div>
      <Button
        size="sm"
        className="ml-auto max-sm:ml-0"
        onClick={() => setTab("task")}
      >
        View Task
      </Button>
    </div>
  );
};

function ClientDetails() {
  const { userId } = useParams();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  // Admins reach client details from the /users listing, so their breadcrumb
  // returns there; coaches/managers go back to /clients.
  const allClientsHref =
    session?.user?.role === "admin" ? "/users" : "/clients";
  const [tab, setTab] = useQueryState(
    "tab",
    parseAsString.withDefault("transcriptions")
  );

  const { data, isLoading } = useQuery({
    queryKey: ["clientDetails", userId],
    queryFn: () => getUserById(userId as string)
  });

  useEffect(() => {
    queryClient.prefetchQuery({
      queryKey: ["status", userId],
      queryFn: () => getAllStatusesByCoach(userId as string),
      staleTime: 5 * 60 * 1000
    });
    queryClient.prefetchQuery({
      queryKey: ["categories", userId],
      queryFn: () => getAllCategoriesByCoach(userId as string),
      staleTime: 5 * 60 * 1000
    });
  }, [queryClient, userId]);

  const prefetchDocumentsOnMouseEnter = () => {
    queryClient.prefetchQuery({
      queryKey: ["documents", userId],
      queryFn: () =>
        getAllDocumentsByCoach({
          sort: "latest",
          tab: "all",
          userId: userId as string
        }),
      staleTime: 5 * 60 * 1000
    });
  };

  const prefetchTranscriptionsOnMouseEnter = () => {
    queryClient.prefetchQuery({
      queryKey: ["transcriptions", 1, userId, ""],
      queryFn: () =>
        getAllTranscriptionsByCoach({
          page: 1,
          userId: userId as string,
          search: ""
        }),
      staleTime: 5 * 60 * 1000
    });
  };

  const prefetchChatsOnMouseEnter = () => {
    queryClient.prefetchQuery({
      queryKey: ["conversations", userId],
      queryFn: () => getAllConversationsByCoach({ userId: userId as string }),
      staleTime: 5 * 60 * 1000
    });
  };

  const prefetchTasksOnMouseEnter = () => {
    queryClient.prefetchQuery({
      queryKey: ["tasks", "", [], userId],
      queryFn: () =>
        getAllTasksByCoach({
          sort: "",
          filter: [],
          userId: userId as string
        }),
      staleTime: 5 * 60 * 1000
    });
  };

  if (isLoading) return <Loader />;

  return (
    <AppLayout>
      <PageTitle title={data?.fullName ?? "Client"} />
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-2 items-center ">
          <Link
            href={allClientsHref}
            className="text-sm font-lato font-normal text-gray-600 "
          >
            All Clients
          </Link>
          <span className="text-xs text-gray-600">/</span>
          <h1 className="text-sm  font-lato font-semibold text-gray-900 ">
            {data?.fullName}
          </h1>
        </div>
      </div>
      <ClientInfo details={data} />
      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value)}
        className={cn(
          "mt-1",
          // On the chat tab (desktop), let the tabs region fill the remaining
          // viewport so the list + conversation share that height (each scrolls
          // internally) instead of growing the page. Other tabs — and mobile,
          // which uses an absolute overlay layout — keep their normal flow.
          tab === "chat" && "md:flex-1 md:min-h-0 md:flex md:flex-col"
        )}
      >
        <TabsList className="h-auto bg-white max-sm:w-[95vw] overflow-auto scrollbar-hide justify-start">
          <TabsTrigger
            value="transcriptions"
            className="py-3.5 px-6 text-lg leading-5 data-[state=active]:bg-white cursor-pointer font-semibold text-gray-500 data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-0 rounded-none border-b-gray-300 data-[state=active]:border-b-2 data-[state=active]:border-primary"
            onMouseEnter={prefetchTranscriptionsOnMouseEnter}
          >
            Transcriptions
          </TabsTrigger>
          <TabsTrigger
            value="documents"
            className="py-3.5 px-6 text-lg leading-5 data-[state=active]:bg-white cursor-pointer font-semibold text-gray-500 data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-0 rounded-none border-b-gray-300 data-[state=active]:border-b-2 data-[state=active]:border-primary"
            onMouseEnter={prefetchDocumentsOnMouseEnter}
          >
            Documents
          </TabsTrigger>
          <TabsTrigger
            value="chat"
            className="py-3.5 px-6 text-lg leading-5 data-[state=active]:bg-white cursor-pointer font-semibold text-gray-500 data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-0 rounded-none border-b-gray-300 data-[state=active]:border-b-2 data-[state=active]:border-primary"
            onMouseEnter={prefetchChatsOnMouseEnter}
          >
            Chat
          </TabsTrigger>
          <TabsTrigger
            value="task"
            className="py-3.5 px-6 text-lg leading-5 data-[state=active]:bg-white cursor-pointer font-semibold text-gray-500 data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-0 rounded-none border-b-gray-300 data-[state=active]:border-b-2 data-[state=active]:border-primary"
            onMouseEnter={prefetchTasksOnMouseEnter}
          >
            Task
          </TabsTrigger>
        </TabsList>
        <TabsContent value="transcriptions">
          <Transcriptions />
        </TabsContent>
        <TabsContent value="documents">
          <Documents />
        </TabsContent>
        <TabsContent
          value="chat"
          className="px-3 md:flex-1 md:min-h-0 md:flex md:flex-col"
        >
          <ChatCoach />
        </TabsContent>
        <TabsContent value="task" className="px-3">
          <Tasks />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}

export default ClientDetails;
