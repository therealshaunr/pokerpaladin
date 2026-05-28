import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import type { GameApi } from "@/lib/poker/useGame";
import { analyzeTable } from "@/lib/poker/vision.functions";
import { parseCard, cardKey, type Card } from "@/lib/poker/types";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { MonitorUp, ScanEye, X } from "lucide-react";

export function ScreenShare({ game }: { game: GameApi }) {
  const { variant, setHero, setBoard, setPot, setToCall } = game;
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [sharing, setSharing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [auto, setAuto] = useState(false);
  const [status, setStatus] = useState<string>("");
  const analyze = useServerFn(analyzeTable);

  const startShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 1 }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setSharing(true);
      setStatus("Screen connected. Click Analyze when it's your turn.");
      stream.getVideoTracks()[0].addEventListener("ended", stopShare);
    } catch {
      setStatus("Screen share was cancelled or blocked.");
    }
  };

  const stopShare = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setSharing(false);
    setAuto(false);
    setStatus("");
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

  const runAnalyze = async () => {
    const image = grabFrame();
    if (!image) {
      setStatus("No frame yet — give the share a second.");
      return;
    }
    setBusy(true);
    setStatus("Reading the table…");
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
      if (boardCards.length) setBoard(boardCards);
      if (typeof res.pot === "number") setPot(res.pot);
      if (typeof res.toCall === "number") setToCall(res.toCall);
      setStatus(
        `Read ${holeCards.length} hole / ${boardCards.length} board card(s). Confirm or fix below.` +
          (res.notes ? ` (${res.notes})` : "")
      );
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Vision failed.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!auto || !sharing) return;
    const id = setInterval(() => {
      if (!busy) runAnalyze();
    }, 8000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, sharing, busy]);

  useEffect(() => () => stopShare(), []);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <ScanEye className="h-4 w-4 text-primary" /> Screen-share assist
        </div>
        {sharing && (
          <button onClick={stopShare} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <video ref={videoRef} muted playsInline className="mt-2 aspect-video w-full rounded-md border border-border bg-black/40 object-contain" style={{ display: sharing ? "block" : "none" }} />

      {!sharing ? (
        <Button onClick={startShare} variant="secondary" className="mt-2 w-full gap-2">
          <MonitorUp className="h-4 w-4" /> Connect screen
        </Button>
      ) : (
        <div className="mt-2 space-y-2">
          <Button onClick={runAnalyze} disabled={busy} className="w-full gap-2">
            <ScanEye className="h-4 w-4" /> {busy ? "Analyzing…" : "Analyze table now"}
          </Button>
          <div className="flex items-center justify-between rounded-lg bg-secondary/40 px-3 py-2 text-xs">
            <span className="text-muted-foreground">Auto-read every 8s (uses AI credits)</span>
            <Switch checked={auto} onCheckedChange={setAuto} />
          </div>
        </div>
      )}

      {status && <p className="mt-2 text-xs text-muted-foreground">{status}</p>}
      <p className="mt-2 text-[11px] leading-snug text-muted-foreground/70">
        Experimental: AI reads a snapshot and pre-fills cards/pot — always confirm. The math engine runs locally and is the source of truth.
      </p>
    </div>
  );
}
