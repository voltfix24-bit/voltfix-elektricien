import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Globe, Menu, Phone, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { business, telHref } from "@/lib/business";
import { LANG_STORAGE_KEY, navEn, navNl, otherLangPath, useLocale, usePathname, useT } from "@/lib/i18n";
import { useTrackConversion } from "@/lib/analytics";
import logoPrimair from "@/assets/logos/voltfix-logo-primair.svg";
import logoInvers from "@/assets/logos/voltfix-logo-invers.svg";

// Pages that render the header on a light surface (redesigned service pages).
const LIGHT_HEADER_PATHS = new Set<string>(["/groepenkast-amsterdam"]);

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const locale = useLocale();
  const t = useT();
  const pathname = usePathname();
  const track = useTrackConversion();
  const nav = locale === "en" ? navEn : navNl;
  const switchTo = otherLangPath(pathname);
  const nextLocale: "nl" | "en" = locale === "en" ? "nl" : "en";
  const rememberLang = () => {
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, nextLocale);
    } catch {
      // ignore storage access errors
    }
  };
  const isLight = LIGHT_HEADER_PATHS.has(pathname);

  const headerCls = isLight
    ? "sticky top-0 z-50 bg-background/95 text-foreground shadow-[0_1px_0_0_color-mix(in_oklab,var(--iris-deep)_10%,transparent)] backdrop-blur"
    : "sticky top-0 z-50 bg-primary text-primary-foreground shadow-[0_2px_18px_-6px_color-mix(in_oklab,var(--primary)_60%,transparent)]";

  const navLinkCls = isLight
    ? "rounded-md px-2 py-2 text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
    : "rounded-md px-2 py-2 text-sm font-medium text-white transition-colors hover:text-butter";
  const activeNavCls = isLight
    ? "text-primary [text-decoration:underline] [text-decoration-color:var(--iris-deep)] [text-decoration-thickness:2px] [text-underline-offset:6px]"
    : "text-butter";
  const langBtnCls = isLight
    ? "inline-flex items-center gap-1.5 rounded-md border border-foreground/20 px-2.5 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-foreground/5"
    : "inline-flex items-center gap-1.5 rounded-md border border-white/40 px-2.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10";
  const mobileBtnCls = isLight
    ? "inline-flex h-10 w-10 items-center justify-center rounded-md border border-foreground/20 text-foreground lg:hidden"
    : "inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/40 text-white lg:hidden";

  const logoSrc = isLight ? logoPrimair : logoInvers;

  return (
    <header className={headerCls}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to={t.homeTo} className="flex items-center" aria-label="VoltFix home">
          <img
            src={logoSrc}
            loading="eager"
            decoding="async"
            alt="VoltFix Elektricien Amsterdam logo"
            className="h-9 w-auto sm:h-10"
            width={179}
            height={80}

          />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label={t.menuLabel}>
          {nav.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`${navLinkCls}${"xlOnly" in l && l.xlOnly ? " hidden xl:inline-flex" : ""}`}
              activeProps={{ className: activeNavCls }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={switchTo}
            className={langBtnCls}
            aria-label={locale === "en" ? "Schakel naar Nederlands" : "Switch to English"}
            onClick={rememberLang}
          >
            <Globe className="h-4 w-4" />
            {t.langSwitchLabel}
          </a>
          <a
            href={telHref}
            className={`gtm-cta-call hidden items-center gap-2 rounded-md px-3.5 py-2 text-sm font-bold shadow-sm transition-transform hover:-translate-y-0.5 sm:flex ${
              isLight ? "bg-primary text-primary-foreground" : "bg-destructive text-destructive-foreground"
            }`}
            data-gtm="cta-call"
            data-gtm-location="header"
            onClick={() => track("call", "header")}
          >
            <Phone className="h-4 w-4" />
            <span className="whitespace-nowrap">{business.phoneDisplay}</span>
          </a>
          <Button
            asChild
            variant="outlineBrand"
            size="sm"
            className={
              isLight
                ? "hidden bg-butter text-foreground border-butter hover:bg-butter/90 hover:text-foreground sm:inline-flex"
                : "hidden bg-white text-primary border-white hover:bg-white/90 hover:text-primary sm:inline-flex"
            }
          >
            <a href={`${t.contactTo}#offerte`} className="gtm-cta-quote" data-gtm="cta-quote" data-gtm-location="header" onClick={() => track("quote", "header")}>
              {t.quote}
            </a>
          </Button>

          <button
            className={mobileBtnCls}
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
          className={
            isLight
              ? "border-t border-foreground/10 bg-background lg:hidden"
              : "border-t border-white/15 bg-primary-hover lg:hidden"
          }
          aria-label={t.menuLabel}
        >
          <div className="mx-auto flex max-w-6xl flex-col px-4 py-2">
            {nav.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={
                  isLight
                    ? "rounded-md px-3 py-3 text-base font-medium text-foreground/85 hover:bg-foreground/5 hover:text-primary"
                    : "rounded-md px-3 py-3 text-base font-medium text-white/85 hover:bg-white/10 hover:text-white"
                }
                activeProps={{ className: isLight ? "text-primary" : "text-white" }}
              >
                {l.label}
              </Link>
            ))}
            <a
              href={switchTo}
              className={
                isLight
                  ? "flex items-center gap-2 rounded-md px-3 py-3 text-base font-medium text-foreground/85 hover:bg-foreground/5 hover:text-primary"
                  : "flex items-center gap-2 rounded-md px-3 py-3 text-base font-medium text-white/85 hover:bg-white/10 hover:text-white"
              }
              onClick={rememberLang}
            >
              <Globe className="h-4 w-4" />
              {locale === "en" ? "Nederlands" : "English"}
            </a>
            <a
              href={telHref}
              className={`gtm-cta-call mt-2 flex items-center gap-2 rounded-md px-3 py-3 text-base font-bold ${
                isLight
                  ? "bg-primary text-primary-foreground"
                  : "bg-destructive text-destructive-foreground"
              }`}
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
