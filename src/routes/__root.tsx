import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  isRedirect,
} from "@tanstack/react-router";
import { PaladinBot } from "@/components/PaladinBot";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();

  // If TanStack threw a redirect (e.g. an auth-gated route bouncing to /login),
  // honor it instead of rendering a hard error screen.
  useEffect(() => {
    if (isRedirect(error)) {
      router.navigate(error.options as never);
    }
  }, [error, router]);

  if (isRedirect(error)) return null;

  console.error(error);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Poker Paladin — Real-time poker co-pilot that reads your screen" },
      { name: "description", content: "Poker Paladin tracks every card, bet, and tell on your screen in near real-time and tells you exactly what to do. Standard + Pro tiers, Go-Live analyzer, no extensions installed." },
      { name: "author", content: "Poker Paladin" },
      { property: "og:title", content: "Poker Paladin — Real-time poker co-pilot" },
      { property: "og:description", content: "Reads your poker screen, runs the math, tells you fold/call/raise before your timer ticks. Standard + Pro tiers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Poker Paladin — Real-time poker co-pilot" },
      { name: "twitter:description", content: "Reads your poker screen, runs the math, tells you fold/call/raise before your timer ticks." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/36138f42-3d2e-4ce9-a539-36e88734a12e/id-preview-868c4fa7--cc317c83-dc32-4b14-bfa8-adbc912720e9.lovable.app-1780002813699.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/36138f42-3d2e-4ce9-a539-36e88734a12e/id-preview-868c4fa7--cc317c83-dc32-4b14-bfa8-adbc912720e9.lovable.app-1780002813699.png" },
    ],

    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", href: "/paladin-icon-512.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/paladin-icon-512.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" },
    ],

  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const path = router.state.location.pathname;
  const hideBot = path.startsWith("/pocket"); // keep the mobile mirror clean

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <Outlet />
          {!hideBot && <PaladinBot />}
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
