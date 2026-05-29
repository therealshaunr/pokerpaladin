import { useState } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtPrice } from "@/lib/cart";

const PRESETS = [100, 500, 1000, 2500]; // cents — $1, $5, $10, $25

/**
 * Optional "round up for charity" panel — adds a Wounded Warrior Project
 * donation as an extra line item at checkout. Amount is pure passthrough
 * (not discounted, not used to qualify free shipping).
 */
export function CharityDonation({
  amountCents,
  onChange,
}: {
  amountCents: number;
  onChange: (cents: number) => void;
}) {
  const [custom, setCustom] = useState("");
  const isCustomActive = amountCents > 0 && !PRESETS.includes(amountCents);

  return (
    <div className="rounded-2xl border border-wizard/40 bg-gradient-to-br from-wizard/10 via-card to-transparent p-4">
      <div className="flex items-center gap-2">
        <Heart className="h-4 w-4 text-wizard" />
        <h3 className="font-display text-sm font-black uppercase tracking-wide">
          Add a donation · Wounded Warrior Project
        </h3>
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">
        100% of this amount is forwarded to{" "}
        <a
          href="https://www.woundedwarriorproject.org"
          target="_blank"
          rel="noopener noreferrer"
          className="text-wizard underline"
        >
          Wounded Warrior Project
        </a>
        . Every dollar honors a brother or sister in arms.
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => {
            onChange(0);
            setCustom("");
          }}
          className={cn(
            "rounded-md border px-2.5 py-1 font-data text-[11px] font-bold uppercase tracking-wider transition",
            amountCents === 0
              ? "border-wizard bg-wizard/15 text-wizard"
              : "border-border bg-card text-muted-foreground hover:border-wizard/40",
          )}
        >
          None
        </button>
        {PRESETS.map((cents) => (
          <button
            key={cents}
            type="button"
            onClick={() => {
              onChange(cents);
              setCustom("");
            }}
            className={cn(
              "rounded-md border px-2.5 py-1 font-data text-[11px] font-bold uppercase tracking-wider transition",
              amountCents === cents
                ? "border-wizard bg-wizard/15 text-wizard"
                : "border-border bg-card text-foreground hover:border-wizard/40",
            )}
          >
            {fmtPrice(cents)}
          </button>
        ))}
        <div
          className={cn(
            "inline-flex items-center rounded-md border px-1.5 transition",
            isCustomActive ? "border-wizard bg-wizard/10" : "border-border bg-card",
          )}
        >
          <span className="pl-1 font-data text-[11px] font-bold text-muted-foreground">$</span>
          <input
            type="number"
            min="0"
            max="500"
            step="1"
            value={custom}
            onChange={(e) => {
              const raw = e.target.value;
              setCustom(raw);
              const n = Math.max(0, Math.min(50000, Math.round(Number(raw) * 100) || 0));
              onChange(n);
            }}
            placeholder="Other"
            className="w-16 bg-transparent px-1 py-1 font-data text-[11px] outline-none placeholder:text-muted-foreground/60"
          />
        </div>
      </div>
    </div>
  );
}
