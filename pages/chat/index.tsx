import ChatConversation from "@/components/Chats/ChatConversation";
import ChatList from "@/components/Chats/ChatList";
import ScheduledTable from "@/components/Chats/ScheduledTable";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppLayout from "@/layouts/AppLayout";
import { SocketProvider } from "@/lib/socketContext";
import { parseAsString, useQueryState } from "nuqs";

function Chat() {
  const [tab, setTab] = useQueryState(
    "tab",
    parseAsString.withDefault("chats")
  );
  const [room, setRoom] = useQueryState("room", parseAsString.withDefault(""));

  return (
    <SocketProvider>
      <AppLayout isPaddingBottom={false}>
        <div className="flex justify-between items-center mb-2 max-sm:gap-2">
          <div className="flex items-center justify-between gap-5 ">
            <h1 className="font-semibold text-gray-900 text-2xl leading-7 tracking-[-3%] max-sm:text-xl">
              {tab === "chats"
                ? "Chats"
                : tab === "scheduled" && "Scheduled Messages"}
            </h1>
          </div>
          <Tabs
            value={tab}
            onValueChange={(value) => {
              setRoom(null);
              setTab(value);
            }}
          >
            <div className="flex items-center justify-between gap-5 pb-2">
              <TabsList className="h-auto">
                <TabsTrigger
                  value="chats"
                  className="py-1.5 px-6 text-sm leading-5 cursor-pointer"
                >
                  Chats
                </TabsTrigger>
                <TabsTrigger
                  value="scheduled"
                  className="py-1.5 px-4 text-sm leading-5 cursor-pointer"
                >
                  Scheduled
                </TabsTrigger>
              </TabsList>
            </div>
          </Tabs>
        </div>
        <Separator />
        {tab === "chats" ? (
          <div className="w-full grid grid-cols-[0.3fr_auto] flex-1 min-h-0 max-md:grid-cols-1 max-md:relative">
            <ChatList />
            {room && <ChatConversation />}
          </div>
        ) : (
          tab === "scheduled" && <ScheduledTable />
        )}
      </AppLayout>
    </SocketProvider>
  );
}

export default Chat;
