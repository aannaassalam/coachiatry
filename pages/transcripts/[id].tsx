"use client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { SmartAvatar } from "@/components/ui/smart-avatar";
import { Textarea } from "@/components/ui/textarea";
import { getTranscription } from "@/external-api/functions/transcriptions.api";
import assets from "@/json/assets";
import AppLayout from "@/layouts/AppLayout";
import { cn } from "@/lib/utils";
import {
  EachTranscription,
  Transcription
} from "@/typescript/interface/transcription.interface";
import { useQuery } from "@tanstack/react-query";
import moment from "moment";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

const TranscriptHeader = ({
  showSummary,
  generateTask,
  transcription,
  isLoading
}: {
  showSummary: () => void;
  generateTask: () => void;
  transcription?: Transcription;
  isLoading?: boolean;
}) => {
  if (isLoading)
    return (
      <>
        <div className="flex justify-between mt-5 items-center">
          <div className="flex gap-2.5 items-center">
            <div className="size-6 rounded-full bg-gray-200 animate-pulse" />
            <span className="h-5 w-20 bg-gray-200 animate-pulse rounded-sm" />
          </div>
          <div className="w-25 h-6 rounded-sm bg-gray-200 animate-pulse" />
        </div>
        <div className="w-full">
          <div className="w-2/3 mt-4 h-8 bg-gray-200 rounded-sm animate-pulse" />
        </div>
        <div className="border-1 border-[#E6E6E6] p-4 rounded-[6px] mt-4">
          <div className="w-25 h-7 bg-gray-200 animate-pulse rounded-sm" />
          <div className="grid grid-cols-3 w-full mt-4 gap-4 max-sm:grid-cols-1">
            <div className="flex-1 h-10.5 bg-gray-200 animate-pulse rounded-md" />
            <div className="flex-1 h-10.5 bg-gray-200 animate-pulse rounded-md" />
            <div className="flex-1 h-10.5 bg-gray-200 animate-pulse rounded-md" />
          </div>
        </div>
      </>
    );

  return (
    <>
      <div className="flex justify-between mt-5 items-center">
        <div className="flex gap-2.5 items-center">
          <SmartAvatar
            src={transcription?.user?.photo}
            name={transcription?.user?.fullName}
            className="size-6"
          />
          <span className="text-sm text-gray-900 font-lato font-medium">
            {transcription?.user?.fullName}
          </span>
        </div>
        <div className="flex gap-2 items-center">
          <Image
            src={assets.icons.calendar}
            width={16}
            height={16}
            alt="calendar"
          />
          <span className="text-sm">
            {moment(transcription?.createdAt).format("MMM DD,YYYY")}
          </span>
        </div>
      </div>
      <h2 className="text-gray-900 font-archivo text-2xl tracking-[-3%] font-semibold mt-4 max-sm:text-xl ">
        {transcription?.title}
      </h2>
      <div className="border-1 border-[#E6E6E6] p-4 rounded-[6px] mt-4">
        <p className="font-archivo font-medium text-lg">AI Tools</p>
        <div className="grid grid-cols-3 w-full mt-4 gap-4 max-sm:grid-cols-1">
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

const TranscriptionsSection = ({
  transcriptions,
  isLoading
}: {
  transcriptions: EachTranscription[];
  isLoading?: boolean;
}) => {
  if (isLoading)
    return (
      <div className="flex flex-col items-start mt-4">
        <h3 className="font-medium text-lg text-gray-900 mb-4">
          Transcription
        </h3>
        <div className="flex gap-2.5 mb-4 items-start">
          <div className="size-8 rounded-full bg-gray-200 animate-pulse" />
          <div>
            <div className="flex gap-2 items-center">
              <div className="h-5 w-17 bg-gray-200 rounded-sm animate-pulse" />
              <div className="w-1 h-1 bg-gray-400 rounded-full" />
              <div className="w-12.5 h-4 bg-gray-200 rounded-sm animate-pulse" />
            </div>
            <div className="h-5 w-50 animate-pulse bg-gray-200 rounded-sm mt-1.5" />
          </div>
        </div>
        <div className="flex gap-2.5 mb-4 items-start">
          <div className="size-8 rounded-full bg-gray-200 animate-pulse" />
          <div>
            <div className="flex gap-2 items-center">
              <div className="h-5 w-17 bg-gray-200 rounded-sm animate-pulse" />
              <div className="w-1 h-1 bg-gray-400 rounded-full" />
              <div className="w-12.5 h-4 bg-gray-200 rounded-sm animate-pulse" />
            </div>
            <div className="h-5 w-100 animate-pulse bg-gray-200 rounded-sm mt-1.5" />
          </div>
        </div>
        <div className="flex gap-2.5 mb-4 items-start">
          <div className="size-8 rounded-full bg-gray-200 animate-pulse" />
          <div>
            <div className="flex gap-2 items-center">
              <div className="h-5 w-17 bg-gray-200 rounded-sm animate-pulse" />
              <div className="w-1 h-1 bg-gray-400 rounded-full" />
              <div className="w-12.5 h-4 bg-gray-200 rounded-sm animate-pulse" />
            </div>
            <div className="h-5 w-55 animate-pulse bg-gray-200 rounded-sm mt-1.5" />
            <div className="h-5 w-90 animate-pulse bg-gray-200 rounded-sm mt-1.5" />
          </div>
        </div>
        <div className="flex gap-2.5 mb-4 items-start">
          <div className="size-8 rounded-full bg-gray-200 animate-pulse" />
          <div>
            <div className="flex gap-2 items-center">
              <div className="h-5 w-17 bg-gray-200 rounded-sm animate-pulse" />
              <div className="w-1 h-1 bg-gray-400 rounded-full" />
              <div className="w-12.5 h-4 bg-gray-200 rounded-sm animate-pulse" />
            </div>
            <div className="h-5 w-70 animate-pulse bg-gray-200 rounded-sm mt-1.5" />
          </div>
        </div>
        <div className="flex gap-2.5 mb-4 items-start">
          <div className="size-8 rounded-full bg-gray-200 animate-pulse" />
          <div>
            <div className="flex gap-2 items-center">
              <div className="h-5 w-17 bg-gray-200 rounded-sm animate-pulse" />
              <div className="w-1 h-1 bg-gray-400 rounded-full" />
              <div className="w-12.5 h-4 bg-gray-200 rounded-sm animate-pulse" />
            </div>
            <div className="h-5 w-30 animate-pulse bg-gray-200 rounded-sm mt-1.5" />
          </div>
        </div>
        <div className="flex gap-2.5 mb-4 items-start">
          <div className="size-8 rounded-full bg-gray-200 animate-pulse" />
          <div>
            <div className="flex gap-2 items-center">
              <div className="h-5 w-17 bg-gray-200 rounded-sm animate-pulse" />
              <div className="w-1 h-1 bg-gray-400 rounded-full" />
              <div className="w-12.5 h-4 bg-gray-200 rounded-sm animate-pulse" />
            </div>
            <div className="h-5 w-50 animate-pulse bg-gray-200 rounded-sm mt-1.5" />
          </div>
        </div>
        <div className="flex gap-2.5 mb-4 items-start">
          <div className="size-8 rounded-full bg-gray-200 animate-pulse" />
          <div>
            <div className="flex gap-2 items-center">
              <div className="h-5 w-17 bg-gray-200 rounded-sm animate-pulse" />
              <div className="w-1 h-1 bg-gray-400 rounded-full" />
              <div className="w-12.5 h-4 bg-gray-200 rounded-sm animate-pulse" />
            </div>
            <div className="h-5 w-100 animate-pulse bg-gray-200 rounded-sm mt-1.5" />
          </div>
        </div>
      </div>
    );

  const startTime = transcriptions[0]?.timestamp;

  return (
    <div className="flex flex-col items-start mt-4">
      <h3 className="font-medium text-lg text-gray-900 mb-4">Transcription</h3>
      {transcriptions.map((transcription) => (
        <div key={transcription._id} className="flex gap-2.5 mb-4 items-start">
          <SmartAvatar
            src={transcription.profile}
            name={transcription.name}
            className="size-8"
          />
          <div>
            <div className="flex gap-2 items-center">
              <p className="font-lato font-medium tracking-[-2%] text-gray-900">
                {transcription.name}
              </p>
              <span className="w-1 h-1 bg-gray-400 rounded-full" />
              <p className="font-lato text-primary text-xs">
                {moment
                  .utc(moment(transcription.timestamp).diff(moment(startTime)))
                  .format("HH:mm:ss")}
              </p>
            </div>
            <p className="font-lato text-sm text-gray-600 mt-0.5">
              {transcription.text}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

function TranscriptsDescription() {
  const { id } = useParams();
  const [showDetailSummaryBox, setShowDetailSummaryBox] = useState(false);
  const [showGenerateTaskBox, setShowGenerateTaskBox] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["transcriptions", id],
    queryFn: () => getTranscription(id as string)
  });

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
        transcription={data}
        isLoading={isLoading}
      />
      {showGenerateTaskBox && <GenerateTaskBox />}
      {showDetailSummaryBox && <DetailsSummaryBox />}
      <TranscriptionsSection
        transcriptions={data?.transcriptions ?? []}
        isLoading={isLoading}
      />
    </AppLayout>
  );
}

export default TranscriptsDescription;
