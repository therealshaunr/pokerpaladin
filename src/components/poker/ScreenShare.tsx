import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import type { GameApi } from "@/lib/poker/useGame";
import { analyzeTable } from "@/lib/poker/vision.functions";
import { parseCard, cardKey, type Card } from "@/lib/poker/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MonitorUp, ScanEye, X, Radio } from "lucide-react";

const POLL_MS = 5000; // re-scan the table every 5 seconds while LIVE



export function ScreenShare({ game }: { game: GameApi }) {
  const { variant, setHero, setBoard, setPot, setToCall, syncFromVision, syncMeta } = game;

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const busyRef = useRef(false);
  const [sharing, setSharing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [lastRead, setLastRead] = useState<string>("");
  const analyze = useServerFn(analyzeTable);

  const startShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 2 }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setSharing(true);
      setStatus("Screen connected — running first scan to fill the table…");
      stream.getVideoTracks()[0].addEventListener("ended", stopShare);
      // auto deal-in scan: fill stacks, blinds, level, clock, cards once a frame exists
      setTimeout(() => runAnalyze("deal-in scan"), 1200);

    } catch {
      setStatus("Screen share was cancelled or blocked.");
    }
  };

  const stopShare = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setSharing(false);
    setLive(false);
    setStatus("");
  };

  // full-res JPEG for the AI
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
      if (variant.community) setBoard(boardCards); // always sync the board (clears on a new hand)
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

      setLastRead(
        `${holeCards.length} hole · ${boardCards.length} board · ${res.seats.length} seats` +
          (res.notes ? ` — ${res.notes}` : "")
      );
      setStatus(`Updated ${new Date().toLocaleTimeString()}.`);

    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Vision failed.");
      setLive(false); // stop hammering on errors (rate limit / credits)
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  // LIVE loop: re-scan the table every 5 seconds to stay current
  useEffect(() => {
    if (!live || !sharing) return;
    const id = setInterval(() => {
      if (busyRef.current) return;
      runAnalyze("auto refresh");
    }, POLL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, sharing]);

  useEffect(() => () => stopShare(), []);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-display text-sm font-bold">
          <ScanEye className="h-4 w-4 text-wizard" /> Live table reader
        </div>
        {sharing && (
          <button onClick={stopShare} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <video
        ref={videoRef}
        muted
        playsInline
        className="mt-2 aspect-video w-full rounded-md border border-border bg-black/40 object-contain"
        style={{ display: sharing ? "block" : "none" }}
      />

      {!sharing ? (
        <Button onClick={startShare} variant="secondary" className="mt-2 w-full gap-2">
          <MonitorUp className="h-4 w-4" /> Connect screen
        </Button>
      ) : (
        <div className="mt-2 space-y-2">
          <button
            onClick={() => setLive((v) => !v)}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-bold uppercase tracking-wide transition",
              live ? "bg-matrix text-black glow-matrix" : "bg-secondary text-foreground hover:bg-secondary/70"
            )}
          >
            <Radio className={cn("h-4 w-4", live && "live-dot rounded-full")} />
            {live ? "LIVE — watching" : "Go LIVE"}
          </button>
          <Button onClick={() => runAnalyze("manual")} disabled={busy} variant="secondary" className="w-full gap-2">
            <ScanEye className="h-4 w-4" /> {busy ? "Analyzing…" : "Analyze once"}
          </Button>
        </div>
      )}

      {status && <p className="mt-2 font-data text-xs text-muted-foreground">{status}</p>}
      {lastRead && <p className="mt-1 font-data text-[11px] text-matrix/80">↳ {lastRead}</p>}
      <p className="mt-2 text-[11px] leading-snug text-muted-foreground/70">
        Pick the poker tab/window to share. The engine only spends AI when the table visibly changes, auto-fills cards,
        chips and actions, and treats a seat with no cards as folded. Always confirm — the local math is the source of truth.
      </p>
    </div>
  );
}
