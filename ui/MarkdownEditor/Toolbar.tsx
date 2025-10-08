import { useState } from "react";
import { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import assets from "@/json/assets";
import { Separator } from "@/components/ui/separator";
import { FiBold } from "react-icons/fi";
import { TbItalic } from "react-icons/tb";
import { PiTextUnderlineBold } from "react-icons/pi";
import { cn } from "@/lib/utils";

export default function Toolbar({ editor }: { editor: Editor | null }) {
  const [showEmoji, setShowEmoji] = useState(false);

  const button = (
    label: React.ReactNode,
    onClick: () => void,
    active = false
  ) => (
    <button
      onClick={onClick}
      type="button"
      className={`px-2 py-1 rounded hover:bg-gray-200 focus:outline-none ${active ? "bg-gray-300" : ""}`}
    >
      {label}
    </button>
  );

  if (!editor) return null;

  const insertLink = async () => {
    const url = window.prompt("Enter URL");
    if (!url) return;
    // If selection already has a link, toggle it with new href
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const removeLink = () => editor.chain().focus().unsetLink().run();

  const insertEmoji = (emoji: string) => {
    editor.chain().focus().insertContent(emoji).run();
    setShowEmoji(false);
  };

  // helpers for active states
  const isActive = (name: string, attrs?: Record<string, any>) =>
    editor.isActive(name, attrs as any);

  const debugToggleBullet = () => {
    console.log("isEditable:", editor?.isEditable);
    console.log("isActive codeBlock:", editor?.isActive("codeBlock"));
    console.log("selection:", editor?.state.selection.toJSON());
    console.log("schema nodes:", Object.keys(editor?.state.schema.nodes || {}));
    console.log("schema marks:", Object.keys(editor?.state.schema.marks || {}));
    // try command directly and log result
    try {
      editor?.chain().focus().toggleBulletList().run();
      console.log("After attempt HTML:", editor?.getHTML());
    } catch (e) {
      console.error("toggleBulletList error", e);
    }
  };

  return (
    <div className="flex gap-1 py-3 px-4 self-end max-sm:!px-0">
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
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Image
          src={assets.icons.emojiDoc}
          alt="redo"
          width={24}
          height={24}
          className="max-sm:w-5 max-sm:h-5"
        />
      </Button>
    </div>
  );
}
