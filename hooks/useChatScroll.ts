import { useLayoutEffect, useRef, useState } from "react";
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
  const roomRef = useRef<string | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  useLayoutEffect(() => {
    if (!messages) return;

    // Detect the room change HERE (not in a separate useEffect) so the reset
    // and the initial-scroll consumption happen in the same layout phase. When
    // switching to an already-cached room, `room` and `messages` change in the
    // same commit; a reset in a post-paint useEffect would run too late and the
    // room would open scrolled to the wrong position.
    if (roomRef.current !== room) {
      roomRef.current = room;
      didInitialScroll.current = false;
      needsInitialScroll.current = true;
      prevMessageCount.current = 0;
    }

    if (!bottomRef.current) return;

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
  }, [room, messages, isAtBottom]);

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
