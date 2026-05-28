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
  const handFlags = useRef<{ vpip: Set<string>; pfr: Set<string> }>({ vpip: new Set(), pfr: new Set() });

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

  const activeOpponents = players.filter((p) => p.inHand && p.name !== config.heroName);
  const hero_ = players.find((p) => p.name === config.heroName);

  return {
    config, setConfig, started, start, variant,
    schedule, levelIdx, blind, secondsLeft, setLevelIdx,
    players, setPlayers, activeOpponents, heroSeat: hero_,
    hero, setHero, board, setBoard, pot, setPot, toCall, setToCall,
    profiles, logAction, setNote, resetProfiles, newHand,
  };
}

export type GameApi = ReturnType<typeof useGame>;
