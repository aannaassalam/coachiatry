import { emojiCategories } from "@/lib/emojis";
import React, { useState, Dispatch, SetStateAction } from "react";
import { Button } from "../ui/button";
import Image from "next/image";
import assets from "@/json/assets";
import { Input } from "../ui/input";
import { PopoverClose } from "@radix-ui/react-popover";

type EmojiCategory = {
  name: string;
  icon: string;
  emojis: string[];
};

type EmojiPickerProps = {
  setSelectedEmoji: Dispatch<SetStateAction<string | null>>;
};

const EmojiPicker: React.FC<EmojiPickerProps> = ({ setSelectedEmoji }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<string>("smileys");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const mainEmojis: { emoji: string; label: string }[] = [
    { emoji: "✅", label: "check" },
    { emoji: "👀", label: "eyes" },
    { emoji: "🙌", label: "raised hands" },
    { emoji: "🔥", label: "fire" },
    { emoji: "😃", label: "grinning" },
    { emoji: "👍", label: "thumbs up" },
    { emoji: "🤔", label: "thinking" }
  ];

  const handleEmojiClick = (index: number) => {
    setSelectedIndex(selectedIndex === index ? null : index);
  };

  const handleEmojiSelect = (emoji: string) => {
    setShowEmojiPicker(false);
    setSelectedEmoji(emoji); // <-- send to parent
  };

  const filteredEmojis = (): string[] => {
    if (!searchQuery) {
      return Object(emojiCategories)[activeCategory]?.emojis ?? [];
    }

    const allEmojis = Object.values(emojiCategories).flatMap(
      (cat) => cat.emojis
    );
    return allEmojis.filter((emoji) =>
      emoji.includes(searchQuery.toLowerCase())
    );
  };

  return (
    <div className="flex items-center justify-center">
      <div className="relative -top-[50%]">
        {/* Main emoji reaction bar */}
        <div className="bg-white rounded-full shadow-lg p-2 flex items-center gap-0 overflow-y-auto">
          {!showEmojiPicker && (
            <>
              {mainEmojis.map((item, index) => (
                <PopoverClose>
                  <Button
                    variant="ghost"
                    key={index}
                    onClick={() => handleEmojiSelect(item.emoji)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xl hover:bg-gray-100 transition-all duration-200 transform hover:scale-110 ${
                      selectedIndex === index ? "bg-blue-100 scale-110" : ""
                    }`}
                    title={item.label}
                  >
                    {item.emoji}
                  </Button>
                </PopoverClose>
              ))}
            </>
          )}
          {/* Add more button */}
          <Button
            variant="ghost"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`w-10 h-10 rounded-full p-0 flex items-center justify-center text-xl hover:bg-gray-100 transition-all duration-200 transform hover:scale-110 ${
              showEmojiPicker ? "bg-gray-100 scale-110 hidden" : ""
            }`}
            title="Add reaction"
          >
            <span className="text-gray-400">
              <Image
                src={assets.icons.emoji}
                alt="add"
                width={20}
                height={20}
              />
            </span>
          </Button>
        </div>

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="absolute -bottom-[140px] mt-2 -right-[160px] bg-white rounded-2xl shadow-xl border w-80 h-70 z-50">
            {/* Search bar */}
            <div className="p-3 border-b">
              <Input
                type="text"
                placeholder="Search emojis..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 bg-gray-100 rounded-full text-sm"
              />
            </div>
            {/* Category tabs */}
            <div className="flex overflow-x-auto border-b bg-gray-50 px-1 py-1.5 gap-0.25">
              {Object.entries(emojiCategories).map(([key, category]) => (
                <Button
                  variant="ghost"
                  key={key}
                  onClick={() => {
                    setActiveCategory(key);
                    setSearchQuery("");
                  }}
                  className={`flex-shrink-0 px-2 py-1 rounded-sm text-base transition-colors ${
                    activeCategory === key ? "bg-blue-100" : "hover:bg-gray-200"
                  }`}
                  title={category.name}
                >
                  {category.icon}
                </Button>
              ))}
            </div>
            {/* Emoji grid */}
            <div className="p-2 flex-1 overflow-y-auto h-40">
              <div className="grid grid-cols-8 gap-1">
                {filteredEmojis()?.map((emoji, index) => (
                  <PopoverClose>
                    <Button
                      variant="ghost"
                      key={index}
                      onClick={() => handleEmojiSelect(emoji)}
                      className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-100 rounded transition-colors"
                      title={emoji}
                    >
                      {emoji}
                    </Button>
                  </PopoverClose>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmojiPicker;
