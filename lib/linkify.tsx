import React from "react";

// Splits on URLs (http/https or bare www.) keeping them as their own segments.
const URL_SPLIT = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
const URL_TEST = /^(https?:\/\/|www\.)/i;

/**
 * Turns any URLs inside a message string into clickable <a> links (opening in a
 * new tab), leaving the rest as plain text. Returns React nodes to drop into
 * JSX. Clicking a link doesn't bubble up to the surrounding message/row click.
 */
export function linkifyText(text?: string | null): React.ReactNode[] {
  const value = text ?? "";
  return value.split(URL_SPLIT).map((part, index) => {
    if (part && URL_TEST.test(part)) {
      // Don't let trailing punctuation ("...link.") break the opened URL.
      const clean = part.replace(/[.,!?;:]+$/, "");
      const href = clean.startsWith("http") ? clean : `https://${clean}`;
      return (
        <a
          key={index}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="underline break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}
