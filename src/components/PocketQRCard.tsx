import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Smartphone, X, ExternalLink } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

interface Props {
  url: string;
  label?: string;
  size?: number;
}

export function PocketQR({ url, size = 180 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!canvasRef.current || !url) return;
    QRCode.toCanvas(canvasRef.current, url, {
      width: size,
      margin: 1,
      color: { dark: "#c9a84c", light: "#0a0a0a" },
      errorCorrectionLevel: "M",
    }).catch(() => {});
  }, [url, size]);
  return <canvas ref={canvasRef} className="rounded-lg border border-gold/40 bg-black" />;
}

export function PocketPairModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);
  if (!open) return null;
  const pocketUrl = origin ? `${origin}/pocket` : "";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-gold/50 bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-gold" />
            <div className="font-display text-xl font-black uppercase tracking-wide">Pair your phone</div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Scan with your phone camera. It opens <span className="font-data text-gold">Paladin Pocket</span> — a glance-only mirror of every verdict the Paladin produces on this device.
        </p>
        <div className="mt-5 flex justify-center">
          {pocketUrl ? <PocketQR url={pocketUrl} size={220} /> : <div className="h-[220px] w-[220px] animate-pulse rounded-lg bg-secondary" />}
        </div>
        <div className="mt-3 text-center font-data text-[11px] text-muted-foreground break-all">{pocketUrl}</div>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Link to="/pocket/install"><Button variant="secondary" size="sm" className="w-full gap-1"><ExternalLink className="h-3 w-3" /> Install guide</Button></Link>
          <Button size="sm" onClick={onClose}>Done</Button>
        </div>
        <p className="mt-3 text-[10px] italic text-muted-foreground text-center">
          Sign in once on the phone with the same email — the Pocket auto-tunes to your live session.
        </p>
      </div>
    </div>
  );
}
