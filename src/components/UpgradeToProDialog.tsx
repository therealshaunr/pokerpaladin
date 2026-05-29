import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { Sparkles, Crown } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: string;
}

const PRO_PERKS = [
  "Multi-table mode (up to 4 tables)",
  "Session Review & Smart Leak Finder",
  "Advanced opponent tendency callouts",
  "Equity vs ranges calculator",
  "Voice coach (spoken verdicts)",
  "Mobile second-screen mirror",
  "Real-time GO LIVE rescans (2.5s)",
];

export function UpgradeToProDialog({ open, onOpenChange, feature }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-wizard/40 bg-card">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full wizard-gradient">
            <Crown className="h-6 w-6 text-white" />
          </div>
          <DialogTitle className="text-center font-display text-2xl font-black uppercase tracking-wide">
            Unlock Paladin Pro
          </DialogTitle>
          <DialogDescription className="text-center">
            {feature ? <><span className="font-bold text-wizard">{feature}</span> is a Pro feature.</> : "Level up your edge."}
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2 py-2">
          {PRO_PERKS.map((p) => (
            <li key={p} className="flex items-start gap-2 text-sm">
              <Sparkles className="mt-0.5 h-4 w-4 flex-none text-gold" />
              <span>{p}</span>
            </li>
          ))}
        </ul>

        <div className="rounded-lg border border-wizard/30 bg-wizard/5 p-3 text-center">
          <div className="font-display text-3xl font-black text-wizard">$79.99<span className="text-sm text-muted-foreground">/mo</span></div>
          <div className="text-xs text-muted-foreground">Cancel anytime</div>
        </div>

        <Link to="/pricing" onClick={() => onOpenChange(false)}>
          <Button className="w-full wizard-gradient text-white font-bold text-base">Upgrade to Pro</Button>
        </Link>
      </DialogContent>
    </Dialog>
  );
}
