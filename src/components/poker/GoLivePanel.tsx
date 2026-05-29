import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import type { GameApi } from "@/lib/poker/useGame";
import { analyzeTable } from "@/lib/poker/vision.functions";
import { parseCard, cardKey, type Card } from "@/lib/poker/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MonitorUp, Radio, X, Zap } from "lucide-react";

const GO_LIVE_POLL_MS = 2500; // pro: real-time-ish

interface Props {
  game: GameApi;
  tier: "standard" | "pro";
  shared: SharedShare;
}

// Hook providing a single shared screen-share session for GO LIVE + SCAN panels.
export interface SharedShare {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  sharing: boolean;
  startShare: () => Promise<void>;
  stopShare: () => void;
  status: string;
  setStatus: (s: string) => void;
  runAnalyze: (reason: string) => Promise<void>;
  busy: boolean;
  lastRead: string;
}

export function useSharedShare(game: GameApi): SharedShare {
  const { variant, setHero, setBoard, setPot, setToCall, syncFromVision, syncMeta } = game;
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const busyRef = useRef(false);
  const [sharing, setSharing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [lastRead, setLastRead] = useState("");
  const analyze = useServerFn(analyzeTable);

  const stopShare = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setSharing(false);
    setStatus("");
  };

  const startShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 2 }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setSharing(true);
      setStatus("Screen connected — initial scan in 1s…");
      stream.getVideoTracks()[0].addEventListener("ended", stopShare);
      setTimeout(() => runAnalyze("deal-in"), 1200);
    } catch {
      setStatus("Screen share was cancelled or blocked.");
    }
  };

  const grabFrame = (): string | null => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return null;
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 1280 / v.videoWidth);
    canvas.width = v.videoWidth * scale;
    canvas.height = v.videoHeight * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.7);
  };

  const runAnalyze = async (reason: string) => {
    if (busyRef.current) return;
    const image = grabFrame();
    if (!image) {
      setStatus("No frame yet — give the share a second.");
      return;
    }
    busyRef.current = true;
    setBusy(true);
    setStatus(`Reading the table… (${reason})`);
    try {
      const res = await analyze({ data: { image, variantLabel: variant.label } });
      const dead = new Set<string>();
      const toCards = (arr: string[], max: number): Card[] => {
        const out: Card[] = [];
        for (const s of arr) {
          const c = parseCard(s);
          if (c && !dead.has(cardKey(c)) && out.length < max) {
            dead.add(cardKey(c));
            out.push(c);
          }
        }
        return out;
      };
      const holeCards = toCards(res.hole, variant.holeCount);
      const boardCards = variant.community ? toCards(res.board, variant.boardSize) : [];
      if (holeCards.length) setHero(holeCards);
      if (variant.community) setBoard(boardCards);
      if (typeof res.pot === "number") setPot(res.pot);
      if (typeof res.toCall === "number") setToCall(res.toCall);
      if (res.seats.length) syncFromVision(res.seats, res.dealerSeat);
      syncMeta({
        smallBlind: res.smallBlind,
        bigBlind: res.bigBlind,
        ante: res.ante,
        clockSeconds: res.clockSeconds,
        heroToAct: res.heroToAct,
      });
      setLastRead(`${holeCards.length} hole · ${boardCards.length} board · ${res.seats.length} seats${res.notes ? " — " + res.notes : ""}`);
      setStatus(`Updated ${new Date().toLocaleTimeString()}.`);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Vision failed.");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  useEffect(() => () => stopShare(), []);

  return { videoRef, sharing, startShare, stopShare, status, setStatus, runAnalyze, busy, lastRead };
}

export function GoLivePanel({ tier, shared }: Props) {
  const [live, setLive] = useState(false);
  const isPro = tier === "pro";

  useEffect(() => {
    if (!live || !shared.sharing || !isPro) return;
    const id = setInterval(() => shared.runAnalyze("go-live"), GO_LIVE_POLL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, shared.sharing, isPro]);

  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl border-2 p-5",
      isPro ? "border-wizard/60 wizard-gradient/10 shadow-[0_0_40px_oklch(0.55_0.22_295/0.25)]" : "border-gold/50 bg-gold/5"
    )}>
      <div className="pointer-events-none absolute inset-0 opacity-30" style={{ background: "radial-gradient(circle at top right, oklch(0.7 0.2 295 / 0.35), transparent 60%)" }} />
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className={cn("h-5 w-5", isPro ? "text-wizard" : "text-gold")} />
            <div>
              <div className="font-display text-lg font-black uppercase tracking-wide">GO LIVE</div>
              <div className="font-data text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                {isPro ? "Pro · real-time render" : "Pro tier required"}
              </div>
            </div>
          </div>
          {shared.sharing && (
            <button onClick={shared.stopShare} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <video
          ref={shared.videoRef}
          muted
          playsInline
          className="mt-3 aspect-video w-full rounded-md border border-border bg-black/40 object-contain"
          style={{ display: shared.sharing ? "block" : "none" }}
        />

        {!shared.sharing ? (
          <Button onClick={shared.startShare} className="mt-3 w-full gap-2 font-bold">
            <MonitorUp className="h-4 w-4" /> Connect screen
          </Button>
        ) : isPro ? (
          <button
            onClick={() => setLive((v) => !v)}
            className={cn(
              "mt-3 flex w-full items-center justify-center gap-2 rounded-lg px-3 py-3 text-base font-black uppercase tracking-wider transition",
              live ? "bg-wizard text-white glow-wizard" : "wizard-gradient text-white hover:opacity-90"
            )}
          >
            <Radio className={cn("h-5 w-5", live && "live-dot rounded-full")} />
            {live ? "LIVE — watching every 2.5s" : "Go LIVE"}
          </button>
        ) : (
          <div className="mt-3 rounded-lg border border-wizard/40 bg-wizard/10 p-3 text-center">
            <p className="text-xs text-muted-foreground">
              <span className="text-wizard font-semibold">GO LIVE</span> rescans the table every 2.5 seconds so you read the action in near real-time.
            </p>
            <a href="/pricing" className="mt-2 inline-block rounded-md bg-wizard px-3 py-1.5 text-xs font-bold text-white hover:opacity-90">Upgrade to Pro</a>
          </div>
        )}

        {shared.status && <p className="mt-2 font-data text-[11px] text-muted-foreground">{shared.status}</p>}
        {shared.lastRead && <p className="mt-1 font-data text-[10px] text-wizard/80">↳ {shared.lastRead}</p>}
      </div>
    </div>
  );
}
