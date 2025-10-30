import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import assets from "@/json/assets";
import { cn } from "@/lib/utils";
import { Editor } from "@tiptap/react";
import EmojiPicker, { EmojiStyle } from "emoji-picker-react";
import Image from "next/image";
import { useState } from "react";
import { FiBold } from "react-icons/fi";
import { TbItalic } from "react-icons/tb";

export default function Toolbar({ editor }: { editor: Editor | null }) {
  const [showEmoji, setShowEmoji] = useState(false);

  if (!editor) return null;

  const insertLink = async () => {
    const url = window.prompt("Enter URL");
    if (!url) return;
    // If selection already has a link, toggle it with new href
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const removeLink = () => editor.chain().focus().unsetLink().run();

  // helpers for active states
  const isActive = (name: string, attrs?: Record<string, any>) =>
    editor.isActive(name, attrs as any);

  const addEmoji = (emoji: any) => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .insertContent(emoji.emoji) // insert emoji directly into editor
      .run();
    // setShowEmojiPicker(false);
  };

  return (
    <div className="flex gap-1 py-3 px-4 self-end max-sm:!px-0 relative">
      <Button
        variant="ghost"
        className="p-1.5 max-sm:p-0.5 hover:bg-gray-200"
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Image
          src={assets.icons.undo}
          alt="undo"
          width={24}
          height={24}
          className="max-sm:w-5 max-sm:h-5"
        />
      </Button>
      <Button
        variant="ghost"
        className="p-1.5 max-sm:p-0.5 hover:bg-gray-200"
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Image
          src={assets.icons.redo}
          alt="redo"
          width={24}
          height={24}
          className="max-sm:w-5 max-sm:h-5"
        />
      </Button>

      <Separator orientation="vertical" className="mx-1.5" />

      <Button
        variant="ghost"
        className={cn("p-1.5 max-sm:p-0.5 hover:bg-gray-200", {
          "bg-gray-200": isActive("bold")
        })}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <FiBold className="text-primary size-6 max-sm:size-5" />
      </Button>
      <Button
        variant="ghost"
        className={cn("p-1.5 max-sm:p-0.5 hover:bg-gray-200", {
          "bg-gray-200": isActive("italic")
        })}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <TbItalic className="text-primary size-6 max-sm:size-5" />
      </Button>
      <Button
        variant="ghost"
        className={cn("p-1.5 max-sm:p-0.5 hover:bg-gray-200", {
          "bg-gray-200": isActive("underline")
        })}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <Image
          src={assets.icons.underline}
          alt="redo"
          width={24}
          height={24}
          className="max-sm:w-5 max-sm:h-5"
        />
      </Button>
      <Button
        variant="ghost"
        className={cn("p-1.5 max-sm:p-0.5 hover:bg-gray-200", {
          "bg-gray-200": isActive("strike")
        })}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Image
          src={assets.icons.strikethrough}
          alt="redo"
          width={24}
          height={24}
          className="max-sm:w-5 max-sm:h-5"
        />
      </Button>

      <Separator orientation="vertical" className="mx-1.5" />

      <Button
        variant="ghost"
        className={cn("p-1.5 max-sm:p-0.5 hover:bg-gray-200", {
          "bg-gray-200": isActive("bulletList")
        })}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <Image
          src={assets.icons.unorderedList}
          alt="redo"
          width={24}
          height={24}
          className="max-sm:w-5 max-sm:h-5"
        />
      </Button>

      <Button
        variant="ghost"
        className={cn("p-1.5 max-sm:p-0.5 hover:bg-gray-200", {
          "bg-gray-200": isActive("orderedList")
        })}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <Image
          src={assets.icons.orderedList}
          alt="redo"
          width={24}
          height={24}
          className="max-sm:w-5 max-sm:h-5"
        />
      </Button>

      <Button
        variant="ghost"
        className={cn("p-1.5 max-sm:p-0.5 hover:bg-gray-200", {
          "bg-gray-200": isActive("textAlign", { textAlign: "left" })
        })}
        onClick={() => editor.chain().focus().toggleTextAlign("left").run()}
      >
        <Image
          src={assets.icons.alignLeft}
          alt="redo"
          width={24}
          height={24}
          className="max-sm:w-5 max-sm:h-5"
        />
      </Button>

      <Separator orientation="vertical" className="mx-1.5" />

      <Button
        variant="ghost"
        className={cn("p-1.5 max-sm:p-0.5 hover:bg-gray-200", {
          "bg-gray-200": isActive("link")
        })}
        onClick={isActive("link") ? removeLink : insertLink}
      >
        <Image
          src={assets.icons.link}
          alt="redo"
          width={24}
          height={24}
          className="max-sm:w-5 max-sm:h-5"
        />
      </Button>

      <Button
        variant="ghost"
        className="p-1.5 max-sm:p-0.5 hover:bg-gray-200"
        onClick={() => setShowEmoji((prev) => !prev)}
      >
        <Image
          src={assets.icons.emojiDoc}
          alt="redo"
          width={24}
          height={24}
          className="max-sm:w-5 max-sm:h-5"
        />
      </Button>
      <EmojiPicker
        open={showEmoji}
        previewConfig={{
          showPreview: false
        }}
        onEmojiClick={addEmoji}
        className="!absolute bottom-15 right-0 z-50"
        emojiVersion="5.0"
        emojiStyle={EmojiStyle.NATIVE}
      />
    </div>
  );
}
