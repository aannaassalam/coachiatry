import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import assets from "@/json/assets";
import AppLayout from "@/layouts/AppLayout";
import AuthLayout from "@/layouts/AuthLayout";
import { cn } from "@/lib/utils";
import { Info, InfoIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const TaskList = [
  {
    task: "Update user flows with UX feedback from Session #245",
    date: "5 Jul, 2025",
    tag: ["Design"],
    subtasks: 4,
    completed: 3,
    isDone: true,
    isUrgent: false
  },
  {
    task: "Wireframe splash page for new sales funnel",
    date: "5 Jul, 2025",
    tag: [],
    subtasks: 4,
    completed: 3,
    isDone: true,
    isUrgent: true
  },
  {
    task: "Wireframe splash page for new sales funnel",
    date: "5 Jul, 2025",
    tag: [],
    subtasks: 4,
    completed: 3,
    isDone: true,
    isUrgent: true
  }
];

const Messages = [
  {
    sender: "Eleanor Pena",
    message: "Paperless opt-out email sent",
    time: "5s",
    avatar: assets.avatar,
    unread: false
  },
  {
    sender: "Cody Fisher",
    message:
      "Im trying to book an appointment but the assistant isnt picking up the phone....",
    time: "59m",
    avatar: assets.avatar,
    unread: false
  },
  {
    sender: "We Are Three",
    message:
      "I have something on my mind that's been bothering me, but I'm not sure",
    time: "1h",
    avatar: assets.avatar,
    unread: true
  },
  {
    sender: "Cooper, Kristin",
    message: "I'm trying to adopt a more sustainable lifestyle",
    time: "3w",
    avatar: assets.avatar,
    unread: true
  }
];

const Documents = [
  {
    name: "Doctor’s Recommendation Letter",
    date: "5 Jul, 2025",
    tag: "Health"
  },
  {
    name: "Medical History Summary – Uploaded",
    date: "5 Jul, 2025",
    tag: "Therapy"
  },
  {
    name: "Prescription – Dr. Neha Sharma",
    date: "5 Jul, 2025",
    tag: "Fitness"
  },
  {
    name: "Mental Health Assessment ",
    date: "5 Jul, 2025",
    tag: "Health"
  }
];

const DocumentTagColorMap: Record<string, Record<string, string>> = {
  Health: {
    bg: "bg-amber-200/40",
    text: "text-amber-500",
    dotColor: "bg-amber-600/80"
  },
  Therapy: {
    bg: "bg-gray-200/70",
    text: "text-primary",
    dotColor: "bg-primary"
  },
  Fitness: {
    bg: "bg-green-100",
    text: "text-green-600/90",
    dotColor: "bg-green-600/9"
  }
};

const TaskBox = ({
  title,
  tasks,
  isHighlighted,
  titleColor,
  accentColor,
  bgColor
}: {
  title: string;
  tasks: typeof TaskList;
  isHighlighted?: boolean;
  titleColor: string;
  accentColor: string;
  bgColor: string;
}) => {
  return (
    <div className="space-y-2">
      <div
        className={cn(
          "p-1 pl-3 rounded-sm inline-flex items-center gap-2.5",
          bgColor
        )}
      >
        <h5 className={cn("text-sm font-medium leading-5", titleColor)}>
          {title}
        </h5>
        <Badge variant="counter" className={accentColor}>
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
        >
          {tasks.map((task, index) => (
            <div className="p-4 pb-3 flex flex-row gap-3" key={index}>
              <Checkbox checked={task.isDone} />
              <div className="flex flex-col space-y-2 flex-1">
                <p className="font-medium text-sm leading-4 text-gray-900">
                  {task.task}
                </p>
                <span className="text-xs leading-4.5 text-gray-700">
                  {task.date}
                </span>
                {task.tag.length > 0 &&
                  task.tag.map((_tag) => (
                    <Badge
                      // href="#"
                      key={_tag}
                      className="bg-primary rounded-sm text-sm text-white leading-4"
                    >
                      {_tag}
                    </Badge>
                  ))}
              </div>
              <div className="flex gap-2 items-start shrink-0">
                <Badge className="flex gap-1" variant="secondary">
                  <Image
                    src={assets.icons.spline}
                    alt="spline"
                    width={16}
                    height={16}
                  />
                  {task.completed}/{task.subtasks}
                </Badge>

                {task.isUrgent && (
                  <Badge className="bg-red-200/40 text-red-700">Urgent</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default function Home() {
  return (
    <AppLayout>
      <div className="mb-4">
        <h1 className="text-2xl leading-7 tracking-[-3%] font-semibold text-gray-900 mb-2">
          👋 Hey, Badal
        </h1>
        <p className="flex items-center gap-2 text-sm leading-5 text-gray-800">
          July 01 - July 31
          <Image
            src={assets.icons.info}
            alt="Info icon"
            width={20}
            height={20}
          />
        </p>
      </div>
      <div className="grid grid-cols-2 grid-rows-2 gap-5 flex-1">
        <div className="row-span-2 col-span-1 p-4 border border-gray-200 rounded-md shadow-xs">
          <div className="flex items-center justify-between gap-5 mb-2.5">
            <h6 className="text-sm font-semibold leading-[150%] text-gray-900">
              Task Management
            </h6>
            <Link href="#" className="hover:underline">
              <h5 className="text-xs font-medium leading-[150%] text-primary tracking-[-2%]">
                See All
              </h5>
            </Link>
          </div>
          <div className="space-y-6">
            <TaskBox
              title="Todo"
              tasks={TaskList}
              isHighlighted
              titleColor="text-primary"
              bgColor="bg-gray-200"
              accentColor="bg-primary"
            />
            <TaskBox
              title="Struggling"
              tasks={TaskList.slice(0, 1)}
              titleColor="text-orange-600/80"
              bgColor="bg-orange-200/60"
              accentColor="bg-orange-600/80"
            />
            <TaskBox
              title="Overdue"
              tasks={[]}
              titleColor="text-red-600/80"
              bgColor="bg-red-100/80"
              accentColor="bg-red-600/80"
            />
            <TaskBox
              title="Completed"
              tasks={[]}
              titleColor="text-green-600/90"
              bgColor="bg-green-100"
              accentColor="bg-green-600/90"
            />
          </div>
        </div>
        <div className="p-4 border border-gray-200 rounded-md shadow-xs">
          <div className="flex items-center justify-between gap-5 mb-2 px-2.5 py-0.5">
            <h6 className="text-sm font-semibold leading-[150%] text-gray-900">
              All messages
            </h6>
            <Link href="#" className="hover:underline">
              <h5 className="text-xs font-medium leading-[150%] text-primary tracking-[-2%]">
                See All
              </h5>
            </Link>
          </div>
          <div className="space-y-2">
            {Messages.map((msg, index) => (
              <div
                className="flex items-start gap-3 p-2.5 cursor-pointer hover:bg-gray-100 rounded-md"
                key={index}
              >
                <Avatar className="size-10">
                  <AvatarImage src={msg.avatar} alt="AH" sizes="" />
                  <AvatarFallback>AH</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-sm leading-5 text-gray-900">
                    {msg.sender}
                  </p>
                  <p className="text-xs leading-4 text-gray-500">
                    {msg.message}
                  </p>
                </div>
                <span className="text-gray-500 font-medium text-xs leading-4 shrink-0 ml-3">
                  {msg.time}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 border border-gray-200 rounded-md shadow-xs">
          <div className="flex items-center justify-between gap-5 mb-2 px-2 py-0.5">
            <h6 className="text-sm font-semibold leading-[150%] text-gray-900">
              Documents
            </h6>
            <Link href="#" className="hover:underline">
              <h5 className="text-xs font-medium leading-[150%] text-primary tracking-[-2%]">
                See All
              </h5>
            </Link>
          </div>
          <div className="space-y-2">
            {Documents.map((doc, index) => (
              <div
                className="flex items-start gap-3 p-2.5 cursor-pointer border border-gray-100 hover:bg-gray-100 rounded-md"
                key={index}
              >
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
                    {doc.name}
                  </p>
                  <p className="text-sm leading-5 text-gray-600">
                    Updated: {doc.date}
                  </p>
                </div>
                <Badge
                  className={cn(
                    "rounded-full py-0.5 px-2 flex items-center gap-1.5 font-archivo font-medium text-xs leading-4.5",
                    DocumentTagColorMap[doc.tag].bg,
                    DocumentTagColorMap[doc.tag].text
                  )}
                >
                  <div
                    className={cn(
                      "size-1.5 rounded-full",
                      DocumentTagColorMap[doc.tag].dotColor
                    )}
                  ></div>
                  {doc.tag}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
