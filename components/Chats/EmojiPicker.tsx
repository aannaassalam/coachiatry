import assets from "@/json/assets";
import { PopoverClose } from "@radix-ui/react-popover";
import Picker, { EmojiStyle } from "emoji-picker-react";
import Image from "next/image";
import React, { useState } from "react";
import { Button } from "../ui/button";

type EmojiPickerProps = {
  setSelectedEmoji: (emoji: string) => void;
  /** Skip the quick-reaction bar and open the full picker straight away. */
  largePicker?: boolean;
};

/** Quick reactions offered before the full picker is opened. */
const QUICK_REACTIONS = [
  { emoji: "✅", label: "check" },
  { emoji: "👀", label: "eyes" },
  { emoji: "🙌", label: "raised hands" },
  { emoji: "🔥", label: "fire" },
  { emoji: "😮", label: "face with open mouth" },
  { emoji: "👍", label: "thumbs up" }
];

const EmojiPicker: React.FC<EmojiPickerProps> = ({
  setSelectedEmoji,
  largePicker = false
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(largePicker);

  if (showEmojiPicker) {
    // Same picker the markdown toolbar uses. It replaced a hand-rolled
    // search/category/grid built on a 850-line emoji table whose search compared
    // the emoji glyph against the typed text, so it never matched anything.
    return (
      <Picker
        open
        width={320}
        height={280}
        previewConfig={{ showPreview: false }}
        emojiStyle={EmojiStyle.NATIVE}
        onEmojiClick={({ emoji }) => {
          setShowEmojiPicker(false);
          setSelectedEmoji(emoji);
        }}
      />
    );
  }

  return (
    <div className="bg-white rounded-full shadow-lg p-1 px-2 flex items-center gap-0 overflow-y-auto">
      {QUICK_REACTIONS.map((item) => (
        <PopoverClose key={item.emoji}>
          <Button
            variant="ghost"
            onClick={() => setSelectedEmoji(item.emoji)}
            className="p-0 size-8.5 rounded-full flex items-center justify-center text-xl hover:bg-gray-100 transition-all duration-200 transform hover:scale-110"
            title={item.label}
            center
          >
            {item.emoji}
          </Button>
        </PopoverClose>
      ))}
      <Button
        variant="ghost"
        onClick={() => setShowEmojiPicker(true)}
        className="size-8.5 rounded-full p-0 flex items-center justify-center text-xl hover:bg-gray-100 transition-all duration-200 transform hover:scale-110"
        title="Add reaction"
        center
      >
        <span className="text-gray-400">
          <Image src={assets.icons.emoji} alt="add" width={20} height={20} />
        </span>
      </Button>
    </div>
  );
};

export default EmojiPicker;
