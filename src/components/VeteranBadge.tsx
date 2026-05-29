import { ShieldCheck, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Veteran-owned trust badge — shown near checkout, on product pages,
 * and as a home-page ribbon. Calls out Wounded Warrior contributions
 * and the founder's military background.
 */
export function VeteranBadge({ compact, className }: { compact?: boolean; className?: string }) {
  if (compact) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-md border border-gold/40 bg-gold/10 px-2.5 py-1 font-data text-[10px] font-bold uppercase tracking-[0.18em] text-gold",
          className,
        )}
      >
        <ShieldCheck className="h-3.5 w-3.5" />
        Veteran Owned
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-gold/40 bg-gradient-to-br from-gold/10 via-card to-transparent p-4 shadow-[0_0_30px_-15px_rgba(212,175,76,0.5)]",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gold/50 bg-gold/15">
          <ShieldCheck className="h-5 w-5 text-gold" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display text-sm font-black uppercase tracking-wide text-gold">
            Military Veteran Owned
          </div>
          <p className="mt-1 text-xs leading-snug text-foreground/80">
            A portion of every order supports the{" "}
            <span className="font-semibold text-gold">Wounded Warrior Project</span>. We
            volunteer at our local VA and live by one rule:{" "}
            <span className="italic">never leave a brother behind.</span>
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 font-data text-[10px] uppercase tracking-[0.2em] text-wizard">
            <Heart className="h-3 w-3" /> Built by a U.S. Air Force veteran
          </div>
        </div>
      </div>
    </div>
  );
}
