import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight, BookOpen, ShoppingBag, HelpCircle, LifeBuoy, Smartphone, DollarSign, Sparkles, Gamepad2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { to: "/user-guide", icon: BookOpen, label: "User Guide" },
  { to: "/shop", icon: ShoppingBag, label: "Merch Shop" },
  { to: "/demo", icon: Gamepad2, label: "Simulator" },
  { to: "/how-to-play", icon: Sparkles, label: "How to Play" },
  { to: "/faq", icon: HelpCircle, label: "FAQ" },
  { to: "/pricing", icon: DollarSign, label: "Pricing" },
  { to: "/pocket/install", icon: Smartphone, label: "Paladin Pocket" },
  { to: "/about", icon: ShieldCheck, label: "About · Veteran" },
  { to: "/portal", icon: LifeBuoy, label: "Portal & Support", hash: "support" as const },
] as const;

export function QuickLinksRail() {
  const [open, setOpen] = useState(true);

  return (
    <aside
      className={cn(
        "fixed right-0 top-1/2 z-40 -translate-y-1/2 transition-all",
        open ? "w-56" : "w-10"
      )}
    >
      <div className="rounded-l-2xl border border-r-0 border-gold/40 bg-card/95 backdrop-blur shadow-[0_0_30px_-10px_rgba(212,175,76,0.4)]">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-2 border-b border-border px-3 py-2 text-left hover:bg-gold/5"
          aria-label={open ? "Collapse quick links" : "Expand quick links"}
        >
          <span className={cn("font-data text-[10px] font-bold uppercase tracking-[0.25em] text-gold", !open && "hidden")}>
            Quick Links
          </span>
          <ChevronRight className={cn("h-4 w-4 text-gold transition", open && "rotate-180")} />
        </button>
        {open && (
          <nav className="space-y-0.5 p-2">
            {LINKS.map(({ to, icon: Icon, label, ...rest }) => (
              <Link
                key={to + label}
                to={to}
                {...(rest as object)}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-semibold text-foreground/80 hover:bg-gold/10 hover:text-gold"
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{label}</span>
              </Link>
            ))}
          </nav>
        )}
      </div>
    </aside>
  );
}
