import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Paladin Pocket — desktop broadcasts verdict state, phone subscribes.
 * Channel is scoped to the user's auth.uid so only their own devices share state.
 * Uses Supabase Realtime broadcast (no DB writes, no extra credits).
 */

export interface PocketVerdict {
  verdict: string;          // "Fold" | "Check" | "Call" | "Bet" | "Raise" | "Shove"
  headline: string;
  detail: string;
  equity: number;           // 0..1
  requiredEquity: number;   // 0..1
  evCall: number;
  suggestedSize?: number;
  pot: number;
  toCall: number;
  street: string;           // preflop|flop|turn|river|—
  hero: string[];           // ["Ah","Kd"]
  board: string[];
  heroToAct: boolean;
  ts: number;
}

const channelName = (userId: string) => `paladin-pocket:${userId}`;

let cached: { id: string; ch: RealtimeChannel } | null = null;

function getChannel(userId: string): RealtimeChannel {
  if (cached && cached.id === userId) return cached.ch;
  if (cached) supabase.removeChannel(cached.ch);
  const ch = supabase.channel(channelName(userId), {
    config: { broadcast: { self: false } },
  });
  cached = { id: userId, ch };
  ch.subscribe();
  return ch;
}

export function publishVerdict(userId: string, payload: PocketVerdict) {
  const ch = getChannel(userId);
  ch.send({ type: "broadcast", event: "verdict", payload });
}

export function subscribeVerdict(
  userId: string,
  onVerdict: (v: PocketVerdict) => void,
): () => void {
  const ch = supabase.channel(channelName(userId), {
    config: { broadcast: { self: false } },
  });
  ch.on("broadcast", { event: "verdict" }, ({ payload }) => {
    onVerdict(payload as PocketVerdict);
  });
  ch.subscribe();
  return () => {
    supabase.removeChannel(ch);
  };
}
