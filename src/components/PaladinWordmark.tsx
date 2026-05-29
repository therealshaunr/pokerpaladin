import { cn } from "@/lib/utils";

/**
 * Brand wordmark — POKER PALADIN text layered over a faint mystic staff SVG
 * with a soft gold/violet glow. Used in app headers, portal, and SiteNav.
 */
export function PaladinWordmark({
  size = "md",
  className,
  subtitle,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
  subtitle?: string;
}) {
  const text =
    size === "lg"
      ? "text-4xl md:text-5xl"
      : size === "md"
      ? "text-2xl md:text-3xl"
      : "text-lg md:text-xl";

  const box =
    size === "lg" ? "h-20 md:h-24" : size === "md" ? "h-14 md:h-16" : "h-10";

  return (
    <div className={cn("relative inline-flex flex-col items-center justify-center", box, className)}>
      {/* Mystic staff backdrop — faint, glowing */}
      <svg
        viewBox="0 0 200 80"
        aria-hidden
        className="absolute inset-0 h-full w-full opacity-40"
      >
        <defs>
          <radialGradient id="pw-glow" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="oklch(0.78 0.18 90)" stopOpacity="0.45" />
            <stop offset="55%" stopColor="oklch(0.55 0.22 295)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <linearGradient id="pw-staff" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.78 0.18 90)" stopOpacity="0.9" />
            <stop offset="50%" stopColor="oklch(0.55 0.22 295)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="oklch(0.78 0.18 90)" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <rect width="200" height="80" fill="url(#pw-glow)" />
        {/* Vertical staff */}
        <line x1="100" y1="6" x2="100" y2="74" stroke="url(#pw-staff)" strokeWidth="1.2" />
        {/* Staff orb */}
        <circle cx="100" cy="10" r="3.5" fill="oklch(0.78 0.18 90)" opacity="0.85" />
        <circle cx="100" cy="10" r="6" fill="none" stroke="oklch(0.78 0.18 90)" strokeWidth="0.5" opacity="0.5" />
        {/* Staff foot */}
        <circle cx="100" cy="74" r="2" fill="oklch(0.55 0.22 295)" opacity="0.8" />
        {/* Faint sigils */}
        <text x="100" y="44" textAnchor="middle" fontFamily="monospace" fontSize="6" fill="oklch(0.78 0.18 90)" opacity="0.25" letterSpacing="2">
          ✦
        </text>
      </svg>

      {/* Wordmark text */}
      <h1
        className={cn(
          "relative font-display font-black uppercase tracking-wider leading-none",
          text
        )}
      >
        <span>POKER</span>
        <span className="text-gold drop-shadow-[0_0_8px_oklch(0.78_0.18_90/0.6)]"> PALADIN</span>
      </h1>
      {subtitle && (
        <p className="relative mt-1 font-data text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
          {subtitle}
        </p>
      )}
    </div>
  );
}
