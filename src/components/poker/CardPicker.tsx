import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type Card, type Suit, RANK_LABEL, SUIT_SYMBOL, cardKey, cardLabel } from "@/lib/poker/types";

interface Props {
  label: string;
  cards: Card[];
  max: number;
  disabledKeys: Set<string>;
  onChange: (cards: Card[]) => void;
  accent?: "primary" | "muted";
}

const RANKS = [14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
const SUITS: Suit[] = [3, 2, 1, 0]; // s h d c

function suitColor(s: Suit) {
  return s === 2 || s === 1 ? "text-[oklch(0.7_0.2_25)]" : "text-foreground";
}

export function CardPicker({ label, cards, max, disabledKeys, onChange, accent = "primary" }: Props) {
  const [open, setOpen] = useState(false);
  const selectedKeys = useMemo(() => new Set(cards.map(cardKey)), [cards]);

  const toggle = (c: Card) => {
    const k = cardKey(c);
    if (selectedKeys.has(k)) {
      onChange(cards.filter((x) => cardKey(x) !== k));
    } else if (cards.length < max && !disabledKeys.has(k)) {
      onChange([...cards, c]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative flex items-center justify-center">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">
          {label} <span className="opacity-60">({cards.length}/{max})</span>
        </span>
        {cards.length > 0 && (
          <button onClick={() => onChange([])} className="absolute right-0 text-xs text-muted-foreground hover:text-foreground">
            clear
          </button>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {cards.map((c) => (
          <button
            key={cardKey(c)}
            onClick={() => toggle(c)}
            className={cn(
              "flex h-12 w-9 items-center justify-center rounded-md border-2 bg-card text-base font-bold shadow",
              accent === "primary" ? "border-primary" : "border-border",
              suitColor(c.s)
            )}
          >
            {cardLabel(c)}
          </button>
        ))}
        {cards.length < max && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button className="flex h-12 w-9 items-center justify-center rounded-md border-2 border-dashed border-border text-xl text-muted-foreground hover:border-primary hover:text-primary">
                +
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Pick {label}</DialogTitle>
              </DialogHeader>
              <div className="space-y-1.5">
                {SUITS.map((s) => (
                  <div key={s} className="flex gap-1">
                    {RANKS.map((r) => {
                      const c: Card = { r, s };
                      const k = cardKey(c);
                      const isSel = selectedKeys.has(k);
                      const isDis = !isSel && (disabledKeys.has(k) || cards.length >= max);
                      return (
                        <button
                          key={k}
                          disabled={isDis}
                          onClick={() => toggle(c)}
                          className={cn(
                            "flex-1 rounded py-1.5 text-sm font-bold transition",
                            isSel
                              ? "bg-primary text-primary-foreground"
                              : isDis
                                ? "cursor-not-allowed bg-muted/40 text-muted-foreground/40"
                                : "bg-secondary hover:bg-primary/30",
                            !isSel && !isDis && suitColor(s)
                          )}
                        >
                          {RANK_LABEL[r]}
                          <span className="ml-0.5 opacity-70">{SUIT_SYMBOL[s]}</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
              <Button onClick={() => setOpen(false)} className="w-full">Done</Button>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
