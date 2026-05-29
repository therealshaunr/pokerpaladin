import { useEffect, useState } from "react";
import { type GameConfig, DEFAULT_CONFIG } from "@/lib/poker/useGame";
import { VARIANTS, type VariantId } from "@/lib/poker/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Spade, Lock } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export function GameSetup({ onStart }: { onStart: (cfg: GameConfig) => void }) {
  const [cfg, setCfg] = useState<GameConfig>(DEFAULT_CONFIG);
  const { user } = useAuth();
  const set = <K extends keyof GameConfig>(k: K, v: GameConfig[K]) => setCfg((c) => ({ ...c, [k]: v }));

  // Display name is hard-coded to the user's account profile and cannot be
  // changed in the app — only support can rename it (open a ticket).
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name, name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const locked = data?.display_name || data?.name || user.email?.split("@")[0] || "Hero";
        setCfg((c) => ({ ...c, heroName: locked }));
      });
  }, [user]);

  return (
    <div className="matrix-bg min-h-dvh px-4 py-10">
      <div className="relative z-10 mx-auto max-w-lg">
        <div className="mb-6 text-center">
          <div className="mb-2 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Spade className="h-7 w-7" />
          </div>
          <h1 className="font-display text-2xl font-black tracking-tight">
            POKER<span className="text-matrix"> PALADIN</span>
          </h1>
          <p className="font-data text-sm text-muted-foreground">Pick your game. Set your blinds. Summon the paladin.</p>
        </div>

        <div className="space-y-5 rounded-2xl border border-border bg-card p-5">
          <div className="text-center">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Game</label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(Object.keys(VARIANTS) as VariantId[]).map((id) => (
                <button
                  key={id}
                  onClick={() => set("variantId", id)}
                  className={cn(
                    "rounded-lg border p-2.5 text-left transition",
                    cfg.variantId === id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="text-sm font-semibold">{VARIANTS[id].label}</div>
                  <div className="text-[11px] text-muted-foreground">{VARIANTS[id].blurb}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="text-center">
            <span className="inline-flex items-center justify-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Lock className="h-3 w-3" /> Display name (locked to account)
            </span>
            <Input value={cfg.heroName} readOnly disabled className="mt-1 text-center cursor-not-allowed opacity-80" />
            <p className="mt-1 text-[11px] text-muted-foreground">
              To change your display name, open a support ticket from your portal.
            </p>
          </div>

          <Button onClick={() => onStart(cfg)} className="w-full text-base font-bold justify-center">
            Summon the Paladin →
          </Button>
        </div>
      </div>
    </div>
  );
}
