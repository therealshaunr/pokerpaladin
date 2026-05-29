import type { OpponentProfile } from "@/lib/poker/types";
import { readProfile } from "@/lib/poker/strategy";
import { Eye, Lock } from "lucide-react";

const TAG_COPY: Record<string, string> = {
  shark: "is a thinking player — ranges are tight and balanced; bluffs are picked spots.",
  station: "is a calling station — pays off thin value but rarely bluffs. Bet value wide.",
  maniac: "is a maniac — overbets and 3-bets light. Tighten up and let them hang themselves.",
  rock: "is a rock — opens premium only. Fold to their aggression unless you have a monster.",
  lag: "is loose-aggressive — wide ranges, lots of barrels. Call lighter, raise medium-strong.",
  tag: "is tight-aggressive — value-heavy when they bet big. Respect river barrels.",
};

interface Props {
  profiles: Record<string, OpponentProfile>;
  activeNames: string[];
  isPro: boolean;
  onUpgrade?: () => void;
}

export function TendencyCallout({ profiles, activeNames, isPro, onUpgrade }: Props) {
  if (!activeNames.length) return null;
  const candidates = activeNames
    .map((n) => ({ name: n, prof: profiles[n] }))
    .filter((x) => x.prof && x.prof.hands >= 10)
    .map((x) => ({ ...x, read: readProfile(x.prof!) }))
    .filter((x) => x.read.tagClass !== "unknown");

  if (!candidates.length) return null;

  if (!isPro) {
    return (
      <button
        onClick={onUpgrade}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-wizard/30 bg-wizard/5 p-3 text-left text-xs hover:bg-wizard/10 transition"
      >
        <span className="flex items-center gap-2">
          <Lock className="h-3 w-3 text-wizard" />
          <span className="font-semibold text-wizard">Tendency reads · Pro</span>
          <span className="text-muted-foreground">— {candidates.length} villain profile{candidates.length > 1 ? "s" : ""} ready</span>
        </span>
        <span className="font-data text-[10px] uppercase tracking-wider text-wizard">Unlock</span>
      </button>
    );
  }

  // Show the most "actionable" one (loosest/most aggressive first)
  const ranked = [...candidates].sort((a, b) => (b.read.vpip + b.read.af) - (a.read.vpip + a.read.af));
  const top = ranked[0];
  const copy = TAG_COPY[top.read.tagClass] ?? top.read.blurb;

  return (
    <div className="rounded-lg border border-gold/40 bg-gold/5 p-3 text-xs">
      <div className="flex items-start gap-2">
        <Eye className="mt-0.5 h-3.5 w-3.5 flex-none text-gold" />
        <div>
          <span className="font-bold text-gold">{top.name}</span>
          <span className="text-foreground/90"> {copy}</span>
          <div className="mt-1 font-data text-[10px] uppercase tracking-wider text-muted-foreground">
            {top.prof!.hands}h · VPIP {(top.read.vpip * 100).toFixed(0)} · PFR {(top.read.pfr * 100).toFixed(0)} · AF {top.read.af.toFixed(1)}
          </div>
        </div>
      </div>
    </div>
  );
}
