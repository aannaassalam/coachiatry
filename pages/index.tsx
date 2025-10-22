import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getAllConversations } from "@/external-api/functions/chat.api";
import { getAllDocuments } from "@/external-api/functions/document.api";
import { getAllStatuses } from "@/external-api/functions/status.api";
import { getAllTasks } from "@/external-api/functions/task.api";
import assets from "@/json/assets";
import AppLayout from "@/layouts/AppLayout";
import { getInitials } from "@/lib/functions/_helpers.lib";
import { Task } from "@/typescript/interface/task.interface";
import { useQueries } from "@tanstack/react-query";
import moment from "moment";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";

moment.updateLocale("en", {
  relativeTime: {
    future: "in %s",
    past: "%s",
    s: "%ds",
    ss: "%ds",
    m: "1m",
    mm: "%dm",
    h: "1h",
    hh: "%dh",
    w: "1w",
    ww: "%dw",
    d: "1d",
    dd: "%dd",
    M: "1m",
    MM: "%dm",
    y: "1y",
    yy: "%dy"
  }
});

const TaskBox = ({
  title,
  tasks,
  isHighlighted,
  titleColor,
  accentColor,
  bgColor
}: {
  title: string;
  tasks: Task[];
  isHighlighted?: boolean;
  titleColor: string;
  accentColor: string;
  bgColor: string;
}) => {
  const router = useRouter();

  return (
    <div className="space-y-2">
      <div
        className="p-1 pl-3 rounded-sm inline-flex items-center gap-2.5"
        style={{ backgroundColor: bgColor }}
      >
        <h5
          className="text-sm font-medium leading-5"
          style={{ color: titleColor }}
        >
          {title}
        </h5>
        <Badge variant="counter" style={{ backgroundColor: accentColor }}>
          {tasks.length}
        </Badge>
      </div>

      {tasks.length > 0 ? (
        <div
          className={
            isHighlighted
              ? "bg-gray-100/90 rounded-sm"
              : "border border-gray-200 rounded-sm"
          }
          onClick={() => router.push("/tasks")}
        >
          {tasks.map((task, index) => (
            <div className="p-4 pb-3 flex flex-row gap-3" key={index}>
              {/* <Checkbox checked={task.isDone} /> */}
              <div className="flex flex-col space-y-2 flex-1">
                <p className="font-medium text-sm leading-4 text-gray-900">
                  {task.title}
                </p>
                <span className="text-xs leading-4.5 text-gray-700">
                  {moment(task.dueDate).format("D MMM, YYYY")}
                </span>
                {/* <Badge
                  className="rounded-sm text-sm leading-4"
                  style={{
                    backgroundColor: task.category?.color.bg,
                    color: task.category?.color.text
                  }}
                >
                  {task.category?.title}
                </Badge> */}
              </div>
              {Boolean(task?.subtasks?.length) && (
                <div className="flex gap-2 items-start shrink-0">
                  <Badge className="flex gap-1" variant="secondary">
                    <Image
                      src={assets.icons.spline}
                      alt="spline"
                      width={16}
                      height={16}
                    />
                    {task.subtasks?.filter((_task) => _task.completed).length}/
                    {task.subtasks?.length}
                  </Badge>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default function Home() {
  const { data } = useSession();

  const [
    { data: status, isLoading: isStatusLoading },
    { data: tasks, isLoading },
    { data: chats, isLoading: isChatsLoading },
    { data: documents, isLoading: isDocumentsLoading }
  ] = useQueries({
    queries: [
      {
        queryKey: ["status"],
        queryFn: getAllStatuses
      },
      {
        queryKey: ["tasks"],
        queryFn: () =>
          getAllTasks({
            startDate: moment().startOf("month").toISOString(),
            endDate: moment().endOf("month").toISOString()
          })
      },
      {
        queryKey: ["conversations"],
        queryFn: () => getAllConversations({ limit: 4, sort: "-updatedAt" })
      },
      {
        queryKey: ["documents"],
        queryFn: () =>
          getAllDocuments({ sort: "-updatedAt", tab: "all", limit: 4 })
      }
    ]
  });

  const slicedTasks = tasks?.slice(0, 7);
  const isAllLoading =
    isLoading || isStatusLoading || isChatsLoading || isDocumentsLoading;

  return (
    <AppLayout>
      <div className="mb-4">
        <h1 className="text-2xl leading-7 tracking-[-3%] font-semibold text-gray-900 mb-2">
          👋 Hey, {data?.user?.fullName.split(" ").shift()}
        </h1>
        <p className="flex items-center gap-2 text-sm leading-5 text-gray-800">
          {moment().startOf("month").format("MMMM DD")} -{" "}
          {moment().endOf("month").format("MMMM DD")}
          <Image
            src={assets.icons.info}
            alt="Info icon"
            width={20}
            height={20}
          />
        </p>
      </div>
      <div className="grid grid-cols-2 grid-rows-2 gap-5 flex-1 max-md:grid-cols-1">
        <div className="row-span-2 col-span-1 p-4 border border-gray-200 rounded-md shadow-xs max-sm:p-3">
          <div className="flex items-center justify-between gap-5 mb-2.5">
            <h6 className="text-sm font-semibold leading-[150%] text-gray-900">
              Task Management
            </h6>
            <Link href="/tasks" className="hover:underline">
              <h5 className="text-xs font-medium leading-[150%] text-primary tracking-[-2%]">
                See All
              </h5>
            </Link>
          </div>
          <div className="space-y-6 overflow-y-auto">
            {isAllLoading ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="w-25 h-8 bg-gray-200/70 animate-pulse rounded-md" />
                  <div className="space-y-1">
                    <div className="!h-[70px] bg-gray-200/70 animate-pulse rounded-md" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="w-25 h-8 bg-gray-200/70 animate-pulse rounded-md" />
                  <div className="space-y-1">
                    <div className="!h-[70px] bg-gray-200/70 animate-pulse rounded-md" />
                    <div className="!h-[70px] bg-gray-200/70 animate-pulse rounded-md" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="w-25 h-8 bg-gray-200/70 animate-pulse rounded-md" />
                  <div className="space-y-1">
                    <div className="!h-[70px] bg-gray-200/70 animate-pulse rounded-md" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="w-25 h-8 bg-gray-200/70 animate-pulse rounded-md" />
                  <div className="space-y-1">
                    <div className="!h-[70px] bg-gray-200/70 animate-pulse rounded-md" />
                    <div className="!h-[70px] bg-gray-200/70 animate-pulse rounded-md" />
                    <div className="!h-[70px] bg-gray-200/70 animate-pulse rounded-md" />
                  </div>
                </div>
              </div>
            ) : (
              status
                ?.sort((a, b) => (a?.priority ?? 0) - (b?.priority ?? 0))
                ?.map((_status) => {
                  return (
                    <TaskBox
                      title={_status.title}
                      tasks={
                        slicedTasks?.filter(
                          (_task) => _task.status._id === _status._id
                        ) ?? []
                      }
                      isHighlighted={_status.title === "Todo"}
                      titleColor={_status.color.text}
                      bgColor={_status.color.bg}
                      accentColor={_status.color.text}
                      key={_status._id}
                    />
                  );
                })
            )}
          </div>
        </div>
        <div className="p-4 border border-gray-200 rounded-md shadow-xs max-sm:p-3">
          <div className="flex items-center justify-between gap-5 mb-2 px-2.5 py-0.5">
            <h6 className="text-sm font-semibold leading-[150%] text-gray-900">
              All messages
            </h6>
            <Link href="/chat" className="hover:underline">
              <h5 className="text-xs font-medium leading-[150%] text-primary tracking-[-2%]">
                See All
              </h5>
            </Link>
          </div>
          <div className="space-y-2">
            {isAllLoading ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-sm animate-pulse">
                  <div className="size-10 bg-gray-200 rounded-full" />
                  <div className="space-y-1 max-md:w-full">
                    <div className="h-5 w-15 bg-gray-200 rounded-sm max-md:w-1/2" />
                    <div className="h-4 w-30 bg-gray-200 rounded-sm max-md:w-full" />
                  </div>
                </div>
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-sm animate-pulse">
                  <div className="size-10 bg-gray-200 rounded-full" />
                  <div className="space-y-1 max-md:w-full">
                    <div className="h-5 w-15 bg-gray-200 rounded-sm max-md:w-1/2" />
                    <div className="h-4 w-30 bg-gray-200 rounded-sm max-md:w-full" />
                  </div>
                </div>
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-sm animate-pulse">
                  <div className="size-10 bg-gray-200 rounded-full" />
                  <div className="space-y-1 max-md:w-full">
                    <div className="h-5 w-15 bg-gray-200 rounded-sm max-md:w-1/2" />
                    <div className="h-4 w-30 bg-gray-200 rounded-sm max-md:w-full" />
                  </div>
                </div>
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-sm animate-pulse">
                  <div className="size-10 bg-gray-200 rounded-full" />
                  <div className="space-y-1 max-md:w-full">
                    <div className="h-5 w-15 bg-gray-200 rounded-sm max-md:w-1/2" />
                    <div className="h-4 w-30 bg-gray-200 rounded-sm max-md:w-full" />
                  </div>
                </div>
              </div>
            ) : (
              chats?.data.map((msg) => {
                const friend = msg.members.find(
                  (_m) => _m.user._id !== data?.user?._id
                );
                const details: { photo?: string; name?: string } = {
                  photo: friend?.user.photo,
                  name: friend?.user.fullName
                };

                if (msg && msg.type === "group") {
                  details.photo = msg.groupPhoto;
                  details.name = msg.name;
                }
                return (
                  <Link href={`/chat?room=${msg._id}`} key={msg._id}>
                    <div className="flex items-start gap-3 p-2.5 cursor-pointer hover:bg-gray-100 rounded-md">
                      <Avatar className="size-10">
                        <AvatarImage
                          src={details?.photo}
                          alt={getInitials(details?.name)}
                        />
                        <AvatarFallback className="bg-orange-100 flex items-center justify-center font-semibold text-orange-600">
                          {getInitials(details?.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold text-sm leading-5 text-gray-900">
                          {details?.name}
                        </p>
                        <p className="text-xs leading-4 text-gray-500">
                          {msg.lastMessage?.sender?._id === data?.user?._id &&
                            "You: "}
                          {msg.lastMessage?.content ||
                            (msg.lastMessage?.type === "image"
                              ? "📷 Images"
                              : msg.lastMessage?.type === "video"
                                ? "🎥 Videos"
                                : msg.lastMessage?.type === "file"
                                  ? "📁 Files"
                                  : undefined)}
                        </p>
                      </div>
                      <span className="text-gray-500 font-medium text-xs leading-4 shrink-0 ml-3">
                        {moment(msg.lastMessage?.createdAt).fromNow(true)}
                      </span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
        <div className="p-4 border border-gray-200 rounded-md shadow-xs max-sm:p-3">
          <div className="flex items-center justify-between gap-5 mb-2 px-2 py-0.5">
            <h6 className="text-sm font-semibold leading-[150%] text-gray-900">
              Documents
            </h6>
            <Link href="/documents" className="hover:underline">
              <h5 className="text-xs font-medium leading-[150%] text-primary tracking-[-2%]">
                See All
              </h5>
            </Link>
          </div>
          <div className="space-y-2">
            {isAllLoading ? (
              <>
                <div className="flex items-center gap-3 px-3 py-2.5 animate-pulse border border-gray-100 rounded-md">
                  <div className="size-10 bg-gray-200 rounded-md" />
                  <div className="space-y-1 max-md:w-full">
                    <div className="h-5 w-15 bg-gray-200 rounded-sm max-md:w-1/2 mb-1" />
                    <div className="h-5 w-40 bg-gray-200 rounded-sm max-md:w-full" />
                  </div>
                </div>
                <div className="flex items-center gap-3 px-3 py-2.5 animate-pulse border border-gray-100 rounded-md">
                  <div className="size-10 bg-gray-200 rounded-md" />
                  <div className="space-y-1 max-md:w-full">
                    <div className="h-5 w-15 bg-gray-200 rounded-sm max-md:w-1/2 mb-1" />
                    <div className="h-5 w-40 bg-gray-200 rounded-sm max-md:w-full" />
                  </div>
                </div>
                <div className="flex items-center gap-3 px-3 py-2.5 animate-pulse border border-gray-100 rounded-md">
                  <div className="size-10 bg-gray-200 rounded-md" />
                  <div className="space-y-1 max-md:w-full">
                    <div className="h-5 w-15 bg-gray-200 rounded-sm max-md:w-1/2 mb-1" />
                    <div className="h-5 w-40 bg-gray-200 rounded-sm max-md:w-full" />
                  </div>
                </div>
                <div className="flex items-center gap-3 px-3 py-2.5 animate-pulse border border-gray-100 rounded-md">
                  <div className="size-10 bg-gray-200 rounded-md" />
                  <div className="space-y-1 max-md:w-full">
                    <div className="h-5 w-15 bg-gray-200 rounded-sm max-md:w-1/2 mb-1" />
                    <div className="h-5 w-40 bg-gray-200 rounded-sm max-md:w-full" />
                  </div>
                </div>
              </>
            ) : (
              documents?.data?.map((doc) => (
                <Link
                  href={`/documents?document=${doc._id}`}
                  key={doc._id}
                  className="block"
                >
                  <div className="flex items-start gap-3 p-2.5 cursor-pointer border border-gray-100 hover:bg-gray-100 rounded-md">
                    <div className="p-2 bg-gray-100 rounded-md">
                      <Image
                        src={assets.icons.file}
                        alt="File"
                        width={24}
                        height={24}
                        className="self-center"
                      />
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <p className="font-semibold text-sm leading-5 text-gray-900 line-clamp-1">
                        {doc.title}
                      </p>
                      <p className="text-sm leading-5 text-gray-600">
                        Updated: {moment(doc.updatedAt).format("D MMM, YYYY")}
                      </p>
                    </div>
                    <Badge
                      className="rounded-full py-0.5 px-2 flex items-center gap-1.5 font-archivo font-medium text-xs leading-4.5"
                      style={{
                        backgroundColor: doc.tag?.color.bg,
                        color: doc.tag?.color.text
                      }}
                    >
                      <div
                        className="size-1.5 rounded-full"
                        style={{ backgroundColor: doc.tag?.color.text }}
                      />
                      {doc.tag?.title}
                    </Badge>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
