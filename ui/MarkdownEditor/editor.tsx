import { Editor, rootCtx } from "@milkdown/kit/core";
import { commonmark } from "@milkdown/kit/preset/commonmark";
import { Milkdown, MilkdownProvider, useEditor } from "@milkdown/react";
import { nord } from "@milkdown/theme-nord";
import React, { useRef, useState } from "react";

type ToolbarPos = { x: number; y: number };

interface Props {
  initialMarkdown?: string;
  onChange?: (md: string) => void;
}

export const FloatingMilkdownEditor: React.FC<Props> = ({
  initialMarkdown = "",
  onChange
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  //   const [ctx, setCtx] = useState<Ctx | null>(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPos, setToolbarPos] = useState<ToolbarPos | null>(null);

  const editor = useEditor((root) =>
    Editor.make()
      .config(nord)
      .config((ctx) => {
        ctx.set(rootCtx, root);
      })
      .use(commonmark)
  );

  return (
    <div style={{ position: "relative" }}>
      {/* <div ref={rootRef} /> */}
      <MilkdownProvider>
        <Milkdown />
      </MilkdownProvider>
      {/* {showToolbar && toolbarPos && (
        <div
          style={{
            position: "absolute",
            top: toolbarPos.y - 40 + window.scrollY,
            left: toolbarPos.x - 80 + window.scrollX,
            background: "white",
            border: "1px solid #ccc",
            borderRadius: 4,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            display: "flex",
            gap: "4px",
            padding: "4px",
            zIndex: 1000
          }}
        >
          <button onClick={() => exec("bold")}>B</button>
          <button onClick={() => exec("italic")}>I</button>
          <button onClick={() => exec("strike")}>S</button>
          <button onClick={() => exec("blockquote")}>❝</button>
          <button onClick={() => exec("code")}>{`</>`}</button>
          <button onClick={() => exec("ol")}>1.</button>
          <button onClick={() => exec("ul")}>•</button>
        </div>
      )} */}
    </div>
  );
};
