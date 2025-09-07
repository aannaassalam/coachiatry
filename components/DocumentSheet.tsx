"use client";

import assets from "@/json/assets";
import { cn } from "@/lib/utils";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Download, X } from "lucide-react";
import React, { useEffect } from "react";
import { BsCalendar2 } from "react-icons/bs";
import { GoPencil } from "react-icons/go";
import { IoIosShareAlt } from "react-icons/io";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from "./ui/sheet";
import Toolbar from "@/ui/MarkdownEditor/Toolbar";

export default function DocumentSheet({
  open,
  onOpenChange,
  value,
  onChange
}: {
  open: boolean;
  onOpenChange: React.Dispatch<React.SetStateAction<boolean>>;
  value: string;
  onChange: (value: string) => void;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({
        placeholder: "Type here to create your document (supports Markdown)...",
        showOnlyCurrent: false, // show even when focus not on the node
        showOnlyWhenEditable: true
      })
    ],
    content: value || "",
    immediatelyRender: false, // Next.js SSR
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (html !== value) onChange(html);
    }
  });

  // sync external value → editor
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value && value !== current) {
      editor.commands.setContent(value, {
        parseOptions: { preserveWhitespace: "full" }
      });
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="lg:max-w-2xl gap-0">
        <SheetHeader className="border-b p-6 flex-row items-center justify-between">
          <SheetTitle className="font-archivo font-medium text-xl text-gray-900">
            Doctor’s Recommendation
          </SheetTitle>
          <SheetClose className="cursor-pointer">
            <X />
          </SheetClose>
        </SheetHeader>
        <div className="flex-1 p-6 inline-flex flex-col">
          <div className="flex justify-between items-start mb-7">
            <div>
              <div className="flex items-center gap-2">
                <Avatar className="size-5">
                  <AvatarImage src={assets.avatar} alt="AH" />
                  <AvatarFallback>AH</AvatarFallback>
                </Avatar>
                <span className="font-medium text-sm text-gray-700 leading-5">
                  John Nick
                </span>
              </div>
              <h2 className="font-medium text-2xl leading-7 tracking-[-3%] text-gray-900 mt-2">
                Medical History
              </h2>
              <div className="flex items-center gap-5 mt-4">
                <Badge
                  className={cn(
                    "rounded-full py-0.5 px-2 flex items-center gap-1.5 font-archivo font-medium text-xs leading-4.5",
                    "bg-amber-200/40",
                    "text-amber-600/80"
                  )}
                >
                  <div
                    className={cn("size-1.5 rounded-full", "bg-amber-600/80")}
                  ></div>
                  Health
                </Badge>
                <p className="flex items-center gap-4">
                  <span className="text-gray-700 text-sm leading-5">
                    Last Update:
                  </span>
                  <span className="font-medium text-sm leading-5 text-gray-900 flex items-center gap-2">
                    <BsCalendar2 />
                    Dec 12, 2022
                  </span>
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="border-primary text-primary py-1.5 px-2.5"
            >
              <GoPencil className="text-primary" />
              Edit
            </Button>
          </div>
          <EditorContent
            editor={editor}
            className="flex-1 inline-flex [&_.tiptap]:flex-1"
          />
        </div>
        <SheetFooter className="pt-4 px-4.5 pb-5 border-t">
          <Toolbar editor={editor} />
          <div className="flex gap-3">
            <Button variant="outline">Cancel</Button>
            <Button
              variant="outline"
              className="border-primary ml-auto py-2 px-2.5 text-primary"
            >
              <IoIosShareAlt className="size-5" />
            </Button>
            <Button className="gap-2">
              <Download />
              Download
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
