"use client";

import { Button } from "@/components/ui/button";
import { SmartAvatar } from "@/components/ui/smart-avatar";
import { useConversationDetails } from "@/hooks/useConversationDetails";
import { useFloatingChat } from "@/lib/floatingChatContext";
import { cn } from "@/lib/utils";
import {
  animate,
  DragControls,
  motion,
  useDragControls,
  useMotionValue
} from "framer-motion";
import { ArrowLeft, ChevronDown, ChevronUp, X } from "lucide-react";
import { useEffect, useState } from "react";
import FloatingChatWindow from "./FloatingChatWindow";
import FloatingConversationList from "./FloatingConversationList";

const PANEL_WIDTH = 340;
const EXPANDED_HEIGHT = 480;
const COLLAPSED_HEIGHT = 48;
const EDGE_PADDING = 16;

export default function FloatingChatPanel() {
  const {
    isCollapsed,
    openRoomId,
    offsetX,
    setOffsetX,
    toggleCollapse,
    closePanel,
    backToList
  } = useFloatingChat();

  const dragControls = useDragControls();
  const x = useMotionValue(-offsetX);
  const [maxOffset, setMaxOffset] = useState(0);

  useEffect(() => {
    const computeBounds = () => {
      if (typeof window === "undefined") return;
      setMaxOffset(
        Math.max(0, window.innerWidth - PANEL_WIDTH - EDGE_PADDING * 2)
      );
    };
    computeBounds();
    window.addEventListener("resize", computeBounds);
    return () => window.removeEventListener("resize", computeBounds);
  }, []);

  // Keep the motion value in sync with persisted offset and viewport bounds.
  useEffect(() => {
    const clamped = Math.min(Math.max(offsetX, 0), maxOffset);
    if (clamped !== offsetX) setOffsetX(clamped);
    x.set(-clamped);
  }, [offsetX, maxOffset, setOffsetX, x]);

  const handleDragEnd = () => {
    const currentX = x.get();
    const nextOffset = Math.min(Math.max(-currentX, 0), maxOffset);
    setOffsetX(nextOffset);
    animate(x, -nextOffset, { type: "spring", stiffness: 300, damping: 30 });
  };

  return (
    <motion.div
      drag="x"
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={{ left: -maxOffset, right: 0 }}
      onDragEnd={handleDragEnd}
      animate={{ height: isCollapsed ? COLLAPSED_HEIGHT : EXPANDED_HEIGHT }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      style={{
        x,
        width: PANEL_WIDTH,
        right: EDGE_PADDING,
        bottom: 0
      }}
      className="fixed z-50 flex flex-col overflow-hidden bg-white border border-gray-200 rounded-t-xl shadow-2xl"
    >
      <PanelHeader
        dragControls={dragControls}
        roomId={openRoomId}
        isCollapsed={isCollapsed}
        onCollapse={toggleCollapse}
        onClose={closePanel}
        onBack={openRoomId ? backToList : undefined}
      />

      {!isCollapsed && (
        <div className="flex-1 min-h-0 flex flex-col">
          {openRoomId ? (
            <FloatingChatWindow roomId={openRoomId} />
          ) : (
            <FloatingConversationList />
          )}
        </div>
      )}
    </motion.div>
  );
}

type HeaderProps = {
  roomId: string | null;
  isCollapsed: boolean;
  onCollapse: () => void;
  onClose: () => void;
  onBack?: () => void;
  dragControls: DragControls;
};

const PanelHeader = ({
  roomId,
  isCollapsed,
  onCollapse,
  onClose,
  onBack,
  dragControls
}: HeaderProps) => {
  return (
    <div
      onPointerDown={(e) => {
        // Only start dragging when the press lands on the header surface itself,
        // not on an interactive child (buttons stop propagation below).
        dragControls.start(e);
      }}
      className={cn(
        "flex items-center gap-2 px-3 h-12 border-b bg-white select-none",
        "cursor-grab active:cursor-grabbing flex-shrink-0"
      )}
    >
      {onBack && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onBack();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="inline-flex items-center justify-center size-7 rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-100 -ml-1 flex-shrink-0 cursor-pointer"
          aria-label="Back"
        >
          <ArrowLeft size={16} />
        </button>
      )}
      <HeaderTitle roomId={roomId} />
      <div
        className="ml-auto flex items-center gap-0.5 flex-shrink-0"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <Button
          type="button"
          variant="ghost"
          center
          className="size-7 p-0 rounded-md text-gray-500 hover:text-gray-800"
          onClick={onCollapse}
          title={isCollapsed ? "Expand" : "Collapse"}
        >
          {isCollapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </Button>
        <Button
          type="button"
          variant="ghost"
          center
          className="size-7 p-0 rounded-md text-gray-500 hover:text-gray-800"
          onClick={onClose}
          title="Close"
        >
          <X size={16} />
        </Button>
      </div>
    </div>
  );
};

const HeaderTitle = ({ roomId }: { roomId: string | null }) => {
  const { conversation, details, isLoading } = useConversationDetails(
    roomId ?? ""
  );

  if (!roomId) {
    return (
      <span className="text-sm font-semibold text-gray-800">Messages</span>
    );
  }

  if (isLoading || !conversation) {
    return (
      <div className="flex items-center gap-2">
        <div className="size-7 bg-gray-200 rounded-full animate-pulse" />
        <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 min-w-0">
      <SmartAvatar
        src={details.photo}
        name={details.name}
        className="size-7 flex-shrink-0"
      />
      <p className="text-xs font-semibold truncate leading-tight">
        {details.name}
      </p>
    </div>
  );
};
