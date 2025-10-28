import ChatCoach from "@/components/Clients/Chat";
import Documents from "@/components/Clients/Documents";
import Tasks from "@/components/Clients/Task";
import Transcriptions from "@/components/Clients/Transcriptions";
import Loader from "@/components/Loader";
import { Button } from "@/components/ui/button";
import { SmartAvatar } from "@/components/ui/smart-avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getUserById } from "@/external-api/functions/user.api";
import assets from "@/json/assets";
import AppLayout from "@/layouts/AppLayout";
import { User } from "@/typescript/interface/user.interface";
import { useQuery } from "@tanstack/react-query";
import moment from "moment";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";

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
    <div className="p-6 rounded-[12px] border-1 border-gray-100 flex gap-4 mt-2 w-full max-md:flex-col max-md:items-center max-sm:p-4">
      <SmartAvatar
        src={details?.photo}
        name={details?.fullName}
        className="size-21.5 rounded-[20px]"
        textSize="text-xl"
      />
      <div className="py-1 flex flex-col max-md:gap-4 max-sm:w-full">
        <div className="flex gap-4 items-center max-md:w-full max-md:justify-center">
          <p className="font-archivo text-2xl font-semibold text-gray-900">
            {details?.fullName}
          </p>
          <Link
            href={`mailto:${details?.email}`}
            className="p-1 border-1 border-gray-200 rounded-full bg-[#FCFCFD]"
          >
            <Image
              src={assets.icons.envelope}
              alt="envelope"
              width={20}
              height={20}
            />
          </Link>
        </div>
        <div className="flex gap-6 items-center mt-auto max-sm:gap-3 max-sm:justify-between max-sm:flex-wrap">
          {/* <div className="flex gap-2 items-center">
            <Image src={assets.icons.user} alt="user" width={24} height={24} />
            <p className="font-lato text-gray-600">Female</p>
          </div> */}
          <div className="flex gap-2 items-center">
            <Image
              src={assets.icons.dateCalendar}
              alt="datecalender"
              width={24}
              height={24}
            />
            <p className="font-lato text-gray-600">
              {moment(details?.createdAt).format("MMMM DD, YYYY")}
            </p>
          </div>
          {/* <div className="flex gap-2 items-center">
            <Image src={assets.icons.map} alt="user" width={24} height={24} />
            <p className="font-lato text-gray-600">Springfield</p>
          </div> */}
        </div>
      </div>
      <div className="ml-auto flex items-stretch gap-3 self-start max-md:ml-0 max-md:self-center max-sm:w-full max-sm:grid max-sm:grid-cols-2">
        {/* <Button
          size="sm"
          className="bg-white border-primary border-1 text-primary hover:text-white"
        >
          Chat Now
        </Button> */}
        <Button size="sm" onClick={() => setTab("task")}>
          View Task
        </Button>
      </div>
    </div>
  );
};
function ClientDetails() {
  const { userId } = useParams();
  const [tab, setTab] = useQueryState(
    "tab",
    parseAsString.withDefault("transcriptions")
  );

  const { data, isLoading } = useQuery({
    queryKey: ["clientDetails", userId],
    queryFn: () => getUserById(userId as string)
  });

  if (isLoading) return <Loader />;

  return (
    <AppLayout>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-2 items-center ">
          <Link
            href="/clients"
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
        className="mt-6"
      >
        <TabsList className="h-auto bg-white max-sm:w-full">
          <TabsTrigger
            value="transcriptions"
            className="py-3.5 px-6 text-lg leading-5 data-[state=active]:bg-white cursor-pointer font-semibold text-gray-500 data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-0 rounded-none border-b-gray-300 data-[state=active]:border-b-2 data-[state=active]:border-primary"
          >
            Transcriptions
          </TabsTrigger>
          <TabsTrigger
            value="documents"
            className="py-3.5 px-6 text-lg leading-5 data-[state=active]:bg-white cursor-pointer font-semibold text-gray-500 data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-0 rounded-none border-b-gray-300 data-[state=active]:border-b-2 data-[state=active]:border-primary"
          >
            Documents
          </TabsTrigger>
          <TabsTrigger
            value="chat"
            className="py-3.5 px-6 text-lg leading-5 data-[state=active]:bg-white cursor-pointer font-semibold text-gray-500 data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-0 rounded-none border-b-gray-300 data-[state=active]:border-b-2 data-[state=active]:border-primary"
          >
            Chat
          </TabsTrigger>
          <TabsTrigger
            value="task"
            className="py-3.5 px-6 text-lg leading-5 data-[state=active]:bg-white cursor-pointer font-semibold text-gray-500 data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-0 rounded-none border-b-gray-300 data-[state=active]:border-b-2 data-[state=active]:border-primary"
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
        <TabsContent value="chat" className="px-3">
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
