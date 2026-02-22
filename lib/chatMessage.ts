import { MutableRefObject } from "react";
import { Message } from "@/typescript/interface/message.interface";

/**
 * Returns a stable React key for a message. Uses tempId/_id deterministically
 * and keeps the same key when a tempId is replaced by a server _id.
 */
export const getStableMessageKey = (
  mapRef: MutableRefObject<Map<string, string>>,
  msg: Message
) => {
  const primary = msg.tempId || msg._id;

  // If we already mapped either id, reuse it.
  if (primary && mapRef.current.has(primary)) {
    return mapRef.current.get(primary)!;
  }

  // If server id arrives for a tempId, reuse the tempId key.
  if (msg.tempId && msg._id && mapRef.current.has(msg.tempId)) {
    const existing = mapRef.current.get(msg.tempId)!;
    mapRef.current.set(msg._id, existing);
    return existing;
  }

  // Deterministic fallback to avoid random re-keys.
  const fallback = msg.createdAt
    ? `${msg.createdAt}-${msg.content ?? ""}`.slice(0, 64)
    : msg.content ?? "unknown";

  const stable = primary ?? fallback;
  mapRef.current.set(stable, stable);
  return stable;
};
