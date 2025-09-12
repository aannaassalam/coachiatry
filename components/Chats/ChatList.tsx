import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
// import assets from "@/json/assets";
import { cn } from "@/lib/utils";

const messages = [
  {
    id: 1,
    name: "Eleanor Pena",
    message: "Paperless opt-out email sent",
    time: "5s",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    unread: false
  },
  {
    id: 2,
    name: "Cody Fisher",
    message:
      "Im trying to book an appointment but the assistant isnt picking up the phone....",
    time: "59m",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    unread: false
  },
  {
    id: 3,
    name: "We Are Three",
    message:
      "I have something on my mind that's been bothering me, but I'm not sure",
    time: "1h",
    avatar: null,
    unread: false
  },
  {
    id: 4,
    name: "Robert Fox",
    message:
      "I've been procrastinating on important tasks, and it's causing unnecessary stress.",
    time: "2w",
    avatar: "https://randomuser.me/api/portraits/men/65.jpg",
    unread: true
  },
  {
    id: 5,
    name: "Albert Flores",
    message: "😩 Cansei de filme de herói 😭",
    time: "2w",
    avatar: "https://randomuser.me/api/portraits/men/28.jpg",
    unread: false
  },
  {
    id: 6,
    name: "Cooper, Kristin",
    message: "I'm trying to adopt a more sustainable lifestyle",
    time: "3w",
    avatar: "https://randomuser.me/api/portraits/women/19.jpg",
    unread: true
  },
  {
    id: 1,
    name: "Eleanor Pena",
    message: "Paperless opt-out email sent",
    time: "5s",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    unread: false
  },
  {
    id: 6,
    name: "Cooper, Kristin",
    message: "I'm trying to adopt a more sustainable lifestyle",
    time: "3w",
    avatar: "https://randomuser.me/api/portraits/women/19.jpg",
    unread: true
  }
];

export default function ChatList() {
  return (
    <div className="max-w-md mr-auto bg-white pt-4 rounded-lg flex flex-col">
      {/* Header / Content Above */}
      <h2 className="text-sm font-semibold mb-3 text-gray-800 pl-3">
        All messages
      </h2>

      {/* Scrollable List */}
      <ul className="space-y-2 overflow-y-auto pr-2 pb-6 max-h-[calc(100vh-200px)]">
        {messages.map((msg) => (
          <li
            key={msg.id}
            className="flex cursor-pointer items-start justify-between py-2.5 px-3 rounded-[8px] hover:bg-gray-100 transition"
          >
            <div className="flex items-start space-x-3">
              <Avatar className="size-10">
                <AvatarImage src={msg.avatar ?? undefined} alt="AH" />
                <AvatarFallback className=" bg-orange-100 flex items-center justify-center font-semibold text-orange-600">
                  {msg.name[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium  text-sm text-gray-900">
                    {msg.name}
                  </span>
                  {msg.unread && (
                    <span className="w-[7px] h-[7px] rounded-full bg-primary"></span>
                  )}
                </div>
                <p
                  className={cn(
                    "text-xs text-gray-500 truncate w-56",
                    msg.unread && "font-semibold"
                  )}
                >
                  {msg.message}
                </p>
              </div>
            </div>
            <span className="text-xs text-gray-500 whitespace-nowrap ">
              {msg.time}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
