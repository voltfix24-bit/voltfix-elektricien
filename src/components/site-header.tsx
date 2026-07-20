import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Globe, Menu, Phone, X, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { business, telHref } from "@/lib/business";
import { navEn, navNl, otherLangPath, useLocale, usePathname, useT } from "@/lib/i18n";
import { useTrackConversion } from "@/lib/analytics";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const locale = useLocale();
  const t = useT();
  const pathname = usePathname();
  const track = useTrackConversion();
  const nav = locale === "en" ? navEn : navNl;
  const switchTo = otherLangPath(pathname);

  return (
    <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-[0_2px_18px_-6px_color-mix(in_oklab,var(--primary)_60%,transparent)]">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to={t.homeTo} className="flex items-center gap-2" aria-label="VoltFix home">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-primary">
            <Zap className="h-5 w-5" />
          </span>
          <span className="font-display text-xl font-bold tracking-tight text-white">
            VoltFix
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label={t.menuLabel}>
          {nav.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:text-white"
              activeProps={{ className: "text-white" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={switchTo}
            className="hidden items-center gap-1.5 rounded-md border border-white/40 px-2.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10 sm:inline-flex"
            aria-label={locale === "en" ? "Schakel naar Nederlands" : "Switch to English"}
          >
            <Globe className="h-4 w-4" />
            {t.langSwitchLabel}
          </a>
          <a
            href={telHref}
            className="gtm-cta-call hidden items-center gap-2 rounded-md bg-destructive px-3.5 py-2 text-sm font-bold text-destructive-foreground shadow-sm transition-transform hover:-translate-y-0.5 sm:flex"
            data-gtm="cta-call"
            data-gtm-location="header"
            onClick={() => track("call", "header")}
          >
            <Phone className="h-4 w-4" />
            <span className="whitespace-nowrap">{business.phoneDisplay}</span>
          </a>
          <Button asChild variant="outlineBrand" size="sm" className="hidden bg-white text-primary border-white hover:bg-white/90 hover:text-primary sm:inline-flex">
            <Link to={t.contactTo} className="gtm-cta-quote" data-gtm="cta-quote" data-gtm-location="header" onClick={() => track("quote", "header")}>
              {t.quote}
            </Link>
          </Button>

          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/40 text-white lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? t.closeMenu : t.openMenu}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          className="border-t border-white/15 bg-primary-hover lg:hidden"
          aria-label={t.menuLabel}
        >
          <div className="mx-auto flex max-w-6xl flex-col px-4 py-2">
            {nav.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-3 text-base font-medium text-white/85 hover:bg-white/10 hover:text-white"
                activeProps={{ className: "text-white" }}
              >
                {l.label}
              </Link>
            ))}
            <a
              href={switchTo}
              className="flex items-center gap-2 rounded-md px-3 py-3 text-base font-medium text-white/85 hover:bg-white/10 hover:text-white"
            >
              <Globe className="h-4 w-4" />
              {locale === "en" ? "Nederlands" : "English"}
            </a>
            <a
              href={telHref}
              className="gtm-cta-call mt-2 flex items-center gap-2 rounded-md bg-destructive px-3 py-3 text-base font-bold text-destructive-foreground"
              data-gtm="cta-call"
              data-gtm-location="header-mobile"
              onClick={() => track("call", "header-mobile")}
            >
              <Phone className="h-4 w-4" /> {business.phoneDisplay}
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
