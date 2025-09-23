"use client";

import {
  createDocument,
  editDocument,
  getDocument
} from "@/api/functions/document.api";
import assets from "@/json/assets";
import { cn } from "@/lib/utils";
import Toolbar from "@/ui/MarkdownEditor/Toolbar";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Download, X } from "lucide-react";
import moment from "moment";
import { useEffect, useState } from "react";
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

export default function DocumentSheet({
  open,
  onOpenChange,
  documentId = ""
}: {
  open: boolean;
  onOpenChange: (toggle: boolean) => void;
  documentId: string;
}) {
  const [isEditing, setIsEditing] = useState(!documentId);
  const [errorState, setErrorState] = useState({
    field: "",
    message: ""
  });
  const [documentData, setDocumentData] = useState({
    title: "Untitled document",
    content: ""
  });

  const { data, isLoading } = useQuery({
    queryKey: ["documents", documentId],
    queryFn: () => getDocument(documentId),
    enabled: !!documentId
  });

  useEffect(() => {
    setIsEditing(!documentId);
  }, [documentId]);

  useEffect(() => {
    if (data && documentId) {
      setDocumentData({
        title: data.title,
        content: data.content
      });
    } else {
      setDocumentData({
        title: "Untitled Document",
        content: ""
      });
    }
  }, [data, documentId]);

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
    content: "",
    immediatelyRender: false, // Next.js SSR
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // if (html !== documentData?.content)
      setDocumentData((prev) => ({ ...prev, content: html }));
    }
  });

  // sync external value → editor
  useEffect(() => {
    if (!editor) return;

    if (documentData?.content !== editor.getHTML()) {
      editor.commands.setContent(documentData?.content ?? "", {
        parseOptions: { preserveWhitespace: "full" }
      });
    }
  }, [documentData?.content, editor]);

  const { mutate, isPending } = useMutation({
    mutationFn: createDocument,
    onSuccess: () => onOpenChange(false),
    meta: {
      invalidateQueries: ["documents"]
    }
  });

  const { mutate: edit, isPending: isDocUpdating } = useMutation({
    mutationFn: editDocument,
    onSuccess: () => setIsEditing(false),
    meta: {
      invalidateQueries: ["documents"]
    }
  });

  const onSubmit = () => {
    if (!documentData.title.trim()) {
      setErrorState({
        field: "title",
        message: "Please enter document title"
      });
      return;
    }
    if (!documentData.content.trim() || editor?.isEmpty) {
      setErrorState({
        field: "content",
        message: "Please enter document content"
      });
      return;
    }
    setErrorState({
      field: "",
      message: ""
    });
    if (documentId) {
      edit({
        documentId,
        title: documentData.title,
        content: documentData.content
      });
      return;
    }
    mutate({
      title: documentData.title,
      content: documentData.content
    });
  };

  if (!editor) return null;

  if (isLoading) return "Loading...";

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
              {documentId ? (
                <div className="flex items-center gap-2">
                  <Avatar className="size-5">
                    <AvatarImage src={assets.avatar} alt="AH" />
                    <AvatarFallback>AH</AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm text-gray-700 leading-5">
                    {data?.user.fullName}
                  </span>
                </div>
              ) : null}
              <div>
                <h2
                  className={cn(
                    "font-medium text-2xl leading-7 tracking-[-3%] text-gray-900 mt-2",
                    {
                      "border border-red-400": errorState.field === "title"
                    }
                  )}
                  suppressContentEditableWarning
                  contentEditable={
                    isEditing || isPending || isDocUpdating
                      ? "plaintext-only"
                      : "false"
                  }
                  onBlur={(e) => {
                    setDocumentData((prev) => ({
                      ...prev,
                      title:
                        (e.target as HTMLElement).innerText.replaceAll(
                          "\n",
                          ""
                        ) ?? ""
                    }));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault(); // stop new line
                      (e.target as HTMLElement).blur();
                    }
                  }}
                >
                  {documentData.title}
                </h2>
                {errorState.field === "title" && (
                  <span className="text-sm text-red-400 mt-2">
                    {errorState.message}
                  </span>
                )}
              </div>
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
                {!!documentId && (
                  <p className="flex items-center gap-4">
                    <span className="text-gray-700 text-sm leading-5">
                      Last Update:
                    </span>
                    <span className="font-medium text-sm leading-5 text-gray-900 flex items-center gap-2">
                      <BsCalendar2 />
                      {moment(data?.updatedAt).format("MMM DD, YYYY")}
                    </span>
                  </p>
                )}
              </div>
            </div>
            {!isEditing && (
              <Button
                variant="outline"
                className="border-primary text-primary py-1.5 px-2.5"
                onClick={() => setIsEditing(true)}
              >
                <GoPencil className="text-primary" />
                Edit
              </Button>
            )}
          </div>
          {!isEditing || isPending || isDocUpdating ? (
            <div
              dangerouslySetInnerHTML={{ __html: documentData.content }}
              className="flex-1"
            />
          ) : (
            <EditorContent
              editor={editor}
              className={cn("flex-1 inline-flex [&_.tiptap]:flex-1 rounded-sm")}
            />
          )}
          {errorState.field === "content" && (
            <span className="text-sm text-red-400 mt-2">
              {errorState.message}
            </span>
          )}
        </div>
        <SheetFooter className="pt-4 px-4.5 pb-5 border-t">
          {isEditing && <Toolbar editor={editor} />}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                if (isEditing && documentId) {
                  setIsEditing(false);
                  return;
                }
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            {!isEditing && (
              <Button
                variant="outline"
                className="border-primary ml-auto py-2 px-2.5 text-primary"
              >
                <IoIosShareAlt className="size-5" />
              </Button>
            )}
            {isEditing ? (
              <Button
                className="gap-2 ml-auto"
                onClick={onSubmit}
                isLoading={isPending || isDocUpdating}
              >
                Save Changes
              </Button>
            ) : (
              <Button className="gap-2">
                <Download />
                Download
              </Button>
            )}
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
