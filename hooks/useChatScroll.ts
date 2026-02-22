import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Message } from "@/typescript/interface/message.interface";

export type ChatScrollRefs = {
  topRef: React.RefObject<HTMLDivElement | null>;
  bottomRef: React.RefObject<HTMLDivElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
};

type UseChatScrollOptions = {
  room: string;
  messages: Message[];
};

export const useChatScroll = ({ room, messages }: UseChatScrollOptions) => {
  const topRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const didInitialScroll = useRef(false);
  const needsInitialScroll = useRef(false);
  const prevMessageCount = useRef(0);
  const [isAtBottom, setIsAtBottom] = useState(true);

  useEffect(() => {
    didInitialScroll.current = false;
    needsInitialScroll.current = true;
    prevMessageCount.current = 0;
  }, [room]);

  useLayoutEffect(() => {
    if (!messages || !bottomRef.current) return;

    const newCount = messages.length;

    const scrollToBottomNow = (behavior: ScrollBehavior) => {
      if (containerRef.current) {
        containerRef.current.scrollTo({
          top: containerRef.current.scrollHeight,
          behavior
        });
      } else {
        bottomRef.current?.scrollIntoView({ behavior, block: "end" });
      }
    };

    if (needsInitialScroll.current && newCount > 0) {
      // Run synchronously after DOM paint but before the frame is shown.
      scrollToBottomNow("auto");
      needsInitialScroll.current = false;
      didInitialScroll.current = true;
      prevMessageCount.current = newCount;
      return;
    }

    if (newCount > prevMessageCount.current && isAtBottom) {
      scrollToBottomNow("smooth");
    }

    prevMessageCount.current = newCount;
  }, [messages, isAtBottom]);

  const scrollToBottom = (opts?: { immediate?: boolean }) => {
    const behavior: ScrollBehavior = opts?.immediate ? "auto" : "smooth";
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior
      });
      return;
    }
    bottomRef.current?.scrollIntoView({ behavior, block: "end" });
  };

  return {
    topRef,
    bottomRef,
    containerRef,
    isAtBottom,
    setIsAtBottom,
    scrollToBottom
  };
};
