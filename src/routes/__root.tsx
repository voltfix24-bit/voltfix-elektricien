import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MobileCtaBar } from "@/components/mobile-cta-bar";
import { GtmNoScript } from "@/components/gtm-noscript";
import { Toaster } from "@/components/ui/sonner";
import { localBusinessSchema, ldScript, ogImage } from "@/lib/seo";
import { LANG_STORAGE_KEY, otherLangPath, useLocale, usePathname } from "@/lib/i18n";
import { getAnalyticsHeadScripts } from "@/lib/analytics";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Pagina niet gevonden</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Deze pagina bestaat niet of is verplaatst.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Naar de homepage
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Deze pagina laadde niet
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Er ging iets mis. Probeer te verversen of ga terug naar de homepage.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Opnieuw proberen
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Naar home
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
      { title: "Elektricien Amsterdam | VoltFix" },
      {
        name: "description",
        content:
          "Elektricien in Amsterdam nodig? VoltFix is snel, lokaal en 24/7 bereikbaar voor spoed, groepenkast en perilex. Bel direct voor een vaste prijs.",
      },
      { name: "author", content: "VoltFix" },
      { property: "og:title", content: "Elektricien Amsterdam | VoltFix" },
      {
        property: "og:description",
        content:
          "Elektricien in Amsterdam nodig? VoltFix is snel, lokaal en 24/7 bereikbaar voor spoed, groepenkast en perilex. Bel direct voor een vaste prijs.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "VoltFix" },
      { property: "og:locale", content: "nl_NL" },
      { property: "og:locale:alternate", content: "en_GB" },
      { property: "og:image", content: ogImage },
      { property: "og:image:width", content: "1536" },
      { property: "og:image:height", content: "1024" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Elektricien Amsterdam | VoltFix" },
      {
        name: "twitter:description",
        content:
          "Elektricien in Amsterdam nodig? VoltFix is snel, lokaal en 24/7 bereikbaar voor spoed, groepenkast en perilex. Bel direct voor een vaste prijs.",
      },
      { name: "twitter:image", content: ogImage },
      { name: "theme-color", content: "#3A0CA3" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap",
      },

    ],
    scripts: [ldScript(localBusinessSchema()), ...getAnalyticsHeadScripts()],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const lang = pathname === "/en-gb" || pathname.startsWith("/en-gb/") ? "en-GB" : "nl";
  return (
    <html lang={lang}>
      <head>
        <HeadContent />
      </head>
      <body>
        <GtmNoScript />
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const locale = useLocale();
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.lang = locale === "en" ? "en-GB" : "nl";
  }, [locale]);

  // Restore the visitor's saved language preference on first mount:
  // if the stored locale differs from the current URL, redirect to the
  // equivalent page in the preferred language. Runs once per full page load.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(LANG_STORAGE_KEY);
      if (stored !== "nl" && stored !== "en") return;
      if (stored === locale) return;
      const target = otherLangPath(pathname);
      if (target && target !== pathname) {
        window.location.replace(target);
      }
    } catch {
      // ignore storage access errors (private mode, etc.)
    }
    // Intentionally empty deps — only on initial mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1 pb-16 lg:pb-0">
          {/* Required: nested routes render here. */}
          <Outlet />
        </main>
        <SiteFooter />
      </div>
      <MobileCtaBar />
      <Toaster />
    </QueryClientProvider>
  );
}
