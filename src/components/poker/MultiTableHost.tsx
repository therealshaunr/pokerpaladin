import { useCallback, useEffect, useMemo, useState } from "react";
import { TableTabs } from "./TableTabs";
import { TableInstance } from "./TableInstance";
import { UpgradeToProDialog } from "@/components/UpgradeToProDialog";
import type { Tier } from "@/lib/useTier";

export interface TableMeta {
  id: string;
  label: string;
  pot: number;
  live: boolean;
}

interface Slot { id: string; label: string }

const KEY = "paladin.tables.v1";

function uid() { return Math.random().toString(36).slice(2, 9); }

export function MultiTableHost({ tier }: { tier: Tier }) {
  const isPro = tier === "pro";
  const [slots, setSlots] = useState<Slot[]>(() => {
    if (typeof window === "undefined") return [{ id: uid(), label: "Table 1" }];
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const arr = JSON.parse(raw) as Slot[];
        if (Array.isArray(arr) && arr.length) return arr;
      }
    } catch { /* noop */ }
    return [{ id: uid(), label: "Table 1" }];
  });
  const [activeId, setActiveId] = useState<string>(() => "");
  const [metas, setMetas] = useState<Record<string, { pot: number; live: boolean }>>({});
  const [upgrade, setUpgrade] = useState(false);

  useEffect(() => {
    if (!activeId && slots.length) setActiveId(slots[0].id);
  }, [activeId, slots]);

  useEffect(() => {
    try { window.localStorage.setItem(KEY, JSON.stringify(slots)); } catch { /* noop */ }
  }, [slots]);

  // Standard tier: force single table
  useEffect(() => {
    if (!isPro && slots.length > 1) setSlots((s) => [s[0]]);
  }, [isPro, slots.length]);

  const onMeta = useCallback((id: string, pot: number, live: boolean) => {
    setMetas((m) => {
      const cur = m[id];
      if (cur && cur.pot === pot && cur.live === live) return m;
      return { ...m, [id]: { pot, live } };
    });
  }, []);

  const tables: TableMeta[] = useMemo(
    () => slots.map((s) => ({ id: s.id, label: s.label, pot: metas[s.id]?.pot ?? 0, live: metas[s.id]?.live ?? false })),
    [slots, metas]
  );

  const addTable = () => {
    if (!isPro || slots.length >= 4) { setUpgrade(!isPro); return; }
    const id = uid();
    const label = `Table ${slots.length + 1}`;
    setSlots((s) => [...s, { id, label }]);
    setActiveId(id);
  };
  const closeTable = (id: string) => {
    setSlots((s) => {
      const next = s.filter((x) => x.id !== id);
      return next.length ? next : [{ id: uid(), label: "Table 1" }];
    });
    setMetas((m) => { const n = { ...m }; delete n[id]; return n; });
    if (activeId === id) setActiveId(slots.find((x) => x.id !== id)?.id ?? "");
  };
  const renameTable = (id: string, label: string) => {
    setSlots((s) => s.map((x) => x.id === id ? { ...x, label } : x));
  };

  return (
    <div className="space-y-4">
      <TableTabs
        tables={tables}
        activeId={activeId}
        canAdd={isPro && slots.length < 4}
        isPro={isPro}
        onSelect={setActiveId}
        onAdd={addTable}
        onClose={closeTable}
        onRename={renameTable}
        onUpgrade={() => setUpgrade(true)}
      />

      {slots.map((s) => (
        <div key={s.id} className={s.id === activeId ? "" : "hidden"}>
          <TableInstance
            slotId={s.id}
            tier={tier}
            isActive={s.id === activeId}
            onMeta={(pot, live) => onMeta(s.id, pot, live)}
          />
        </div>
      ))}

      <UpgradeToProDialog open={upgrade} onOpenChange={setUpgrade} feature="Multi-Table Mode" />
    </div>
  );
}
