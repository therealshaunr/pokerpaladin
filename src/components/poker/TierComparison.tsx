import { Radio, ScanEye, Zap, ShieldCheck } from "lucide-react";

export function TierComparison() {
  return (
    <div className="rounded-xl border border-border bg-card/40 p-4">
      <div className="mb-3 flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-gold" />
        <span className="font-display text-sm font-bold uppercase tracking-wide">GO LIVE vs SCAN NOW</span>
      </div>

      <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
        <span className="text-wizard font-semibold">GO LIVE</span> is about as close to real-time table-rendering as humanly possible — while still leaving you the breath to read, react, and make an informed decision. It's training wheels for the cleric in you: every hand it sharpens your instincts until you start <span className="text-gold font-semibold">channeling the Paladin yourself</span>.
      </p>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-lg border border-wizard/40 wizard-gradient/10 bg-wizard/5 p-3">
          <div className="flex items-center gap-1.5 text-wizard">
            <Radio className="h-3.5 w-3.5" />
            <span className="font-display text-xs font-bold uppercase tracking-wider">GO LIVE · Pro</span>
          </div>
          <ul className="mt-2 space-y-1 text-[11px] text-muted-foreground">
            <li>• Re-reads the table every <span className="text-wizard font-semibold">2.5 seconds</span></li>
            <li>• Locks the verdict the instant action reaches you</li>
            <li>• Voice + Focus Lens add-ons supported</li>
            <li>• Counts toward your monthly Go-Live hours</li>
          </ul>
        </div>
        <div className="rounded-lg border border-border bg-secondary/30 p-3">
          <div className="flex items-center gap-1.5 text-matrix">
            <ScanEye className="h-3.5 w-3.5" />
            <span className="font-display text-xs font-bold uppercase tracking-wider">SCAN NOW · Standard</span>
          </div>
          <ul className="mt-2 space-y-1 text-[11px] text-muted-foreground">
            <li>• Auto-scans every <span className="text-matrix font-semibold">8 seconds</span> (free, doesn't count against hours)</li>
            <li>• Tap SCAN NOW any time for an on-demand read</li>
            <li>• You'll feel the lag — that's the point. Upgrade when you're ready</li>
            <li>• Same math, same Paladin, slower update cadence</li>
          </ul>
        </div>
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-gold/80">
        <Zap className="h-3 w-3" /> "Standard is the squire. Pro is the Paladin in full plate."
      </p>
    </div>
  );
}
