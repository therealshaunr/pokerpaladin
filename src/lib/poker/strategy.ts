import type { Card, OpponentProfile, Variant } from "./types";
import { equity, handPercentile } from "./engine";

export interface DecisionInput {
  variant: Variant;
  hero: Card[];
  board: Card[];
  oppCount: number;
  oppFraction: number;
  pot: number;
  toCall: number;
  heroStack: number;
  bb: number;
}

export interface Decision {
  equity: number;
  requiredEquity: number;
  evCall: number;
  verdict: "Fold" | "Check" | "Call" | "Bet" | "Raise" | "Shove";
  headline: string;
  detail: string;
  suggestedSize?: number;
  shove?: { advised: boolean; pushFraction: number; handPct: number };
}

function pushFractionForBB(bb: number): number {
  if (bb <= 5) return 0.55;
  if (bb <= 8) return 0.42;
  if (bb <= 12) return 0.32;
  if (bb <= 16) return 0.24;
  if (bb <= 20) return 0.18;
  return 0.13;
}

export function decide(input: DecisionInput): Decision {
  const { variant, hero, board, oppCount, oppFraction, pot, toCall, heroStack, bb } = input;
  const eq = hero.length >= 2 ? equity(variant, hero, board, oppCount, oppFraction) : 0;

  const heroBB = bb > 0 ? heroStack / bb : 99;
  const preflop = variant.community && board.length === 0;
  let shove: Decision["shove"];
  if (preflop && variant.gating && hero.length === 2 && heroBB <= 22) {
    const pf = pushFractionForBB(heroBB);
    const pct = handPercentile(hero[0], hero[1]);
    shove = { advised: pct <= pf, pushFraction: pf, handPct: pct };
  }

  if (toCall <= 0) {
    const valueThreshold = oppCount <= 1 ? 0.55 : 0.62;
    if (eq >= valueThreshold) {
      const size = Math.min(heroStack, Math.round(pot * (eq > 0.75 ? 0.75 : 0.5)));
      return {
        equity: eq, requiredEquity: 0, evCall: 0, verdict: "Bet",
        headline: `Bet ~${size} — ${(eq * 100).toFixed(0)}% equity vs ${oppCount} in`,
        detail: `Ahead of the field. Bet for value (~${Math.round((size / Math.max(pot, 1)) * 100)}% pot).`,
        suggestedSize: size, shove,
      };
    }
    return {
      equity: eq, requiredEquity: 0, evCall: 0, verdict: "Check",
      headline: `Check — ${(eq * 100).toFixed(0)}% equity, not enough to value bet`,
      detail: "Control the pot. Bet only as a bluff with a clear read.", shove,
    };
  }

  const required = toCall / (pot + toCall);
  const evCall = eq * pot - (1 - eq) * toCall;
  const margin = eq - required;

  let verdict: Decision["verdict"];
  let headline: string;
  let detail: string;
  let suggestedSize: number | undefined;

  if (margin < -0.03) {
    verdict = "Fold";
    headline = `Fold — need ${(required * 100).toFixed(0)}%, only have ${(eq * 100).toFixed(0)}%`;
    detail = `Calling ${toCall} into ${pot} is -EV (${evCall.toFixed(0)} chips). Let it go.`;
  } else if (margin >= 0.18 && heroStack > toCall) {
    verdict = "Raise";
    suggestedSize = Math.min(heroStack, Math.round((pot + toCall) * 1.1 + toCall));
    headline = `Raise to ~${suggestedSize} — ${(eq * 100).toFixed(0)}% vs ${(required * 100).toFixed(0)}% needed`;
    detail = `Big equity edge (+${(margin * 100).toFixed(0)}%). Raise for value & deny equity.`;
  } else {
    verdict = "Call";
    headline = `Call — ${(eq * 100).toFixed(0)}% vs ${(required * 100).toFixed(0)}% required`;
    detail = `+EV call (~${evCall.toFixed(0)} chips). Thin edge (+${(margin * 100).toFixed(0)}%), just call.`;
  }

  if (shove?.advised && preflop) {
    verdict = "Shove";
    headline = `Shove ${heroStack} (${heroBB.toFixed(0)} bb) — top ${(shove.pushFraction * 100).toFixed(0)}% push range`;
    detail = `Short stack: hand in top ${(shove.handPct * 100).toFixed(0)}% — jam for max fold equity + blinds/antes.`;
  }

  return { equity: eq, requiredEquity: required, evCall, verdict, headline, detail, suggestedSize, shove };
}

// ---------- Opponent profiling (Caro-style behavioral tags) ----------
export interface ProfileReadout {
  vpip: number;
  pfr: number;
  af: number;
  tag: string;
  tagClass: "shark" | "station" | "maniac" | "rock" | "lag" | "tag" | "unknown";
  blurb: string;
}

export function readProfile(p: OpponentProfile): ProfileReadout {
  const hands = Math.max(p.hands, 1);
  const vpip = p.vpipHands / hands;
  const pfr = p.pfrHands / hands;
  const af = p.passive > 0 ? p.aggressive / p.passive : p.aggressive > 0 ? 3 : 0;

  if (p.hands < 4)
    return { vpip, pfr, af, tag: "Unknown", tagClass: "unknown", blurb: "Keep logging actions to build a read." };

  const loose = vpip > 0.32;
  const tight = vpip < 0.2;
  const aggressive = af >= 2 || pfr > 0.16;
  const passive = af < 1;

  if (loose && aggressive) {
    if (vpip > 0.5)
      return { vpip, pfr, af, tag: "Maniac", tagClass: "maniac", blurb: "Plays everything, barrels relentlessly. Trap with strong hands; don't bluff." };
    return { vpip, pfr, af, tag: "LAG", tagClass: "lag", blurb: "Loose-aggressive. Widen calls; let them bet into your value." };
  }
  if (loose && passive)
    return { vpip, pfr, af, tag: "Calling Station", tagClass: "station", blurb: "Calls too much, rarely raises. Value bet thin, never bluff." };
  if (tight && aggressive)
    return { vpip, pfr, af, tag: "Shark / TAG", tagClass: "shark", blurb: "Tight-aggressive. Respect raises; fold marginal hands." };
  if (tight && passive)
    return { vpip, pfr, af, tag: "Rock", tagClass: "rock", blurb: "Tight & passive. When they bet, they have it. Steal their blinds." };
  return { vpip, pfr, af, tag: "Balanced", tagClass: "tag", blurb: "No strong leak yet. Play straightforward poker." };
}

export function fieldLooseness(profiles: ProfileReadout[]): number {
  const known = profiles.filter((p) => p.tagClass !== "unknown");
  if (known.length === 0) return 0.4;
  const avg = known.reduce((s, p) => s + Math.max(0.1, Math.min(0.8, p.vpip)), 0) / known.length;
  return avg;
}
