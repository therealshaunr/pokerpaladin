import type { Card, Variant } from "./types";

// ---------- Deck ----------
export function fullDeck(): Card[] {
  const d: Card[] = [];
  for (let r = 2; r <= 14; r++) {
    for (let s = 0; s <= 3; s++) d.push({ r, s: s as 0 | 1 | 2 | 3 });
  }
  return d;
}

const key = (c: Card) => `${c.r}-${c.s}`;

// ---------- 5-card scoring ----------
function scoreFive(cs: Card[]): number {
  const ranks = cs.map((c) => c.r).sort((a, b) => b - a);
  const suits = cs.map((c) => c.s);
  const flush = suits.every((s) => s === suits[0]);
  const uniq = [...new Set(ranks)];

  let straightHigh = 0;
  if (uniq.length === 5) {
    if (ranks[0] - ranks[4] === 4) straightHigh = ranks[0];
    else if (ranks[0] === 14 && ranks[1] === 5 && ranks[2] === 4 && ranks[3] === 3 && ranks[4] === 2)
      straightHigh = 5;
  }

  const counts: Record<number, number> = {};
  for (const r of ranks) counts[r] = (counts[r] || 0) + 1;
  const groups = Object.entries(counts)
    .map(([r, c]) => ({ r: +r, c }))
    .sort((a, b) => b.c - a.c || b.r - a.r);
  const pattern = groups.map((g) => g.c).join("");

  let cat: number;
  if (straightHigh && flush) cat = 8;
  else if (pattern === "41") cat = 7;
  else if (pattern === "32") cat = 6;
  else if (flush) cat = 5;
  else if (straightHigh) cat = 4;
  else if (pattern === "311") cat = 3;
  else if (pattern === "221") cat = 2;
  else if (pattern === "2111") cat = 1;
  else cat = 0;

  let tb: number[];
  if (cat === 8 || cat === 4) tb = [straightHigh, 0, 0, 0, 0];
  else {
    tb = groups.map((g) => g.r);
    while (tb.length < 5) tb.push(0);
  }

  let score = cat;
  for (const t of tb) score = score * 15 + t;
  return score;
}

function combos(n: number, k: number): number[][] {
  const out: number[][] = [];
  const idx: number[] = Array.from({ length: k }, (_, i) => i);
  if (k > n) return out;
  while (true) {
    out.push(idx.slice());
    let i = k - 1;
    while (i >= 0 && idx[i] === n - k + i) i--;
    if (i < 0) break;
    idx[i]++;
    for (let j = i + 1; j < k; j++) idx[j] = idx[j - 1] + 1;
  }
  return out;
}

const COMBO_CACHE: Record<string, number[][]> = {};
function getCombos(n: number, k: number): number[][] {
  const ck = `${n}-${k}`;
  if (!COMBO_CACHE[ck]) COMBO_CACHE[ck] = combos(n, k);
  return COMBO_CACHE[ck];
}

// Best 5-card score from any N>=5 cards.
function best5(cards: Card[]): number {
  if (cards.length < 5) return -1;
  let best = -1;
  for (const c of getCombos(cards.length, 5)) {
    const s = scoreFive([cards[c[0]], cards[c[1]], cards[c[2]], cards[c[3]], cards[c[4]]]);
    if (s > best) best = s;
  }
  return best;
}

// Omaha: exactly 2 from hole + 3 from board.
function bestOmaha(hole: Card[], board: Card[]): number {
  if (board.length < 3 || hole.length < 2) return -1;
  let best = -1;
  for (const hc of getCombos(hole.length, 2)) {
    for (const bc of getCombos(board.length, 3)) {
      const s = scoreFive([
        hole[hc[0]], hole[hc[1]],
        board[bc[0]], board[bc[1]], board[bc[2]],
      ]);
      if (s > best) best = s;
    }
  }
  return best;
}

function evalHand(variant: Variant, hole: Card[], board: Card[]): number {
  if (variant.community && variant.omahaUseTwo) return bestOmaha(hole, board);
  if (variant.community) return best5([...hole, ...board]);
  return best5(hole); // stud
}

// ---------- Chen formula (Hold'em preflop strength) ----------
export function chen(a: Card, b: Card): number {
  const hi = Math.max(a.r, b.r);
  const lo = Math.min(a.r, b.r);
  const ptFor = (r: number) => (r === 14 ? 10 : r === 13 ? 8 : r === 12 ? 7 : r === 11 ? 6 : r / 2);
  let pts = ptFor(hi);
  if (a.r === b.r) {
    pts = Math.max(pts * 2, 5);
  } else {
    if (a.s === b.s) pts += 2;
    const gap = hi - lo - 1;
    if (gap === 1) pts -= 1;
    else if (gap === 2) pts -= 2;
    else if (gap === 3) pts -= 4;
    else if (gap >= 4) pts -= 5;
    if (gap <= 1 && hi < 12) pts += 1;
  }
  return Math.ceil(pts);
}

const SORTED_CHEN: number[] = (() => {
  const deck = fullDeck();
  const arr: number[] = [];
  for (let i = 0; i < deck.length; i++)
    for (let j = i + 1; j < deck.length; j++) arr.push(chen(deck[i], deck[j]));
  arr.sort((x, y) => y - x);
  return arr;
})();

export function chenThreshold(fraction: number): number {
  const f = Math.max(0.02, Math.min(1, fraction));
  const idx = Math.min(SORTED_CHEN.length - 1, Math.floor(f * SORTED_CHEN.length));
  return SORTED_CHEN[idx];
}

export function handPercentile(a: Card, b: Card): number {
  const score = chen(a, b);
  let better = 0;
  for (const s of SORTED_CHEN) if (s > score) better++;
  return better / SORTED_CHEN.length;
}

// ---------- Monte Carlo equity (variant-aware) ----------
function shuffle<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

export function equity(
  variant: Variant,
  hero: Card[],
  board: Card[],
  oppCount: number,
  oppFraction: number,
  trials = 1200
): number {
  if (hero.length === 0) return 0;
  if (oppCount <= 0) return 1;

  const used = new Set<string>();
  for (const c of [...hero, ...board]) used.add(key(c));
  const baseRemaining = fullDeck().filter((c) => !used.has(key(c)));
  const threshold = variant.gating ? chenThreshold(oppFraction) : 0;

  let won = 0;
  let tied = 0;
  let valid = 0;

  for (let t = 0; t < trials; t++) {
    const pool = baseRemaining.slice();
    shuffle(pool);
    let ptr = 0;
    const next = () => pool[ptr++];

    // Complete hero's private cards if needed (stud).
    const heroFull = hero.slice();
    while (heroFull.length < variant.holeCount && ptr < pool.length) heroFull.push(next());

    // Opponent hands.
    const oppHands: Card[][] = [];
    for (let o = 0; o < oppCount; o++) {
      const h: Card[] = [];
      while (h.length < variant.holeCount && ptr < pool.length) {
        if (variant.gating && h.length < 2) {
          // try to honour range for the first 2 cards
          let picked: Card | null = null;
          for (let a = 0; a < 6 && ptr < pool.length; a++) {
            const c = next();
            if (h.length === 0) {
              picked = c;
              break;
            }
            if (chen(h[0], c) >= threshold || a === 5) {
              picked = c;
              break;
            }
          }
          if (picked) h.push(picked);
          else break;
        } else {
          h.push(next());
        }
      }
      oppHands.push(h);
    }

    // Complete board.
    const boardFull = board.slice();
    while (boardFull.length < variant.boardSize && ptr < pool.length) boardFull.push(next());

    const heroScore = evalHand(variant, heroFull, boardFull);
    if (heroScore < 0) continue;

    let best = heroScore;
    let countBest = 1;
    for (const oh of oppHands) {
      const s = evalHand(variant, oh, boardFull);
      if (s > best) {
        best = s;
        countBest = 1;
      } else if (s === best) {
        countBest++;
      }
    }
    valid++;
    if (heroScore === best) {
      if (countBest === 1) won++;
      else tied += 1 / countBest;
    }
  }

  return valid > 0 ? (won + tied) / valid : 0;
}
