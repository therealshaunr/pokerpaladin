import { useEffect } from "react";
import type { SharedShare } from "./GoLivePanel";
import { Button } from "@/components/ui/button";
import { ScanEye } from "lucide-react";

const STANDARD_AUTOSCAN_MS = 8000;

interface Props {
  shared: SharedShare;
  tier: "standard" | "pro";
}

export function ScanPanel({ shared, tier }: Props) {
  const blocked = shared.paused || shared.standby;

  useEffect(() => {
    if (tier !== "standard" || !shared.sharing || blocked) return;
    const id = setInterval(() => shared.runAnalyze("auto-scan"), STANDARD_AUTOSCAN_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tier, shared.sharing, blocked]);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-display text-base font-bold">
          <ScanEye className="h-5 w-5 text-matrix" /> SCAN NOW · Analyze once
        </div>
        {tier === "standard" && shared.sharing && !blocked && (
          <span className="font-data text-xs uppercase tracking-wider text-matrix">
            auto · every 8s
          </span>
        )}
        {blocked && (
          <span className="font-data text-xs uppercase tracking-wider text-gold">
            {shared.standby ? "standby" : "paused"}
          </span>
        )}
      </div>

      <Button
        onClick={() => shared.runAnalyze("manual")}
        disabled={shared.busy || !shared.sharing}
        className="mt-3 w-full gap-2 font-bold text-base"
      >
        <ScanEye className="h-5 w-5" />
        {shared.busy ? "Analyzing…" : shared.sharing ? "SCAN NOW" : "Connect screen first ↑"}
      </Button>

      {!shared.sharing && (
        <p className="mt-2 text-sm leading-snug text-muted-foreground/70">
          Connect your poker screen in the GO LIVE panel — the same share powers both. We only spend AI when you ask, or once every 8s on Standard.
        </p>
      )}
    </div>
  );
}
