export function EducationalDisclaimer({ className = "" }: { className?: string }) {
  return (
    <p className={`text-center font-data text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70 ${className}`}>
      Educational training tool · Use only where permitted by the venue / operator
    </p>
  );
}
