import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type ActionType,
  type BlindLevel,
  type Card,
  type DetectedSeat,
  type OpponentProfile,
  type VariantId,
  VARIANTS,
} from "./types";

export interface SeatPlayer {
  id: number;
  name: string;
  stack: number;
  inHand: boolean;
}

export interface GameConfig {
  variantId: VariantId;
  startingStack: number;
  numPlayers: number;
  levelMinutes: number;
  anteFromLevel: number; // 1-based level at which antes begin
  heroName: string;
}

const CONFIG_KEY = "poker.config.v1";
const PROFILES_KEY = "poker.profiles.v1";

export const DEFAULT_CONFIG: GameConfig = {
  variantId: "nlhe",
  startingStack: 1500,
  numPlayers: 9,
  levelMinutes: 6,
  anteFromLevel: 8,
  heroName: "Hero",
};

// Blind schedule generator (chip-tournament style escalation).
const BB_LADDER = [20, 30, 40, 60, 100, 150, 200, 300, 400, 600, 800, 1200, 1600, 2400, 3200, 5000];
export function buildSchedule(cfg: GameConfig): BlindLevel[] {
  return BB_LADDER.map((bb, i) => ({
    sb: Math.round(bb / 2),
    bb,
    ante: i + 1 >= cfg.anteFromLevel ? Math.round(bb / 8) : 0,
  }));
}

function load<T>(k: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(k);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

export function useGame() {
  const [config, setConfig] = useState<GameConfig>(() => load(CONFIG_KEY, DEFAULT_CONFIG));
  const [started, setStarted] = useState(false);
  const variant = VARIANTS[config.variantId];

  // Blind level + timer
  const [levelIdx, setLevelIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(config.levelMinutes * 60);
  const schedule = useMemo(() => buildSchedule(config), [config]);
  const blind = schedule[Math.min(levelIdx, schedule.length - 1)];

  useEffect(() => {
    if (!started) return;
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setLevelIdx((l) => Math.min(l + 1, schedule.length - 1));
          return config.levelMinutes * 60;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [started, config.levelMinutes, schedule.length]);

  // Players
  const [players, setPlayers] = useState<SeatPlayer[]>([]);
  const playersRef = useRef<SeatPlayer[]>([]);
  playersRef.current = players;
  const initPlayers = useCallback((cfg: GameConfig) => {
    const list: SeatPlayer[] = [];
    for (let i = 0; i < cfg.numPlayers; i++) {
      list.push({
        id: i,
        name: i === 0 ? cfg.heroName : `Seat ${i + 1}`,
        stack: cfg.startingStack,
        inHand: true,
      });
    }
    setPlayers(list);
  }, []);

  // Hand state (ephemeral)
  const [hero, setHero] = useState<Card[]>([]);
  const [board, setBoard] = useState<Card[]>([]);
  const [pot, setPot] = useState(0);
  const [toCall, setToCall] = useState(0);

  // Opponent profiles (persistent)
  const [profiles, setProfiles] = useState<Record<string, OpponentProfile>>(() =>
    load(PROFILES_KEY, {} as Record<string, OpponentProfile>)
  );
  const profilesRef = useRef(profiles);
  profilesRef.current = profiles;

  const persistProfiles = useCallback((next: Record<string, OpponentProfile>) => {
    setProfiles(next);
    try {
      window.localStorage.setItem(PROFILES_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const ensureProfile = (name: string, src: Record<string, OpponentProfile>): OpponentProfile =>
    src[name] ?? {
      name, hands: 0, vpipHands: 0, pfrHands: 0, aggressive: 0, passive: 0, folds: 0, notes: "",
    };
  // Track which players already counted VPIP/PFR this hand.
  const handFlags = useRef<{ vpip: Set<string>; pfr: Set<string> }>({ vpip: new Set(), pfr: new Set() });

  // Vision reconciliation memory: dedup repeated actions + detect a new deal.
  const lastActionSig = useRef<Record<string, string>>({});
  const lastHasCards = useRef<Record<number, boolean>>({});
  const [liveSeats, setLiveSeats] = useState<Record<number, DetectedSeat>>({});
  const [dealerSeat, setDealerSeat] = useState<number | null>(null);

  const start = useCallback(
    (cfg: GameConfig) => {
      setConfig(cfg);
      try {
        window.localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
      } catch {
        /* ignore */
      }
      initPlayers(cfg);
      setLevelIdx(0);
      setSecondsLeft(cfg.levelMinutes * 60);
      setStarted(true);
    },
    [initPlayers]
  );

  const newHand = useCallback(() => {
    setHero([]);
    setBoard([]);
    setPot(blind ? blind.sb + blind.bb + blind.ante * players.filter((p) => p.inHand).length : 0);
    setToCall(blind ? blind.bb : 0);
    handFlags.current = { vpip: new Set(), pfr: new Set() };
    // mark all seated players in for the new hand & count "hand seen"
    const next = { ...profilesRef.current };
    setPlayers((ps) =>
      ps.map((p) => {
        if (p.name !== config.heroName) {
          const prof = ensureProfile(p.name, next);
          next[p.name] = { ...prof, hands: prof.hands + 1 };
        }
        return { ...p, inHand: true };
      })
    );
    persistProfiles(next);
  }, [blind, players, config.heroName, persistProfiles]);

  const logAction = useCallback(
    (name: string, type: ActionType, amount: number, street: string) => {
      // pot/toCall maintenance
      if (type === "fold") {
        setPlayers((ps) => ps.map((p) => (p.name === name ? { ...p, inHand: false } : p)));
      }
      if (type === "call") {
        setPot((p) => p + toCall);
      }
      if (type === "bet" || type === "raise" || type === "allin") {
        setPot((p) => p + amount);
        setToCall(amount);
      }

      if (name === config.heroName) return; // don't profile the hero

      const next = { ...profilesRef.current };
      const prof = ensureProfile(name, next);
      const updated = { ...prof };
      const isPre = street === "preflop";
      if (type === "fold") updated.folds += 1;
      if (type === "call") {
        updated.passive += 1;
        if (isPre && !handFlags.current.vpip.has(name)) {
          updated.vpipHands += 1;
          handFlags.current.vpip.add(name);
        }
      }
      if (type === "bet" || type === "raise" || type === "allin") {
        updated.aggressive += 1;
        if (isPre) {
          if (!handFlags.current.vpip.has(name)) {
            updated.vpipHands += 1;
            handFlags.current.vpip.add(name);
          }
          if (!handFlags.current.pfr.has(name)) {
            updated.pfrHands += 1;
            handFlags.current.pfr.add(name);
          }
        }
      }
      next[name] = updated;
      persistProfiles(next);
    },
    [toCall, config.heroName, persistProfiles]
  );

  const setNote = useCallback(
    (name: string, notes: string) => {
      const next = { ...profilesRef.current };
      next[name] = { ...ensureProfile(name, next), notes };
      persistProfiles(next);
    },
    [persistProfiles]
  );

  const resetProfiles = useCallback(() => persistProfiles({}), [persistProfiles]);

  /**
   * Reconcile a vision snapshot with tracked players:
   *  - locks seats by screen position (seat index)
   *  - "no cards = folded" (strict for the current hand)
   *  - cards reappearing on a folded/empty seat => new deal (reset fold flags)
   *  - empty seats retire; a new username at a seat registers fresh analytics
   *  - dedups repeated actions across frames so stats aren't double-counted
   */
  const syncFromVision = useCallback(
    (seats: DetectedSeat[], dealer: number | null) => {
      if (!seats.length) return;
      if (dealer != null) setDealerSeat(dealer);
      setLiveSeats(() => {
        const map: Record<number, DetectedSeat> = {};
        for (const s of seats) map[s.seat] = s;
        return map;
      });

      // --- new-deal detection: a seat that had no cards now shows cards ---
      let newDeal = false;
      for (const s of seats) {
        const prev = lastHasCards.current[s.seat];
        if (s.hasCards && prev === false) newDeal = true;
        lastHasCards.current[s.seat] = s.hasCards;
      }
      if (newDeal) {
        handFlags.current = { vpip: new Set(), pfr: new Set() };
        lastActionSig.current = {};
      }

      const profilesNext = { ...profilesRef.current };
      let profilesDirty = false;

      setPlayers((prev) => {
        // grow the seat list if the table shows more seats than configured
        const maxSeat = Math.max(prev.length, ...seats.map((s) => s.seat));
        const next: SeatPlayer[] = [];
        for (let i = 0; i < maxSeat; i++) {
          next[i] = prev[i] ?? { id: i, name: `Seat ${i + 1}`, stack: config.startingStack, inHand: true };
        }

        for (const s of seats) {
          const idx = s.seat - 1;
          if (idx < 0 || idx >= next.length) continue;
          const cur = next[idx];
          const isHeroSeat = s.isHero || cur.name === config.heroName;

          // empty seat -> retire
          if (s.isEmpty) {
            next[idx] = { ...cur, name: `Seat ${idx + 1}`, inHand: false };
            continue;
          }

          // new player took this seat -> register fresh analytics from now
          let name = cur.name;
          if (!isHeroSeat && s.name && !s.name.startsWith("Seat ") && s.name !== cur.name) {
            name = s.name;
            if (!profilesNext[name]) {
              profilesNext[name] = ensureProfile(name, profilesNext);
              profilesDirty = true;
            }
          }

          next[idx] = {
            ...cur,
            name,
            stack: s.stack != null ? s.stack : cur.stack,
            inHand: s.hasCards, // no cards = folded/out for this hand
          };
        }
        return next;
      });

      if (profilesDirty) persistProfiles(profilesNext);

      // --- log de-duplicated actions into the profiling pipeline ---
      const streetGuess = board.length === 0 ? "preflop" : "postflop";
      for (const s of seats) {
        if (s.isEmpty || !s.action) continue;
        const idx = s.seat - 1;
        const seatPlayer = playersRef.current[idx];
        if (s.isHero || seatPlayer?.name === config.heroName) continue;
        const name =
          s.name && !s.name.startsWith("Seat ") ? s.name : seatPlayer?.name ?? `Seat ${idx + 1}`;
        if (!name || name === config.heroName) continue;
        const sig = `${s.action}:${s.betAmount ?? 0}:${streetGuess}`;
        if (lastActionSig.current[name] === sig) continue;
        lastActionSig.current[name] = sig;
        logAction(name, s.action, s.betAmount ?? 0, streetGuess);
      }
    },
    [config.startingStack, config.heroName, board.length, logAction, persistProfiles]
  );



  const activeOpponents = players.filter((p) => p.inHand && p.name !== config.heroName);
  const hero_ = players.find((p) => p.name === config.heroName);

  return {
    config, setConfig, started, start, variant,
    schedule, levelIdx, blind, secondsLeft, setLevelIdx,
    players, setPlayers, activeOpponents, heroSeat: hero_,
    hero, setHero, board, setBoard, pot, setPot, toCall, setToCall,
    profiles, logAction, setNote, resetProfiles, newHand,
    syncFromVision, liveSeats, dealerSeat,
  };
}

export type GameApi = ReturnType<typeof useGame>;
