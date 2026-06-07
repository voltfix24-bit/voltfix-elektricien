import { Link } from "@tanstack/react-router";
import { Mail, MapPin, Phone, Zap } from "lucide-react";

import {
  business,
  mailHref,
  navLinks,
  serviceAreas,
  telHref,
} from "@/lib/business";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Zap className="h-4 w-4" />
            </span>
            <span className="font-display text-lg font-bold">
              Volt<span className="text-primary">Fix</span>
            </span>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Uw lokale elektricien in Amsterdam. Snel ter plaatse bij storingen,
            vakkundig bij installaties en altijd transparant over de prijs.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
            Diensten
          </h3>
          <ul className="mt-4 space-y-2 text-sm">
            {navLinks
              .filter((l) => l.to !== "/" && l.to !== "/over-ons" && l.to !== "/contact")
              .map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
            Werkgebied
          </h3>
          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
            {serviceAreas.slice(0, 8).map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
            Contact
          </h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <a href={telHref} className="flex items-center gap-2 text-foreground hover:text-primary">
                <Phone className="h-4 w-4 text-primary" /> {business.phoneDisplay}
              </a>
            </li>
            <li>
              <a href={mailHref} className="flex items-center gap-2 text-foreground hover:text-primary">
                <Mail className="h-4 w-4 text-primary" /> {business.email}
              </a>
            </li>
            <li className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary" /> Amsterdam &amp; omgeving
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} VoltFix Elektrotechniek — Amsterdam</p>
          <p>24/7 bereikbaar voor spoed · Gecertificeerd · Garantie op werk</p>
        </div>
      </div>
    </footer>
  );
}
