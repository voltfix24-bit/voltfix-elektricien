import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, Phone, X, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { business, navLinks, telHref } from "@/lib/business";

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-2" aria-label="VoltFix home">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Zap className="h-5 w-5" />
          </span>
          <span className="font-display text-xl font-bold tracking-tight">
            Volt<span className="text-primary">Fix</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Hoofdmenu">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-primary" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={telHref}
            className="gtm-cta-call hidden items-center gap-2 rounded-md bg-primary px-3.5 py-2 text-sm font-bold text-primary-foreground shadow-[var(--shadow-gold)] transition-transform hover:-translate-y-0.5 sm:flex"
            data-gtm="cta-call"
            data-gtm-location="header"
          >
            <Phone className="h-4 w-4" />
            <span className="whitespace-nowrap">{business.phoneDisplay}</span>
          </a>
          <Button asChild variant="outlineLight" size="sm" className="hidden sm:inline-flex">
            <Link to="/contact" className="gtm-cta-quote" data-gtm="cta-quote" data-gtm-location="header">
              Offerte
            </Link>
          </Button>

          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Menu sluiten" : "Menu openen"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          className="border-t border-border bg-background lg:hidden"
          aria-label="Mobiel menu"
        >
          <div className="mx-auto flex max-w-6xl flex-col px-4 py-2">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-3 text-base font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                activeProps={{ className: "text-primary" }}
                activeOptions={{ exact: l.to === "/" }}
              >
                {l.label}
              </Link>
            ))}
            <a
              href={telHref}
              className="gtm-cta-call mt-2 flex items-center gap-2 rounded-md bg-primary px-3 py-3 text-base font-bold text-primary-foreground"
              data-gtm="cta-call"
              data-gtm-location="header-mobile"
            >
              <Phone className="h-4 w-4" /> {business.phoneDisplay}
            </a>

          </div>
        </nav>
      )}
    </header>
  );
}
