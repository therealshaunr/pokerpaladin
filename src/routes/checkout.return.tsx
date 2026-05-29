import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/checkout/return")({
  validateSearch: (search: Record<string, unknown>): { session_id?: string } => ({
    session_id: typeof search.session_id === "string" ? search.session_id : undefined,
  }),
  component: CheckoutReturn,
});

function CheckoutReturn() {
  const { session_id } = Route.useSearch();
  return (
    <main className="matrix-bg flex min-h-dvh items-center justify-center px-4">
      <div className="arcane-border max-w-lg p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-gold" />
        <h1 className="mt-4 font-display text-3xl font-black">
          Welcome to <span className="text-wizard">The Arcanum</span>
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Your purchase is complete. We've generated a fresh license key and attached it to your account — head to your
          portal to copy it and launch the Paladin.
        </p>
        {session_id && (
          <p className="mt-2 font-data text-[10px] text-muted-foreground/70">Ref: {session_id.slice(0, 20)}…</p>
        )}
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/portal" className="rounded-md bg-primary px-5 py-2 font-bold text-primary-foreground">
            Go to portal →
          </Link>
          <Link to="/app" className="rounded-md border border-border px-5 py-2 font-bold">
            Launch Paladin
          </Link>
        </div>
      </div>
    </main>
  );
}
