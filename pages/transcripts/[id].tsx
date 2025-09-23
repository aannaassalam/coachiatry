"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import assets from "@/json/assets";
import AppLayout from "@/layouts/AppLayout";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";

const TranscriptHeader = ({
  showSummary,
  generateTask
}: {
  showSummary: () => void;
  generateTask: () => void;
}) => {
  const category: Record<string, Record<string, string>> = {
    health: {
      bg: "bg-amber-200/40",
      text: "text-amber-600/80",
      dotColor: "bg-amber-600/80"
    },
    fitness: {
      bg: "bg-green-100",
      text: "text-green-600/90",
      dotColor: "bg-green-600/90"
    },
    sports: {
      text: "text-red-600/80",
      bg: "bg-red-100/80",
      dotColor: "bg-red-600/80"
    }
  };
  return (
    <>
      <div className="flex justify-between mt-5 items-center">
        <div className="flex gap-2.5 items-center">
          <Avatar className="size-6">
            <AvatarImage src={assets.avatar} alt="AH" />
            <AvatarFallback>AH</AvatarFallback>
          </Avatar>
          <span className="text-sm text-gray-900 font-lato font-medium">
            John Nick
          </span>
        </div>
        <div className="flex gap-6">
          <Badge
            className={cn(
              "rounded-full py-0.5 px-2 flex items-center gap-1.5 font-archivo font-medium text-xs leading-4.5",
              category["health"].bg,
              category["health"].text
            )}
          >
            <div
              className={cn(
                "size-1.5 rounded-full",
                category["health"].dotColor
              )}
            />
            Health
          </Badge>
          <div className="flex gap-2 items-center">
            <Image
              src={assets.icons.calendar}
              width={16}
              height={16}
              alt="calendar"
            />
            <span className="text-sm">Dec 12, 2022</span>
          </div>
        </div>
      </div>
      <h2 className="text-gray-900 font-archivo text-2xl tracking-[-3%] font-semibold mt-4">
        Any mechanical keyboard enthusiasts in design?
      </h2>
      <div className="border-1 border-[#E6E6E6] p-4 rounded-[6px] mt-4">
        <p className="font-archivo font-medium text-lg">AI Tools</p>
        <div className="grid grid-cols-3 w-full mt-4 gap-4">
          <Button
            variant="secondary"
            className="justify-start bg-[#f9f9f9] border-1 border-gray-200"
          >
            <Image
              src={assets.icons.shortSummary}
              width={20}
              height={20}
              alt="shot-summary"
            />
            <p className="font-lato font-medium text-sm text-gray-900 tracking-[-0.05px]">
              Short Summary
            </p>
          </Button>
          <Button
            variant="secondary"
            onClick={showSummary}
            className="justify-start bg-[#f9f9f9] border-1 border-gray-200"
          >
            <Image
              src={assets.icons.detailSummary}
              width={20}
              height={20}
              alt="detail-summary"
            />
            <p className="font-lato font-medium text-sm text-gray-900 tracking-[-0.05px]">
              Detail Summary
            </p>
          </Button>
          <Button
            variant="secondary"
            className="justify-start bg-[#f9f9f9] border-1 border-gray-200"
            onClick={generateTask}
          >
            <Image
              src={assets.icons.generateTask}
              width={20}
              height={20}
              alt="generate-task"
            />
            <p className="font-lato font-medium text-sm text-gray-900 tracking-[-0.05px]">
              Generate Task
            </p>
          </Button>
        </div>
      </div>
    </>
  );
};
const DetailsSummaryBox = () => {
  return (
    <div className="w-full my-5 p-4 border-1 border-gray-200 bg-[#f9f9f9] rounded-[6px] flex flex-col gap-3">
      <p className="font-archivo font-medium text-lg">
        AI Summery Based on Agenda
      </p>
      <Textarea
        placeholder="Ask any thing about the meeting..."
        className="bg-white focus-visible:ring-0"
      />
      <Button className="self-end gradient-button">
        <Image src={assets.icons.aiStar} width={16} height={16} alt="ai" />
        Ask AI
      </Button>
    </div>
  );
};

const GenerateTaskBox = () => {
  return (
    <div className="w-full my-5 p-4 border-1 border-gray-200 bg-[#f9f9f9] rounded-[6px] flex flex-col gap-3">
      <p className="font-archivo font-medium text-lg">My Tasks</p>
      {[1, 1, 1, 1, 1, 1].map((_, id) => (
        <label
          key={id}
          className="bg-white py-3 px-3.5 border-1 border-gray-100 rounded-[8px] cursor-pointer font-lato font-medium text-gray-900"
        >
          <Checkbox
            className={cn(
              "w-4 h-4 mr-4 group-hover:mr-1 transition-all duration-200"
            )}
          />
          Attend Scheduled Appointment - Dr. Sharma
        </label>
      ))}
      <Button className="self-end">Add to Task List</Button>
    </div>
  );
};

const TranscriptionsSection = () => {
  const [transcriptions] = useState([
    {
      name: "John Nick",
      message: "Hi there, how's it going?",
      time: "00:00:00",
      avatar: assets.avatar2
    },
    {
      name: "You",
      message:
        "Hi everyone, thanks for joining. Before we dive into the project updates, can everyone hear me okay? Some friends and I are going hiking on Saturday, weather permitting of course.",
      time: "00:00:05",
      avatar: assets.avatar
    },
    {
      name: "John Nick",
      message:
        "And if you go to a certain place, the video or the audio also jumps to that point. ",
      time: "00:00:12",
      avatar: assets.avatar2
    },
    {
      name: "You",
      message:
        "You can just highlight something and that gives you the option to create notes. Awesome, that sounds promising. Sarah, how’s the development on the product side coming along? Not at the moment, but I’ll keep you posted if anything comes up during the campaign launch.",
      time: "00:00:20",
      avatar: assets.avatar
    },
    {
      name: "John Nick",
      message:
        "Okay, before that, it does try to identify what are the words that are coming up frequently. Sure. We've finalized the digital campaign framework, and our team is set to launch it next week",
      time: "00:00:28",
      avatar: assets.avatar2
    },
    {
      name: "You",
      message:
        "And if you go to a certain place, the video or the audio also jumps to that point.",
      time: "00:00:35",
      avatar: assets.avatar
    }
  ]);
  return (
    <div className="flex flex-col items-start mt-4">
      <h3 className="font-medium text-lg text-gray-900 mb-4">Transcription</h3>
      {transcriptions.map((transcription, id) => (
        <div key={id} className="flex gap-2.5 mb-4 items-start">
          <Avatar className="size-8">
            <AvatarImage src={transcription.avatar} alt="AH" />
            <AvatarFallback>AH</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex gap-2 items-center">
              <p className="font-lato font-medium tracking-[-2%] text-gray-900">
                {transcription.name}
              </p>
              <span className="w-1 h-1 bg-gray-400 rounded-full" />
              <p className="font-lato text-primary text-xs">
                {transcription.time}
              </p>
            </div>
            <p className="font-lato text-sm text-gray-600 mt-0.5">
              {transcription.message}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
function TranscriptsDescription() {
  const [showDetailSummaryBox, setShowDetailSummaryBox] = useState(false);
  const [showGenerateTaskBox, setShowGenerateTaskBox] = useState(false);

  return (
    <AppLayout>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-2 items-center ">
          <Link
            href="/transcripts"
            className="text-sm font-lato font-normal text-gray-600 "
          >
            Transcriptions
          </Link>
          <span className="text-xs text-gray-600">/</span>
          <h1 className="text-sm  font-lato font-semibold text-gray-900 ">
            Transcriptions Details
          </h1>
        </div>
      </div>
      <Separator />
      <TranscriptHeader
        showSummary={() => setShowDetailSummaryBox(!showDetailSummaryBox)}
        generateTask={() => setShowGenerateTaskBox(!showGenerateTaskBox)}
      />
      {showGenerateTaskBox && <GenerateTaskBox />}
      {showDetailSummaryBox && <DetailsSummaryBox />}
      <TranscriptionsSection />
    </AppLayout>
  );
}

export default TranscriptsDescription;
