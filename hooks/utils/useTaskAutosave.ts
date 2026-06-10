import { editTask } from "@/external-api/functions/task.api";
import { TaskBody } from "@/typescript/interface/task.interface";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";

export type AutosaveState = "idle" | "saving" | "saved" | "error";

/**
 * Debounced autosave for the task EDIT flow.
 *
 * Behaviour:
 * - Watches the form and saves ~`delay`ms after the last change.
 * - Saves silently (no toast) and sends only the fields that changed since the
 *   last successful save, so a title-only edit doesn't churn reminder jobs.
 * - Single-flight: never more than one request in flight; a change made while
 *   a save is running queues exactly one follow-up (no out-of-order writes).
 * - Skips while invalid (`canSave` returns false) so blank required fields are
 *   never persisted.
 *
 * The caller is responsible for seeding the form and then calling
 * `resetBaseline()` so seeding itself doesn't trigger a save.
 */
export function useTaskAutosave<T extends FieldValues>({
  enabled,
  taskId,
  form,
  buildPayload,
  canSave,
  delay = 1000
}: {
  enabled: boolean;
  taskId: string;
  form: UseFormReturn<T>;
  /** Maps form values to the API payload (same transform as manual submit). */
  buildPayload: (values: T) => Record<string, unknown>;
  /** Guards saving — e.g. required fields are present. */
  canSave: (values: T) => boolean;
  delay?: number;
}) {
  const [saveState, setSaveState] = useState<AutosaveState>("idle");

  const baselineRef = useRef<string>("");
  const savingRef = useRef(false);
  const pendingRef = useRef(false);
  const savedSomethingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the latest closures reachable from the stable callbacks below.
  const latest = useRef({ enabled, taskId, form, buildPayload, canSave });
  latest.current = { enabled, taskId, form, buildPayload, canSave };

  const run = useCallback(async () => {
    const { enabled, taskId, form, buildPayload, canSave } = latest.current;
    if (!enabled || !taskId) return;
    if (savingRef.current) {
      pendingRef.current = true;
      return;
    }

    const values = form.getValues();
    if (!canSave(values)) return;

    const current = buildPayload(values);
    const serialized = JSON.stringify(current);

    // No baseline yet (form not seeded) — adopt current as baseline instead of
    // pushing the whole task back to the server.
    if (!baselineRef.current) {
      baselineRef.current = serialized;
      return;
    }
    if (serialized === baselineRef.current) return;

    let baseline: Record<string, unknown> = {};
    try {
      baseline = JSON.parse(baselineRef.current);
    } catch {
      baseline = {};
    }

    const changed: Record<string, unknown> = {};
    for (const key of Object.keys(current)) {
      if (JSON.stringify(current[key]) !== JSON.stringify(baseline[key])) {
        changed[key] = current[key];
      }
    }
    if (Object.keys(changed).length === 0) {
      baselineRef.current = serialized;
      return;
    }

    savingRef.current = true;
    setSaveState("saving");
    try {
      await editTask({ task_id: taskId, data: changed as Partial<TaskBody> });
      baselineRef.current = serialized;
      savedSomethingRef.current = true;
      setSaveState("saved");
    } catch {
      setSaveState("error");
    } finally {
      savingRef.current = false;
      if (pendingRef.current) {
        pendingRef.current = false;
        run();
      }
    }
  }, []);

  const schedule = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      run();
    }, delay);
  }, [run, delay]);

  // (Re)schedule a save on every form change while enabled.
  useEffect(() => {
    if (!enabled) return;
    const subscription = form.watch(() => schedule());
    return () => subscription.unsubscribe();
  }, [enabled, form, schedule]);

  // Clear any pending timer on unmount.
  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  /** Snapshot current values as the "already saved" baseline (call post-seed). */
  const resetBaseline = useCallback(() => {
    const { form, buildPayload } = latest.current;
    baselineRef.current = JSON.stringify(buildPayload(form.getValues()));
    setSaveState("idle");
  }, []);

  /** Run any pending save immediately and resolve once the queue is idle. */
  const flush = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    await run();
    // run() returns early if a save was already in flight; wait it (and any
    // queued follow-up) out so callers can safely refetch afterwards.
    for (let i = 0; i < 60 && (savingRef.current || pendingRef.current); i++) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }, [run]);

  const retry = useCallback(() => {
    run();
  }, [run]);

  return {
    saveState,
    resetBaseline,
    flush,
    retry,
    /** True if at least one autosave succeeded since the last clear. */
    hasSaved: () => savedSomethingRef.current,
    clearHasSaved: () => {
      savedSomethingRef.current = false;
    }
  };
}
