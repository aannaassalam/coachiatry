"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
// import Toolbar from "@/ui/MarkdownEditor/Toolbar";
import ChatToolbar from "@/ui/MarkdownEditor/ChatToolbar";
// import { GoClock } from "react-icons/go";
import { Button } from "../ui/button";
import Image from "next/image";
import assets from "@/json/assets";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

const InputButtons = ({ handleSubmit }: { handleSubmit: () => void }) => {
  return (
    <div className="flex items-stretch">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-secondary p-2 aspect-square"
          >
            <Image
              src={assets.icons.clock}
              width={15}
              height={15}
              alt="clock"
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Schedule Send</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-secondary p-2 aspect-square"
          >
            <Image
              src={assets.icons.chatEmoji}
              width={15}
              height={15}
              alt="emoji"
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Emoji Panel</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-secondary p-2 aspect-square"
          >
            <Image src={assets.icons.clip} width={15} height={15} alt="clip" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Attachment</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-secondary aspect-square border-1 border-gray-300 bg-[#F8F8F8] p-2 mr-2 ml-1"
          >
            <Image
              src={assets.icons.coachAi}
              width={13}
              height={13}
              alt="coachAi"
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Coach AI</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleSubmit}
            size="sm"
            className="aspect-square p-2"
          >
            <Image src={assets.icons.send} width={15} height={15} alt="send" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Send</TooltipContent>
      </Tooltip>
    </div>
  );
};

export default function ChatInput({
  onSend
}: {
  onSend: (msg: string) => void;
}) {
  const [value, setValue] = useState("");
  const [showToolBar, setShowToolBar] = useState(false);
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({
        placeholder: "Write your message...",
        showOnlyCurrent: false, // show even when focus not on the node
        showOnlyWhenEditable: true
      })
    ],
    content: value || "",
    immediatelyRender: false, // Next.js SSR
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (html !== value) setValue(html);
    }
  });

  // Optional: handle CMD/CTRL + Enter to send message
  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        handleSubmit();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [editor]);

  useEffect(() => {
    if (!editor) return;

    const handleSelectionUpdate = () => {
      const { from, to } = editor.state.selection;
      setShowToolBar(from !== to);
    };

    editor.on("selectionUpdate", handleSelectionUpdate);
    return () => {
      editor.off("selectionUpdate", handleSelectionUpdate);
    };
  }, [editor]);

  const handleSubmit = () => {
    if (!editor) return;
    const html = editor.getHTML().trim();
    const plainText = editor.getText().trim();

    if (!plainText) return;

    onSend(html);
    editor.commands.clearContent();
  };

  const handleEditorFocus = () => {
    if (!editor) return;
    editor.commands.focus("all");
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      className="flex items-center p-5 pt-3.5 border-t bg-white"
    >
      <div
        onClick={handleEditorFocus}
        className="border rounded-md bg-white min-h-[48px] px-3 py-2 flex items-center w-full relative"
      >
        <EditorContent
          editor={editor}
          onBlur={() => setShowToolBar(false)}
          className={cn(
            "prose prose-sm max-w-none w-full max-h-[70px] focus:outline-none font-lato text-sm overflow-auto"
          )}
        />

        <InputButtons handleSubmit={handleSubmit} />
        <ChatToolbar editor={editor} showToolBar={showToolBar} />
      </div>
    </form>
  );
}
