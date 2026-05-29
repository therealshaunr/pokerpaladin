import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

type Cadence = "one-time" | "monthly" | "quarterly" | "yearly";

const OPTIONS: { id: Cadence; label: string; sub: string }[] = [
  { id: "one-time", label: "Just this once", sub: "Single order, no recurring." },
  { id: "monthly", label: "Monthly drop", sub: "Fresh gear every month." },
  { id: "quarterly", label: "Quarterly drop", sub: "A new piece every 3 months." },
  { id: "yearly", label: "Annual loadout", sub: "One curated drop per year." },
];

/**
 * Asked when a customer adds apparel (especially a hoodie) to the cart.
 * Recurring options are stubbed until apparel-subscription Stripe prices
 * are wired up; they DO NOT affect the user's existing Paladin plan.
 */
export function SizeSubscribePrompt({
  open,
  onClose,
  productName,
  onChoose,
}: {
  open: boolean;
  onClose: () => void;
  productName: string;
  onChoose: (cadence: Cadence) => void;
}) {
  const [picked, setPicked] = useState<Cadence>("one-time");

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gold" />
            Make {productName} a Paladin drop?
          </DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          Subscribe and get a fresh piece on a cadence you choose. Recurring drops
          are billed separately from your Paladin app subscription — your plan is
          never touched.
        </p>
        <div className="mt-2 space-y-1.5">
          {OPTIONS.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => setPicked(o.id)}
              className={cn(
                "w-full rounded-lg border p-3 text-left transition",
                picked === o.id
                  ? "border-gold bg-gold/10"
                  : "border-border bg-card hover:border-gold/40",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-sm font-bold">{o.label}</span>
                {o.id !== "one-time" && (
                  <span className="font-data text-[10px] uppercase tracking-wider text-wizard">
                    Coming soon
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{o.sub}</p>
            </button>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <Button variant="ghost" size="sm" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="flex-1 font-bold"
            onClick={() => {
              onChoose(picked);
              onClose();
            }}
          >
            Confirm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
