// Pure analysis utilities for session review. No React, no I/O.
import type { Card } from "./types";

export interface HandRecord {
  ts: number;
  street: string;
  hero: Card[];
  board: Card[];
  pot: number;
  toCall: number;
  verdict: string; // Fold/Check/Call/Bet/Raise/Shove
  equity: number;
  requiredEquity: number;
  evCall: number;
  suggestedSize?: number;
}

export interface Leak {
  id: string;
  title: string;
  detail: string;
  examples: number;
  severity: "low" | "medium" | "high";
  estEv: number; // negative = leak cost
}

export interface RadarStats {
  aggression: number;     // 0..1
  foldFrequency: number;  // 0..1
  valueCapture: number;   // 0..1
  bluffDiscipline: number;// 0..1
  preflopTightness: number;// 0..1
}

export interface SessionReport {
  totalHands: number;
  startedAt: number;
  endedAt: number;
  leaks: Leak[];
  topHands: HandRecord[];
  stats: RadarStats;
  estimatedEvLost: number;
}

function clamp01(n: number) { return Math.max(0, Math.min(1, n)); }

export function analyzeSession(history: HandRecord[]): SessionReport {
  const startedAt = history.length ? history[0].ts : Date.now();
  const endedAt = history.length ? history[history.length - 1].ts : Date.now();
  const totalHands = history.length;

  // Bucket actions
  const folds = history.filter((h) => h.verdict === "Fold");
  const aggressive = history.filter((h) => h.verdict === "Bet" || h.verdict === "Raise" || h.verdict === "Shove");
  const passive = history.filter((h) => h.verdict === "Check" || h.verdict === "Call");

  // Leak: over-folding (folded with strong equity)
  const overfolds = folds.filter((h) => h.equity >= 0.45);
  // Leak: missed value (checked / called with very strong equity into small pot)
  const missedValue = passive.filter((h) => h.equity >= 0.65 && h.verdict === "Check");
  // Leak: thin bluff stations (raise/bet with low equity + negative EV)
  const bluffMistakes = aggressive.filter((h) => h.equity < 0.30 && h.evCall < 0);
  // Leak: preflop loose calls (Call with required equity > equity, preflop)
  const preflopLeaks = history.filter((h) => h.street === "preflop" && h.verdict === "Call" && h.requiredEquity > h.equity + 0.05);

  const leaks: Leak[] = [];
  if (overfolds.length) {
    const cost = overfolds.reduce((s, h) => s + h.equity * h.pot, 0);
    leaks.push({
      id: "overfold",
      title: "Over-folding strong hands",
      detail: `You folded ${overfolds.length} hand${overfolds.length > 1 ? "s" : ""} with 45%+ equity. Paladin would have called or raised most of these.`,
      examples: overfolds.length,
      severity: overfolds.length >= 3 ? "high" : "medium",
      estEv: -Math.round(cost * 0.3),
    });
  }
  if (missedValue.length) {
    leaks.push({
      id: "missed-value",
      title: "Missing value bets",
      detail: `You checked back ${missedValue.length} spot${missedValue.length > 1 ? "s" : ""} with 65%+ equity. Worse hands would have paid off a half-pot value bet.`,
      examples: missedValue.length,
      severity: missedValue.length >= 3 ? "high" : "medium",
      estEv: -Math.round(missedValue.reduce((s, h) => s + h.pot * 0.4, 0)),
    });
  }
  if (bluffMistakes.length) {
    leaks.push({
      id: "spew",
      title: "Spew aggression",
      detail: `${bluffMistakes.length} aggressive line${bluffMistakes.length > 1 ? "s" : ""} with weak equity and negative EV. Pick better bluff candidates with blockers and equity.`,
      examples: bluffMistakes.length,
      severity: bluffMistakes.length >= 2 ? "high" : "medium",
      estEv: bluffMistakes.reduce((s, h) => s + h.evCall, 0),
    });
  }
  if (preflopLeaks.length) {
    leaks.push({
      id: "preflop-loose",
      title: "Loose preflop calls",
      detail: `${preflopLeaks.length} preflop call${preflopLeaks.length > 1 ? "s" : ""} where the price didn't match your equity. Tighten up out of position.`,
      examples: preflopLeaks.length,
      severity: "low",
      estEv: -Math.round(preflopLeaks.reduce((s, h) => s + h.toCall * 0.5, 0)),
    });
  }

  // Top 5 most expensive hands — by |evCall| or equity-pot mismatch
  const topHands = [...history]
    .map((h) => ({ h, cost: Math.abs(h.evCall) + (h.verdict === "Fold" && h.equity >= 0.45 ? h.equity * h.pot * 0.3 : 0) }))
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 5)
    .map((x) => x.h);

  // Radar stats
  const aggression = totalHands ? clamp01(aggressive.length / Math.max(1, aggressive.length + passive.length)) : 0;
  const foldFrequency = totalHands ? clamp01(folds.length / totalHands) : 0;
  const valueCapture = clamp01(1 - missedValue.length / Math.max(3, totalHands * 0.2));
  const bluffDiscipline = clamp01(1 - bluffMistakes.length / Math.max(3, aggressive.length || 1));
  const preflopTightness = clamp01(1 - preflopLeaks.length / Math.max(3, history.filter((h) => h.street === "preflop").length || 1));

  const estimatedEvLost = leaks.reduce((s, l) => s + Math.min(0, l.estEv), 0);

  return {
    totalHands,
    startedAt,
    endedAt,
    leaks,
    topHands,
    stats: { aggression, foldFrequency, valueCapture, bluffDiscipline, preflopTightness },
    estimatedEvLost,
  };
}
