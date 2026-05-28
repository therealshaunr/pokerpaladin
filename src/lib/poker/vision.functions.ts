import { createServerFn } from "@tanstack/react-start";
import type { ActionType, DetectedSeat } from "./types";

interface VisionInput {
  image: string; // data URL (image/png or jpeg base64)
  variantLabel: string;
  heroSeatHint?: string;
}

export interface VisionResult {
  hole: string[]; // e.g. ["As","Kd"]
  board: string[]; // e.g. ["Th","9s","2c"]
  pot: number | null;
  toCall: number | null;
  street: string | null; // "preflop" | "flop" | "turn" | "river"
  dealerSeat: number | null;
  seats: DetectedSeat[];
  smallBlind: number | null;
  bigBlind: number | null;
  ante: number | null;
  clockSeconds: number | null; // tournament level clock, if shown
  heroToAct: boolean; // is it the hero's turn to act
  notes: string;
}


const VALID_ACTIONS: ActionType[] = ["fold", "check", "call", "bet", "raise", "allin"];

function toAction(v: unknown): ActionType | null {
  if (typeof v !== "string") return null;
  const a = v.toLowerCase().trim();
  if (a === "all-in" || a === "all in" || a === "shove" || a === "jam") return "allin";
  return (VALID_ACTIONS as string[]).includes(a) ? (a as ActionType) : null;
}

function toNum(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return Math.round(v);
  if (typeof v === "string") {
    const n = Number(v.replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
  }
  return null;
}

function parseSeats(arr: unknown): DetectedSeat[] {
  if (!Array.isArray(arr)) return [];
  const out: DetectedSeat[] = [];
  arr.forEach((raw, i) => {
    if (!raw || typeof raw !== "object") return;
    const o = raw as Record<string, unknown>;
    const seat = toNum(o.seat) ?? i + 1;
    out.push({
      seat,
      name: typeof o.name === "string" && o.name.trim() ? o.name.trim().slice(0, 24) : `Seat ${seat}`,
      stack: toNum(o.stack),
      hasCards: o.hasCards === true,
      isHero: o.isHero === true,
      isEmpty: o.isEmpty === true,
      action: toAction(o.action),
      betAmount: toNum(o.betAmount),
    });
  });
  return out.slice(0, 12);
}

function safeParse(text: string): VisionResult {
  const empty: VisionResult = {
    hole: [], board: [], pot: null, toCall: null, street: null, dealerSeat: null, seats: [],
    smallBlind: null, bigBlind: null, ante: null, clockSeconds: null, heroToAct: false, notes: "",
  };
  if (!text) return empty;
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return { ...empty, notes: text.slice(0, 200) };
  try {
    const obj = JSON.parse(match[0]);
    return {
      hole: Array.isArray(obj.hole) ? obj.hole.map(String) : [],
      board: Array.isArray(obj.board) ? obj.board.map(String) : [],
      pot: toNum(obj.pot),
      toCall: toNum(obj.toCall),
      street: typeof obj.street === "string" ? obj.street.toLowerCase() : null,
      dealerSeat: toNum(obj.dealerSeat),
      seats: parseSeats(obj.seats),
      smallBlind: toNum(obj.smallBlind),
      bigBlind: toNum(obj.bigBlind),
      ante: toNum(obj.ante),
      clockSeconds: toNum(obj.clockSeconds),
      heroToAct: obj.heroToAct === true,
      notes: typeof obj.notes === "string" ? obj.notes : "",
    };
  } catch {
    return { ...empty, notes: "Could not parse vision output." };
  }
}


export const analyzeTable = createServerFn({ method: "POST" })
  .inputValidator((input: VisionInput) => {
    if (!input || typeof input.image !== "string" || !input.image.startsWith("data:image")) {
      throw new Error("A captured table image is required.");
    }
    return input;
  })
  .handler(async ({ data }): Promise<VisionResult> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI is not configured (missing LOVABLE_API_KEY).");

    const prompt =
      `You are a real-time vision engine reading a screenshot of an online ${data.variantLabel} poker table. ` +
      `Report ONLY what is clearly visible. Return STRICT JSON (no prose, no markdown) in exactly this shape:\n` +
      `{"hole":["As","Kd"],"board":["Th","9s","2c"],"pot":1234,"toCall":200,"street":"flop","dealerSeat":3,` +
      `"seats":[{"seat":1,"name":"username","stack":1500,"hasCards":true,"isHero":false,"isEmpty":false,"action":"raise","betAmount":120}],` +
      `"smallBlind":10,"bigBlind":20,"ante":0,"clockSeconds":214,"heroToAct":true,"notes":"short read"}\n` +

      `Card format: rank A K Q J T 9 8 7 6 5 4 3 2 + suit s h d c (e.g. "Qh"). ` +
      `hole = the hero's own cards. board = community cards (empty array for stud). ` +
      `seats = EVERY visible seat going clockwise starting top-left; number them 1..N by screen position. ` +
      `For each seat read: name/username (or "" if unreadable), stack/chip count, ` +
      `hasCards (true if hole cards are shown face-down/up in front of them, false if they have no cards = folded or empty), ` +
      `isHero (true for the hero/your seat), isEmpty (true if no player is sitting there), ` +
      `action (the most recent visible action this betting round: fold/check/call/bet/raise/allin, or null), ` +
      `betAmount (chips committed with that action, or null). ` +
      `street = preflop/flop/turn/river based on community cards. dealerSeat = seat with the dealer button. ` +
      `smallBlind/bigBlind/ante = the blinds and ante currently in play (read from blinds display or what's posted). ` +
      `clockSeconds = the tournament level countdown clock converted to total seconds (e.g. "3:34" -> 214), or null if no clock is visible. ` +
      `heroToAct = true ONLY if it is clearly the hero's turn to act (their seat is highlighted / action is on them). ` +
      `Use [] for unknown arrays and null for unknown numbers. ` +

      (data.heroSeatHint ? `Hero seat hint: ${data.heroSeatHint}. ` : "");

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: data.image } },
            ],
          },
        ],
      }),
    });

    if (resp.status === 429) throw new Error("Rate limited — wait a moment and analyze again.");
    if (resp.status === 402) throw new Error("AI credits exhausted — add credits in Settings → Workspace → Usage.");
    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`Vision failed [${resp.status}]: ${body.slice(0, 160)}`);
    }

    const json = await resp.json();
    const text: string = json?.choices?.[0]?.message?.content ?? "";
    return safeParse(text);
  });
