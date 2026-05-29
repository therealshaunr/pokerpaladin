// Paladin Voice — browser-native Speech Synthesis wrapper. Off by default;
// only the explicit user toggle in GameSetup/ScanPanel turns it on.
// Falls back silently when SpeechSynthesis is unavailable.

const KEY = "paladin.voice.on";

export type PaladinCue =
  | "Fold"
  | "Check"
  | "Call"
  | "Bet"
  | "Raise"
  | "Shove";

export function isVoiceOn(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function setVoiceOn(on: boolean) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, on ? "1" : "0");
  } catch {
    /* noop */
  }
}

const CUE_PHRASES: Record<PaladinCue, string> = {
  Fold: "Fold.",
  Check: "Check.",
  Call: "Call.",
  Bet: "Bet.",
  Raise: "Raise.",
  Shove: "All in.",
};

let lastSpoken = "";
let lastSpokenAt = 0;

export function playPaladinCue(kind: PaladinCue | string) {
  if (!isVoiceOn()) return;
  if (typeof window === "undefined") return;
  const synth = window.speechSynthesis;
  if (!synth) return;

  const phrase = CUE_PHRASES[kind as PaladinCue] ?? String(kind);
  const now = Date.now();
  // Debounce identical cues within 2.5s so a rapid recompute loop doesn't chatter.
  if (phrase === lastSpoken && now - lastSpokenAt < 2500) return;
  lastSpoken = phrase;
  lastSpokenAt = now;

  try {
    synth.cancel();
    const u = new SpeechSynthesisUtterance(phrase);
    u.rate = 0.95;
    u.pitch = 0.85;
    u.volume = 0.9;
    synth.speak(u);
  } catch {
    /* noop */
  }
}
