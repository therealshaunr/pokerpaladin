export type Suit = 0 | 1 | 2 | 3; // clubs, diamonds, hearts, spades
export interface Card {
  r: number; // 2..14 (14 = Ace)
  s: Suit;
}

export type Street = "preflop" | "flop" | "turn" | "river" | "early" | "late";
export type ActionType = "fold" | "check" | "call" | "bet" | "raise" | "allin";

export type VariantId = "nlhe" | "plo" | "plo5" | "stud7";

export interface Variant {
  id: VariantId;
  label: string;
  holeCount: number; // total private cards each player ends with
  boardSize: number; // community cards (0 for stud)
  community: boolean;
  omahaUseTwo: boolean; // must use exactly 2 hole + 3 board
  gating: boolean; // can we model opponent ranges via Chen (2-card games only)
  blurb: string;
}

export const VARIANTS: Record<VariantId, Variant> = {
  nlhe: {
    id: "nlhe",
    label: "No-Limit Hold'em",
    holeCount: 2,
    boardSize: 5,
    community: true,
    omahaUseTwo: false,
    gating: true,
    blurb: "2 hole cards, 5 community cards.",
  },
  plo: {
    id: "plo",
    label: "Pot-Limit Omaha",
    holeCount: 4,
    boardSize: 5,
    community: true,
    omahaUseTwo: true,
    gating: false,
    blurb: "4 hole cards, use exactly 2 + 3 board.",
  },
  plo5: {
    id: "plo5",
    label: "5-Card PLO",
    holeCount: 5,
    boardSize: 5,
    community: true,
    omahaUseTwo: true,
    gating: false,
    blurb: "5 hole cards, use exactly 2 + 3 board.",
  },
  stud7: {
    id: "stud7",
    label: "Seven-Card Stud",
    holeCount: 7,
    boardSize: 0,
    community: false,
    omahaUseTwo: false,
    gating: false,
    blurb: "7 cards each, no community cards.",
  },
};

export interface BlindLevel {
  sb: number;
  bb: number;
  ante: number;
}

export interface OpponentProfile {
  name: string;
  hands: number;
  vpipHands: number;
  pfrHands: number;
  aggressive: number; // bet + raise count
  passive: number; // call count
  folds: number;
  notes: string;
}

// A single seat as read from a screen-share frame by the vision model.
export interface DetectedSeat {
  seat: number;          // 1-based seat index around the table (by screen position)
  name: string;          // username or "Seat N" if unreadable
  stack: number | null;  // chip count, null if unreadable
  hasCards: boolean;     // are hole cards visible / face-down in front of them
  isHero: boolean;       // is this the hero seat
  isEmpty: boolean;      // seat is empty (no player sitting)
  action: ActionType | null; // last visible action this street
  betAmount: number | null;  // chips committed with that action
}

export const SUIT_SYMBOL: Record<Suit, string> = { 0: "♣", 1: "♦", 2: "♥", 3: "♠" };
export const SUIT_LETTER: Record<Suit, string> = { 0: "c", 1: "d", 2: "h", 3: "s" };
export const RANK_LABEL: Record<number, string> = {
  14: "A", 13: "K", 12: "Q", 11: "J", 10: "T",
  9: "9", 8: "8", 7: "7", 6: "6", 5: "5", 4: "4", 3: "3", 2: "2",
};

export function cardKey(c: Card): string {
  return `${c.r}-${c.s}`;
}
export function cardLabel(c: Card): string {
  return `${RANK_LABEL[c.r]}${SUIT_SYMBOL[c.s]}`;
}

const LETTER_TO_RANK: Record<string, number> = {
  A: 14, K: 13, Q: 12, J: 11, T: 10,
  "9": 9, "8": 8, "7": 7, "6": 6, "5": 5, "4": 4, "3": 3, "2": 2,
};
const LETTER_TO_SUIT: Record<string, Suit> = { c: 0, d: 1, h: 2, s: 3 };

// Parse "As", "Th", "9c" -> Card. Returns null if invalid.
export function parseCard(str: string): Card | null {
  if (!str || str.length < 2) return null;
  const r = LETTER_TO_RANK[str[0].toUpperCase()];
  const s = LETTER_TO_SUIT[str[1].toLowerCase()];
  if (r === undefined || s === undefined) return null;
  return { r, s };
}
