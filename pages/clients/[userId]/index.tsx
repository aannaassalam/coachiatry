import ChatCoach from "@/components/Clients/Chat";
import Documents from "@/components/Clients/Documents";
import Tasks from "@/components/Clients/Task";
import ClientSettingsModal from "@/components/Clients/ClientSettingsModal";
import Transcriptions from "@/components/Clients/Transcriptions";
import Loader from "@/components/Loader";
import PageTitle from "@/components/Seo/PageTitle";
import { Badge } from "@/components/ui/badge";
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
import { ArrowLeft, Settings } from "lucide-react";
import moment from "moment";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { roleLabel } from "@/lib/functions/_helpers.lib";

// Was repeated verbatim on all four triggers. Every trigger carries a 2px
// bottom border (transparent until active) so activating one never changes its
// height; -mb-px lays that border over the strip's own rule instead of stacking
// a second line above it.
const tabTriggerClass =
  "h-auto -mb-px border-x-0 border-t-0 py-2 px-4 text-sm leading-5 cursor-pointer font-semibold text-gray-500 rounded-none bg-transparent border-b-2 border-transparent shadow-none data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-3 data-[state=active]:border-primary";

// Who may open the settings modal for whom — kept in step with
// resolveTargetUser on the backend, which returns 403 for anything else.
const MANAGEABLE_ROLES: Record<string, string[]> = {
  admin: ["manager", "coach", "user"],
  manager: ["coach", "user"],
  coach: ["user"]
};

const ClientInfo = ({
  details,
  backHref
}: {
  details?: Pick<
    User,
    "_id" | "fullName" | "email" | "photo" | "createdAt" | "role"
  >;
  backHref: string;
}) => (
  // Identity only — it shares one row with the tab strip (see below), so the
  // breadcrumb row, the bordered profile band and the standalone tab row that
  // used to stack above the content are all gone.
  <div className="flex items-center gap-3 min-w-0 pb-2">
    <Link
      href={backHref}
      aria-label="Back to all clients"
      className="shrink-0 text-gray-500 hover:text-gray-900"
    >
      <ArrowLeft size={18} />
    </Link>
    <SmartAvatar
      src={details?.photo}
      name={details?.fullName}
      className="size-9 rounded-[10px] shrink-0"
    />
    <div className="min-w-0 flex flex-col">
      <div className="flex items-center gap-1.5 min-w-0">
        <h1 className="font-archivo text-base font-semibold text-gray-900 truncate">
          {details?.fullName}
        </h1>
        {details?.role && (
          <Badge
            variant="secondary"
            className="capitalize h-4 px-1 py-0 text-[10px] leading-none rounded shrink-0"
          >
            {roleLabel(details.role)}
          </Badge>
        )}
      </div>
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
  </div>
);

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
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["clientDetails", userId],
    queryFn: () => getUserById(userId as string)
  });

  const canManageUser =
    !!data?.role &&
    (MANAGEABLE_ROLES[session?.user?.role ?? ""] ?? []).includes(data.role);

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
      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value)}
        className={cn(
          "gap-0",
          // On the chat tab (desktop), let the tabs region fill the remaining
          // viewport so the list + conversation share that height (each scrolls
          // internally) instead of growing the page. Other tabs — and mobile,
          // which uses an absolute overlay layout — keep their normal flow.
          tab === "chat" && "flex-1 min-h-0 flex flex-col"
        )}
      >
        {/* Identity left, tabs right, one shared baseline: the rule runs the
            full width of the row so it passes under the client details as well
            as the tabs. Below lg the strip drops to its own line. */}
        <div className="flex items-end gap-4 border-b border-gray-200 max-lg:flex-col max-lg:items-stretch max-lg:gap-2">
          <ClientInfo details={data} backHref={allClientsHref} />
          <div className="flex items-end ml-auto max-lg:ml-0 max-lg:w-full">
            <TabsList className="h-auto p-0 bg-transparent rounded-none overflow-auto scrollbar-hide justify-start max-lg:flex-1 max-lg:min-w-0">
              <TabsTrigger
                value="transcriptions"
                className={tabTriggerClass}
                onMouseEnter={prefetchTranscriptionsOnMouseEnter}
              >
                Transcriptions
              </TabsTrigger>
              <TabsTrigger
                value="documents"
                className={tabTriggerClass}
                onMouseEnter={prefetchDocumentsOnMouseEnter}
              >
                Documents
              </TabsTrigger>
              <TabsTrigger
                value="chat"
                className={tabTriggerClass}
                onMouseEnter={prefetchChatsOnMouseEnter}
              >
                Chat
              </TabsTrigger>
              <TabsTrigger
                value="task"
                className={tabTriggerClass}
                onMouseEnter={prefetchTasksOnMouseEnter}
              >
                Task
              </TabsTrigger>
            </TabsList>
            {canManageUser && (
              <Button
                variant="ghost"
                size="icon"
                center
                aria-label="Open settings"
                title="Settings"
                className="size-8 shrink-0 ml-1 mb-1 text-gray-500 hover:text-gray-900"
                onClick={() => setSettingsOpen(true)}
              >
                <Settings size={16} />
              </Button>
            )}
          </div>
        </div>
        <TabsContent value="transcriptions" className="pt-3">
          <Transcriptions />
        </TabsContent>
        <TabsContent value="documents" className="pt-3">
          <Documents />
        </TabsContent>
        <TabsContent
          value="chat"
          className="px-3 pt-3 flex-1 min-h-0 flex flex-col"
        >
          <ChatCoach />
        </TabsContent>
        <TabsContent value="task" className="px-3 pt-3">
          <Tasks />
        </TabsContent>
      </Tabs>
      {canManageUser && (
        <ClientSettingsModal
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          userId={userId as string}
        />
      )}
    </AppLayout>
  );
}

export default ClientDetails;
