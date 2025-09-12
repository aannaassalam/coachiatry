import { useState } from "react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import assets from "@/json/assets";
import { Button } from "../ui/button";
import { Ellipsis } from "lucide-react";

type Message = {
  sender: "user" | "other";
  text: string;
};

export default function ChatConversation() {
  const [messages, setMessages] = useState<Message[]>([
    { sender: "other", text: "when will it be ready?" },
    { sender: "other", text: "Great service." },
    { sender: "other", text: "tastes amazing!" },
    {
      sender: "other",
      text: "The crafting system in this game is so well thought out."
    },
    {
      sender: "other",
      text: "🙏🕊️ Sometimes, it's essential to take a step back and find moments of peace in our hectic lives. 🌌☁️"
    },
    {
      sender: "user",
      text: "Im trying to book an appointment but the assistant isnt picking up the phone. Can I book here?"
    },
    {
      sender: "user",
      text: "I'm cautious about crypto. It's unpredictable."
    },
    {
      sender: "other",
      text: "Absolutely, you can book directly here. Just let me know your preferred time."
    },
    {
      sender: "user",
      text: "Cool. How about Thursday at 3 PM?"
    },
    {
      sender: "other",
      text: "Let me check... Yes, that's available. I've penciled you in."
    },
    {
      sender: "other",
      text: "By the way, have you tried our new seasonal menu?"
    },
    {
      sender: "user",
      text: "Not yet. What's new on it?"
    },
    {
      sender: "other",
      text: "We've added a truffle mushroom risotto and a smoked beetroot salad. People love it!"
    },
    {
      sender: "user",
      text: "That sounds amazing. I’ll definitely try it next time."
    }
  ]);

  const handleSend = (msg: string) => {
    setMessages([...messages, { sender: "user", text: msg }]);
  };

  return (
    <div className="flex flex-col border-r border-l border-gray-200">
      <div className="flex justify-between items-center p-4 border-b bg-white">
        <div className="flex items-center  gap-4">
          <Avatar className="size-10">
            <AvatarImage src={assets.avatar ?? undefined} alt="AH" />
            <AvatarFallback className=" bg-orange-100 flex items-center justify-center font-semibold text-orange-600">
              AH
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold font-lato text-base">Jane Cooper</p>
            <p className=" text-xs font-lato flex items-center gap-1">
              <span className="bg-green-500 rounded-full w-2 h-2 flex"></span>{" "}
              Online
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="hover:bg-secondary">
          <Ellipsis className="text-gray-500" />
        </Button>
      </div>

      <div className="max-h-[calc(100vh-320px)] overflow-y-auto px-4 py-2 bg-gray-50">
        {messages.map((msg, idx) => {
          const previous = messages[idx - 1];
          const showAvatar =
            msg.sender === "other" && previous?.sender !== "other";

          return (
            <ChatMessage
              key={idx}
              sender={msg.sender}
              message={msg.text}
              showAvatar={showAvatar}
            />
          );
        })}
      </div>

      <ChatInput onSend={handleSend} />
    </div>
  );
}
