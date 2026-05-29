import { Radio, ScanEye, Zap, ShieldCheck, Check, X } from "lucide-react";

export function TierComparison() {
  const rows: { label: string; standard: string | boolean; pro: string | boolean }[] = [
    { label: "Auto-scan cadence", standard: "Every 8s", pro: "Every 2.5s" },
    { label: "On-demand SCAN NOW", standard: true, pro: true },
    { label: "Verdict locks the instant action reaches you", standard: false, pro: true },
    { label: "Voice Companion compatible", standard: false, pro: true },
    { label: "Focus Lens compatible", standard: false, pro: true },
    { label: "Counts against monthly Go-Live hours", standard: "No (free)", pro: "Yes (60h/mo)" },
    { label: "Same Paladin math engine", standard: true, pro: true },
  ];

  return (
    <div className="mx-auto max-w-4xl rounded-2xl border border-border bg-card/40 p-6 md:p-8 text-center">
      <div className="mb-4 flex items-center justify-center gap-2">
        <ShieldCheck className="h-5 w-5 text-gold" />
        <h2 className="font-display text-xl md:text-2xl font-black uppercase tracking-wide">GO LIVE vs SCAN NOW</h2>
      </div>

      <p className="mx-auto mb-6 max-w-2xl text-base md:text-lg leading-relaxed text-muted-foreground text-center">
        <span className="text-wizard font-semibold">GO LIVE</span> is about as close to real-time table-rendering as humanly possible — while still leaving you the breath to read, react, and make an informed decision. It's training wheels for the cleric in you: every hand sharpens your instincts until you start <span className="text-gold font-semibold">channeling the Paladin yourself</span>.
      </p>

      <div className="grid gap-0 sm:grid-cols-2 overflow-hidden rounded-xl border border-border">
        {/* Headers */}
        <div className="bg-wizard/10 border-b sm:border-b-0 sm:border-r border-border p-4">
          <div className="flex items-center justify-center gap-1.5 text-wizard">
            <Radio className="h-4 w-4" />
            <span className="font-display text-sm md:text-base font-bold uppercase tracking-wider">GO LIVE · Pro</span>
          </div>
        </div>
        <div className="bg-secondary/30 p-4">
          <div className="flex items-center justify-center gap-1.5 text-matrix">
            <ScanEye className="h-4 w-4" />
            <span className="font-display text-sm md:text-base font-bold uppercase tracking-wider">SCAN NOW · Standard</span>
          </div>
        </div>
      </div>

      {/* Comparison rows */}
      <ul className="mt-0 divide-y divide-border rounded-b-xl border border-t-0 border-border overflow-hidden">
        {rows.map((r) => (
          <li key={r.label} className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] items-center gap-2 px-4 py-3 text-left sm:text-center">
            <span className="text-sm md:text-[15px] text-foreground/90 sm:text-left">{r.label}</span>
            <Cell value={r.standard} tone="wizard" colHeader="Pro" />
            <Cell value={r.pro} tone="matrix" colHeader="Std" swap />
          </li>
        ))}
      </ul>

      <p className="mt-5 flex items-center justify-center gap-1.5 text-xs md:text-sm text-gold/80">
        <Zap className="h-3.5 w-3.5" /> "Standard is the squire. Pro is the Paladin in full plate."
      </p>
    </div>
  );
}

function Cell({ value, tone, swap }: { value: string | boolean; tone: "wizard" | "matrix"; colHeader: string; swap?: boolean }) {
  // Pro column on the left visually, Standard on the right — match grid order with swap
  const color = swap ? "text-matrix" : "text-wizard";
  void tone;
  return (
    <span className={`sm:min-w-[140px] inline-flex items-center justify-center font-data text-sm md:text-[15px] ${color}`}>
      {typeof value === "boolean" ? (
        value ? <Check className="h-4 w-4" /> : <X className="h-4 w-4 text-muted-foreground/50" />
      ) : (
        value
      )}
    </span>
  );
}
