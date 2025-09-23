import ChatConversation from "@/components/Chats/ChatConversation";
import ChatList from "@/components/Chats/ChatList";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppLayout from "@/layouts/AppLayout";
import { SocketProvider } from "@/lib/socketContext";
import { parseAsString, useQueryState } from "nuqs";

function Chat() {
  const [tab, setTab] = useQueryState("tab", parseAsString.withDefault("all"));
  const [room] = useQueryState("room", parseAsString.withDefault(""));

  return (
    <SocketProvider>
      <AppLayout isPaddingBottom={false}>
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center justify-between gap-5 ">
            <h1 className="font-semibold text-gray-900 text-2xl leading-7 tracking-[-3%]">
              Chats
            </h1>
          </div>
          <Tabs value={tab} onValueChange={(value) => setTab(value)}>
            <div className="flex items-center justify-between gap-5 pb-2">
              <TabsList className="h-auto">
                <TabsTrigger
                  value="all"
                  className="py-1.5 px-6 text-sm leading-5"
                >
                  All
                </TabsTrigger>
                <TabsTrigger
                  value="archeived"
                  className="py-1.5 px-4 text-sm leading-5"
                >
                  Archeived
                </TabsTrigger>
                <TabsTrigger
                  value="drafts"
                  className="py-1.5 px-4 text-sm leading-5"
                >
                  Draft
                </TabsTrigger>
              </TabsList>
            </div>
          </Tabs>
        </div>
        <Separator />
        <div className="w-full grid grid-cols-[0.3fr_auto] flex-1 min-h-0">
          <ChatList />
          {room && <ChatConversation />}
        </div>
      </AppLayout>
    </SocketProvider>
  );
}

export default Chat;
