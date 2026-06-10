import { AutosaveState } from "@/hooks/utils/useTaskAutosave";
import { Check, Loader2 } from "lucide-react";

// Subtle inline "Saving / Saved / retry" status shown in place of the manual
// save button when a task edit autosaves.
export default function AutosaveIndicator({
  state,
  onRetry
}: {
  state: AutosaveState;
  onRetry: () => void;
}) {
  return (
    <div className="flex items-center gap-2 text-sm font-lato">
      {state === "saving" && (
        <>
          <Loader2 className="size-4 animate-spin text-gray-400" />
          <span className="text-gray-500">Saving…</span>
        </>
      )}
      {state === "saved" && (
        <>
          <Check className="size-4 text-green-600" />
          <span className="text-gray-500">Saved</span>
        </>
      )}
      {state === "error" && (
        <button
          type="button"
          onClick={onRetry}
          className="text-red-500 hover:underline cursor-pointer"
        >
          Couldn&apos;t save — retry
        </button>
      )}
    </div>
  );
}
