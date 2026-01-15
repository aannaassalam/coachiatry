"use client";

import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import logo from "@/public/assets/svg/logo.svg";
import type {
  Content,
  ContentText,
  ContentOrderedList,
  ContentUnorderedList,
  ContentCanvas,
  TDocumentDefinitions
} from "pdfmake/interfaces";
import type { TFontDictionary } from "pdfmake/interfaces";
type PdfMakeWithVfs = typeof pdfMake & {
  vfs: Record<string, string>;
  fonts?: TFontDictionary;
};
type InlineText = ContentText;
type BlockContent =
  | ContentText
  | ContentOrderedList
  | ContentUnorderedList
  | ContentCanvas;

// ✅ pdfmake works reliably ONLY with built-in fonts in browser
const pdfMakeTyped = pdfMake as PdfMakeWithVfs;

// fully type-safe
pdfMakeTyped.vfs = pdfFonts.vfs;

/* ------------------------------------------------------------------ */
/* SVG → PNG */
/* ------------------------------------------------------------------ */

async function svgToPngBase64(svgUrl: string, targetWidth = 600) {
  const res = await fetch(svgUrl);
  const svgText = await res.text();

  const svgBlob = new Blob([svgText], { type: "image/svg+xml" });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.src = url;

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
  });

  const scale = targetWidth / img.width;
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = img.height * scale;

  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  URL.revokeObjectURL(url);
  return canvas.toDataURL("image/png");
}

/* ------------------------------------------------------------------ */
/* HTML → pdfMake content */
/* ------------------------------------------------------------------ */

function htmlToPdfContent(html: string): Content[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  function normalizeText(text: string): string {
    return text.replace(/\s+/g, " ");
  }

  function parseInline(node: ChildNode): InlineText[] {
    if (node.nodeType === Node.TEXT_NODE) {
      const value = normalizeText(node.textContent || "");
      if (value === "") return [];
      return [{ text: value }];
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return [];

    const el = node as HTMLElement;
    const children = Array.from(el.childNodes).flatMap(parseInline);

    switch (el.tagName) {
      case "STRONG":
      case "B":
        return children.map((c) => ({ ...c, bold: true }));

      case "EM":
      case "I":
        return children.map((c) => ({ ...c, italics: true }));

      case "U":
        return children.map((c) => ({ ...c, decoration: "underline" }));

      case "S":
      case "DEL":
        return children.map((c) => ({ ...c, decoration: "lineThrough" }));

      default:
        return children;
    }
  }

  function mergeInline(parts: InlineText[]): InlineText[] {
    const merged: InlineText[] = [];

    for (const part of parts) {
      const last = merged[merged.length - 1];

      if (
        last &&
        typeof last.text === "string" &&
        typeof part.text === "string" &&
        last.bold === part.bold &&
        last.italics === part.italics &&
        last.decoration === part.decoration
      ) {
        last.text += part.text;
      } else {
        merged.push({ ...part });
      }
    }

    return merged;
  }

  function parseBlock(node: ChildNode): BlockContent | null {
    if (node.nodeType !== Node.ELEMENT_NODE) return null;

    const el = node as HTMLElement;

    switch (el.tagName) {
      case "H1":
      case "H2":
      case "H3":
      case "H4":
        return {
          text: mergeInline(Array.from(el.childNodes).flatMap(parseInline)),
          style: el.tagName.toLowerCase()
        };

      case "P":
        return {
          text: mergeInline(Array.from(el.childNodes).flatMap(parseInline)),
          margin: [0, 6, 0, 6]
        };

      case "UL":
        return {
          ul: Array.from(el.children).map((li) =>
            mergeInline(Array.from(li.childNodes).flatMap(parseInline))
          ),
          margin: [0, 6, 0, 6]
        };

      case "OL":
        return {
          ol: Array.from(el.children).map((li) =>
            mergeInline(Array.from(li.childNodes).flatMap(parseInline))
          ),
          margin: [0, 6, 0, 6]
        };

      case "HR":
        return {
          canvas: [
            {
              type: "line",
              x1: 0,
              y1: 0,
              x2: 515,
              y2: 0,
              lineWidth: 1
            }
          ],
          margin: [0, 10, 0, 10]
        };

      default:
        return null;
    }
  }

  const content: Content[] = [];

  doc.body.childNodes.forEach((node) => {
    const block = parseBlock(node);
    if (block) content.push(block);
  });

  return content;
}

/* ------------------------------------------------------------------ */
/* MAIN */
/* ------------------------------------------------------------------ */

export async function generateMarkdownPDF(
  html: string,
  title: string,
  category: string
) {
  const logoBase64 = await svgToPngBase64(
    `${window.location.origin}${logo.src}`,
    600
  );

  const content: Content[] = [
    {
      stack: [
        { image: logoBase64, width: 120, margin: [0, 0, 0, 10] },
        { text: title, style: "title", alignment: "center" }
      ],
      margin: [0, 0, 0, 20]
    },
    {
      columns: [
        { text: `Category: ${category}`, style: "meta" },
        {
          text: `Date: ${new Date().toLocaleDateString()}`,
          style: "meta",
          alignment: "right"
        }
      ],
      margin: [0, 0, 0, 25]
    },
    ...htmlToPdfContent(html)
  ];

  const docDefinition: TDocumentDefinitions = {
    pageSize: "A4",
    pageMargins: [30, 40, 30, 40],

    background: (_currentPage, pageSize) => ({
      canvas: [
        {
          type: "rect",
          x: 15,
          y: 15,
          w: pageSize.width - 30,
          h: pageSize.height - 30,
          lineWidth: 1
        }
      ]
    }),

    content,

    styles: {
      title: { fontSize: 24, bold: true },

      h1: { fontSize: 18, bold: true, margin: [0, 14, 0, 6] },
      h2: { fontSize: 16, bold: true, margin: [0, 12, 0, 6] },
      h3: { fontSize: 14, bold: true, margin: [0, 10, 0, 6] },

      meta: { fontSize: 11, color: "#444" }
    },

    defaultStyle: {
      fontSize: 12,
      lineHeight: 1.6
    }
  };
  pdfMake
    .createPdf(docDefinition)
    .download(`${title.replace(/\s+/g, "_")}.pdf`);
}
