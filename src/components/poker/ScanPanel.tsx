import { useEffect } from "react";
import type { SharedShare } from "./GoLivePanel";
import { Button } from "@/components/ui/button";
import { ScanEye } from "lucide-react";

const STANDARD_AUTOSCAN_MS = 8000; // reverse-psych: slow enough to crave Pro

interface Props {
  shared: SharedShare;
  tier: "standard" | "pro";
}

export function ScanPanel({ shared, tier }: Props) {
  // Standard users get a free, slower auto-scan loop so they always have *something* updated.
  useEffect(() => {
    if (tier !== "standard" || !shared.sharing) return;
    const id = setInterval(() => shared.runAnalyze("auto-scan"), STANDARD_AUTOSCAN_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tier, shared.sharing]);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-display text-sm font-bold">
          <ScanEye className="h-4 w-4 text-matrix" /> SCAN NOW · Analyze once
        </div>
        {tier === "standard" && shared.sharing && (
          <span className="font-data text-[10px] uppercase tracking-wider text-matrix">
            auto · every 8s
          </span>
        )}
      </div>

      <Button
        onClick={() => shared.runAnalyze("manual")}
        disabled={shared.busy || !shared.sharing}
        className="mt-3 w-full gap-2 font-bold"
      >
        <ScanEye className="h-4 w-4" />
        {shared.busy ? "Analyzing…" : shared.sharing ? "SCAN NOW" : "Connect screen first ↑"}
      </Button>

      {!shared.sharing && (
        <p className="mt-2 text-[11px] leading-snug text-muted-foreground/70">
          Connect your poker screen in the GO LIVE panel — the same share powers both. We only spend AI when you ask, or once every 8s on Standard.
        </p>
      )}
    </div>
  );
}
