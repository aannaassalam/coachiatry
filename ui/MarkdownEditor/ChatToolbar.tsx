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

export default function ChatToolbar({
  editor,
  showToolBar
}: {
  editor: Editor | null;
  showToolBar: Boolean;
}) {
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
    <div
      className={cn(
        "absolute top-[-50px] bg-white border-1 border-gray-200 shadow-sm rounded-lg left-0 flex gap-1 p-1 self-end opacity-0  transition-all duration-200",
        showToolBar && "opacity-100 "
      )}
    >
      <Button
        type="button"
        variant="ghost"
        className="p-1 rounded-sm hover:bg-gray-200"
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Image src={assets.icons.undo} alt="undo" width={20} height={20} />
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="p-1 rounded-sm hover:bg-gray-200"
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Image src={assets.icons.redo} alt="redo" width={20} height={20} />
      </Button>

      <Separator orientation="vertical" className="mx-1.5" />

      <Button
        type="button"
        variant="ghost"
        className="p-1 rounded-sm hover:bg-gray-200"
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <FiBold className="text-primary size-5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="p-1 rounded-sm hover:bg-gray-200"
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <TbItalic className="text-primary size-5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="p-1 rounded-sm hover:bg-gray-200"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <Image src={assets.icons.underline} alt="redo" width={20} height={20} />
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="p-1 rounded-sm hover:bg-gray-200"
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Image
          src={assets.icons.strikethrough}
          alt="redo"
          width={20}
          height={20}
        />
      </Button>

      {/* Inline formatting */}
      {/* {button(
        <strong>B</strong>,
        () => editor.chain().focus().toggleBold().run(),
        isActive("bold")
      )}
      {button(
        <em>I</em>,
        () => editor.chain().focus().toggleItalic().run(),
        isActive("italic")
      )}
      {button(
        <u>U</u>,
        () => editor.chain().focus().toggleUnderline().run(),
        isActive("underline")
      )}
      {button(
        <s>S</s>,
        () => editor.chain().focus().toggleStrike().run(),
        isActive("strike")
      )}

      {/* Lists *
      {button("• List", debugToggleBullet, isActive("bulletList"))}
      {button(
        "1. List",
        () => editor.chain().focus().toggleOrderedList().run(),
        isActive("orderedList")
      )}

      {/* Text alignments *
      {button(
        "Left",
        () => editor.chain().focus().setTextAlign("left").run(),
        isActive("textAlign", { textAlign: "left" })
      )}
      {button(
        "Center",
        () => editor.chain().focus().setTextAlign("center").run(),
        isActive("textAlign", { textAlign: "center" })
      )}
      {button(
        "Right",
        () => editor.chain().focus().setTextAlign("right").run(),
        isActive("textAlign", { textAlign: "right" })
      )}
      {button(
        "Justify",
        () => editor.chain().focus().setTextAlign("justify").run(),
        isActive("textAlign", { textAlign: "justify" })
      )}

      {/* Links *
      {button("Link", insertLink, isActive("link"))}
      {button("Unlink", removeLink)}

      {/* Emoji picker *
      <div className="relative">
        {button("😊", () => setShowEmoji((s) => !s))}
        {showEmoji && (
          <div className="absolute z-10 mt-2 p-2 bg-white border rounded shadow-sm grid grid-cols-6 gap-1">
            {[
              "😀",
              "😁",
              "😂",
              "😅",
              "😊",
              "😍",
              "🤔",
              "👍",
              "🎉",
              "🔥",
              "✅",
              "❌"
            ].map((em) => (
              <button
                key={em}
                className="p-1 hover:bg-gray-100 rounded"
                onClick={() => insertEmoji(em)}
                type="button"
              >
                {em}
              </button>
            ))}
          </div>
        )}
      </div> */}
    </div>
  );
}
