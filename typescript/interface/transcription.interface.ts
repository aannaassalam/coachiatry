import { User } from "./user.interface";

export interface EachTranscription {
  _id: string;
  // Stable per-utterance id from the extension's caption aggregator (present
  // on extension-captured segments; absent on older/manual ones).
  seq?: string;
  name: string;
  profile: string;
  text: string;
  timestamp: string;
}

export interface Transcription {
  _id: string;
  title: string;
  user: User;
  // Detail/coach reads return these fully populated (server dual-reads from
  // the per-segment collection, falling back to the legacy embedded array).
  transcriptions: EachTranscription[];
  // Server-maintained segment count. On list responses the `transcriptions`
  // array is empty for new per-segment docs, so use this for any count UI.
  segmentCount?: number;
  active: boolean;
  meetingId?: string;
  source?: "extension" | "manual";
  createdAt: string;
  updatedAt: string;
}
