import { cn } from "@/lib/utils";
import { Plus, X, Lock, Radio } from "lucide-react";
import type { TableMeta } from "@/components/poker/MultiTableHost";

interface Props {
  tables: TableMeta[];
  activeId: string;
  canAdd: boolean;
  isPro: boolean;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onClose: (id: string) => void;
  onRename: (id: string, label: string) => void;
  onUpgrade: () => void;
}

export function TableTabs({ tables, activeId, canAdd, isPro, onSelect, onAdd, onClose, onRename, onUpgrade }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card/60 p-2">
      {tables.map((t) => {
        const active = t.id === activeId;
        return (
          <div
            key={t.id}
            className={cn(
              "group flex items-center gap-2 rounded-lg border px-3 py-1.5 transition cursor-pointer",
              active ? "border-wizard bg-wizard/15 text-foreground" : "border-border bg-secondary/40 hover:border-wizard/40"
            )}
            onClick={() => onSelect(t.id)}
          >
            {t.live && <span className="h-2 w-2 rounded-full bg-matrix animate-pulse" aria-label="live" />}
            <input
              value={t.label}
              onChange={(e) => onRename(t.id, e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="w-24 bg-transparent text-sm font-bold focus:outline-none"
            />
            <span className="font-data text-[10px] uppercase tracking-wider text-muted-foreground">
              pot {t.pot.toLocaleString()}
            </span>
            {tables.length > 1 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onClose(t.id); }}
                className="ml-1 rounded p-0.5 text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
                aria-label="Close table"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        );
      })}

      {isPro ? (
        <button
          type="button"
          disabled={!canAdd}
          onClick={onAdd}
          className={cn(
            "flex items-center gap-1 rounded-lg border-2 border-dashed px-3 py-1.5 text-sm font-bold transition",
            canAdd ? "border-wizard/50 text-wizard hover:bg-wizard/10" : "border-border text-muted-foreground cursor-not-allowed"
          )}
        >
          <Plus className="h-3.5 w-3.5" /> Add table
        </button>
      ) : (
        <button
          type="button"
          onClick={onUpgrade}
          className="flex items-center gap-1 rounded-lg border-2 border-dashed border-wizard/40 bg-wizard/5 px-3 py-1.5 text-sm font-bold text-wizard hover:bg-wizard/10"
        >
          <Lock className="h-3.5 w-3.5" /> Multi-Table · Pro
        </button>
      )}

      <div className="ml-auto hidden items-center gap-1 font-data text-[10px] uppercase tracking-wider text-muted-foreground sm:flex">
        <Radio className="h-3 w-3" /> {tables.filter((t) => t.live).length} live · {tables.length}/4
      </div>
    </div>
  );
}
