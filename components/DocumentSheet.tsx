"use client";

import { getAllCategories } from "@/external-api/functions/category.api";
import {
  createDocument,
  editDocument,
  getDocument
} from "@/external-api/functions/document.api";
import assets from "@/json/assets";
import { generateMarkdownPDF } from "@/lib/functions/documentPdf";
import { cn } from "@/lib/utils";
import Toolbar from "@/ui/MarkdownEditor/Toolbar";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { useMutation, useQueries } from "@tanstack/react-query";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Download, X } from "lucide-react";
import moment from "moment";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { BsCalendar2 } from "react-icons/bs";
import { GoPencil } from "react-icons/go";
import { IoIosShareAlt } from "react-icons/io";
import { toast } from "sonner";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Combobox } from "./ui/combobox";
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from "./ui/sheet";
import { SmartAvatar } from "./ui/smart-avatar";
import CoachAI from "./CoachAIPopover";

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
  const [downloading, setDownloading] = useState(false);
  const [errorState, setErrorState] = useState({
    field: "",
    message: ""
  });
  const [documentData, setDocumentData] = useState({
    title: "Untitled document",
    content: "",
    tag: ""
  });
  const { data: session } = useSession();

  const [
    { data, isLoading },
    { data: categories, isLoading: isCategoriesLoading, isFetching }
  ] = useQueries({
    queries: [
      {
        queryKey: ["documents", documentId],
        queryFn: () => getDocument(documentId),
        enabled: !!documentId
      },
      {
        queryKey: ["categories"],
        queryFn: getAllCategories
      }
    ]
  });

  useEffect(() => {
    setIsEditing(!documentId);
  }, [documentId]);

  useEffect(() => {
    if (data && documentId) {
      setDocumentData({
        title: data.title,
        content: data.content,
        tag: data?.tag?._id ?? ""
      });
    } else {
      setDocumentData({
        title: "Untitled Document",
        content: "",
        tag: ""
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
    onSuccess: () => {
      onOpenChange(false);
      editor?.commands.setContent("");
      setDocumentData({
        title: "Untitled Document",
        content: "",
        tag: ""
      });
    },
    meta: {
      invalidateQueries: ["documents"]
    }
  });

  const { mutate: edit, isPending: isDocUpdating } = useMutation({
    mutationFn: editDocument,
    onSuccess: () => {
      setIsEditing(false);
      editor?.commands.setContent("");
    },
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
        content: documentData.content,
        tag: documentData.tag
      });
      return;
    }
    mutate({
      title: documentData.title,
      content: documentData.content,
      tag: documentData.tag
    });
  };

  if (!editor) return null;

  async function handleDownload() {
    setDownloading(true);
    if (data) {
      await generateMarkdownPDF(
        data.content,
        data.title,
        data?.tag?.title ?? ""
      );
    }
    setDownloading(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="lg:max-w-2xl gap-0 max-lg:!max-w-full max-lg:!w-full">
        <SheetHeader className="border-b p-6 flex-row items-center justify-between">
          <SheetTitle className="font-archivo font-medium text-xl text-gray-900">
            {isEditing && documentId
              ? "Edit Document"
              : isEditing
                ? "Add Document"
                : "Document"}
          </SheetTitle>
          <SheetClose className="cursor-pointer">
            <X />
          </SheetClose>
        </SheetHeader>
        <div className="flex-1 p-6 inline-flex flex-col overflow-auto scrollbar-hide">
          {isLoading ? (
            <div className="animate-pulse">
              <div className="flex justify-between items-start mb-7">
                <div className="w-full">
                  <div className="flex items-center gap-2">
                    <div className="size-5 rounded-full bg-gray-200" />
                    <span className="h-5 w-20 rounded-sm bg-gray-200" />
                  </div>
                  <h2
                    className={cn("h-10 w-4/6 bg-gray-200 rounded-sm mt-2")}
                  />
                  <div className="flex items-center gap-5 mt-4">
                    <div className="h-6 w-15 rounded-full bg-gray-200" />
                    <p className="h-6 w-50 rounded-sm bg-gray-200" />
                  </div>
                </div>
              </div>
              <div className="h-5 w-4/5 bg-gray-200 rounded-sm mb-1.5" />
              <div className="h-5 w-2/3 bg-gray-200 rounded-sm mb-1.5" />
              <div className="h-5 w-2/5 bg-gray-200 rounded-sm mb-1.5" />
              <div className="h-5 w-5/6 bg-gray-200 rounded-sm mb-1.5" />
              <div className="h-5 w-1/3 bg-gray-200 rounded-sm mb-1.5" />
              <div className="h-5 w-7/12 bg-gray-200 rounded-sm mb-1.5" />
              <div className="h-5 w-11/12 bg-gray-200 rounded-sm mb-1.5" />
              <div className="h-5 w-1/2 bg-gray-200 rounded-sm mb-1.5" />
              <div className="h-5 w-2/5 bg-gray-200 rounded-sm" />
            </div>
          ) : (
            <>
              <div className="flex justify-between items-start mb-7">
                <div>
                  {documentId ? (
                    <div className="flex items-center gap-2">
                      <SmartAvatar
                        src={data?.user?.photo}
                        name={data?.user?.fullName}
                        key={data?.user?.updatedAt}
                        className="size-5"
                      />
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
                    {isEditing ? (
                      <Combobox
                        value={documentData.tag}
                        onChange={(val) =>
                          setDocumentData((prev) => ({
                            ...prev,
                            tag: val.toString()
                          }))
                        }
                        isCategory
                        options={
                          categories?.map((cat) => {
                            return {
                              label: cat.title,
                              value: cat._id,
                              bgColor: cat?.color?.bg,
                              textColor: cat?.color?.text,
                              dotColor: cat?.color?.text
                            };
                          }) || []
                        }
                        isLoading={isCategoriesLoading || isFetching}
                        placeholder="Select category"
                        isBadge={true}
                        className="w-50"
                      />
                    ) : (
                      <Badge
                        className="rounded-full py-0.5 px-2 flex items-center gap-1.5 font-archivo font-medium text-xs leading-4.5"
                        style={{
                          backgroundColor: data?.tag?.color?.bg,
                          color: data?.tag?.color?.text
                        }}
                      >
                        <div
                          className="size-1.5 rounded-full"
                          style={{ backgroundColor: data?.tag?.color?.text }}
                        ></div>
                        {data?.tag?.title}
                      </Badge>
                    )}
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
                {!isEditing &&
                  !data?.sharedWith.includes(session?.user?._id ?? "") && (
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
                  className="flex-1 leading-7 [&_hr]:my-2 [&_ul]:py-2 [&_ul]:px-8 [&_ol]:py-2 [&_ol]:px-8 [&_ol]:list-decimal [&_ol]:space-y-2 [&_a]:text-blue-500 [&_a]:underline"
                />
              ) : (
                <EditorContent
                  editor={editor}
                  className={cn(
                    "flex-1 inline-flex [&_.tiptap]:flex-1 rounded-sm"
                  )}
                />
              )}
              {errorState.field === "content" && (
                <span className="text-sm text-red-400 mt-2">
                  {errorState.message}
                </span>
              )}
            </>
          )}
        </div>
        {!isLoading && (
          <SheetFooter className="pt-4 px-4.5 pb-5 border-t">
            {isEditing && <Toolbar editor={editor} />}
            <div className="flex gap-3 justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  if (isEditing && documentId) {
                    setIsEditing(false);
                    return;
                  }
                  onOpenChange(false);
                }}
                disabled={isPending || isDocUpdating}
              >
                Cancel
              </Button>
              {!isEditing &&
                !data?.sharedWith.includes(session?.user?._id ?? "") && (
                  <>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="border-primary ml-auto py-2 px-2.5 text-primary"
                        >
                          <IoIosShareAlt className="size-5" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogTitle>Share Document</DialogTitle>
                        <div className="p-2 bg-white border rounded-sm flex items-center gap-2 w-full">
                          <p
                            className="w-100 truncate text-sm text-gray-700"
                            title={`${process.env.NEXTAUTH_URL}/share/${data?.shareId}`}
                          >
                            {`${process.env.NEXTAUTH_URL}/share/${data?.shareId}`}
                          </p>
                          <Button
                            onClick={async () => {
                              await navigator.clipboard.writeText(
                                `${process.env.NEXTAUTH_URL}/share/${data?.shareId}` ||
                                  ""
                              );
                              toast.success("Link copied to clipboard!");
                            }}
                            size="sm"
                          >
                            Copy
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Popover modal>
                      <PopoverTrigger asChild>
                        <button className="py-[9px] px-2.5 flex items-center gap-2 font-lato font-semibold text-xs text-white cursor-pointer bg-gradient-to-br from-0% from-[#0E1634] via-48% via-[#475278] to-98% to-[#121A39] rounded-md">
                          <Image
                            src={assets.aiIcon}
                            alt="AI Icon"
                            width={36}
                            height={36}
                            className="size-6"
                          />
                          Coach AI
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="border-none shadow-none bg-transparent"
                        side="top"
                        align="end"
                      >
                        <CoachAI id={documentId} page="document" />
                      </PopoverContent>
                    </Popover>
                  </>
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
                <Button
                  className="gap-2"
                  onClick={handleDownload}
                  isLoading={downloading}
                >
                  <Download />
                  Download
                </Button>
              )}
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
