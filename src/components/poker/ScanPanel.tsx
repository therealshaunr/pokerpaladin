import { useEffect, useState } from "react";
import type { SharedShare } from "./GoLivePanel";
import { Button } from "@/components/ui/button";
import { ScanEye, MonitorUp, X, Volume2, VolumeX } from "lucide-react";
import { isVoiceOn, setVoiceOn } from "@/lib/audio";

const STANDARD_AUTOSCAN_MS = 8000;

interface Props {
  shared: SharedShare;
  tier: "standard" | "pro";
}

export function ScanPanel({ shared, tier }: Props) {
  const blocked = shared.paused || shared.standby;
  const [voice, setVoice] = useState(false);
  useEffect(() => { setVoice(isVoiceOn()); }, []);
  const toggleVoice = () => { const next = !voice; setVoice(next); setVoiceOn(next); };

  useEffect(() => {
    if (tier !== "standard" || !shared.sharing || blocked) return;
    const id = setInterval(() => shared.runAnalyze("auto-scan"), STANDARD_AUTOSCAN_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tier, shared.sharing, blocked]);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-center gap-2 font-display text-base font-bold text-center">
        <ScanEye className="h-5 w-5 text-matrix" /> SCAN NOW · Analyze once
      </div>
      <div className="mt-1 flex flex-wrap items-center justify-center gap-3 text-center">
        <button
          type="button"
          onClick={toggleVoice}
          className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-data text-[10px] uppercase tracking-wider transition ${voice ? "border-gold bg-gold/10 text-gold" : "border-border text-muted-foreground hover:border-gold/40"}`}
          aria-label={voice ? "Mute Paladin voice" : "Enable Paladin voice"}
        >
          {voice ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
          Paladin voice · {voice ? "On" : "Off"}
        </button>
        {tier === "standard" && shared.sharing && !blocked && (
          <span className="font-data text-xs uppercase tracking-wider text-matrix">auto · every 8s</span>
        )}
        {blocked && (
          <span className="font-data text-xs uppercase tracking-wider text-gold">
            {shared.standby ? "standby" : "paused"}
          </span>
        )}
      </div>

      {/* Single screen-share entry point for the whole app */}
      <video
        ref={shared.videoRef}
        muted
        playsInline
        className="mt-3 aspect-video w-full rounded-md border border-border bg-black/40 object-contain"
        style={{ display: shared.sharing ? "block" : "none" }}
      />

      {!shared.sharing ? (
        <Button onClick={shared.startShare} className="mt-3 w-full gap-2 font-bold text-base justify-center">
          <MonitorUp className="h-5 w-5" /> Connect screen
        </Button>
      ) : (
        <div className="mt-3 flex gap-2">
          <Button
            onClick={() => shared.runAnalyze("manual")}
            disabled={shared.busy}
            className="flex-1 gap-2 font-bold text-base justify-center"
          >
            <ScanEye className="h-5 w-5" />
            {shared.busy ? "Analyzing…" : "SCAN NOW"}
          </Button>
          <Button onClick={shared.stopShare} variant="secondary" size="icon" aria-label="Disconnect screen">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {!shared.sharing && (
        <p className="mt-2 text-center text-sm leading-snug text-muted-foreground/70">
          One screen connection powers SCAN NOW <em>and</em> GO LIVE. We only spend AI when you ask, or once every 8s on Standard.
        </p>
      )}
    </div>
  );
}
