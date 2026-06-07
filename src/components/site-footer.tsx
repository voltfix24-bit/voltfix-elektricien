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
    <footer className="bg-primary-hover text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-primary">
              <Zap className="h-4 w-4" />
            </span>
            <span className="font-display text-lg font-bold text-white">VoltFix</span>
          </div>
          <p className="mt-4 text-sm text-white/75">
            Uw lokale elektricien in Amsterdam. Snel ter plaatse bij storingen,
            vakkundig bij installaties en altijd transparant over de prijs.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-white">
            Diensten
          </h3>
          <ul className="mt-4 space-y-2 text-sm">
            {navLinks
              .filter((l) => l.to !== "/" && l.to !== "/over-ons" && l.to !== "/contact")
              .map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-white/75 transition-colors hover:text-white"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-white">
            Werkgebied
          </h3>
          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-white/75">
            {serviceAreas.slice(0, 8).map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-white">
            Contact
          </h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <a href={telHref} className="flex items-center gap-2 text-white hover:text-white/80">
                <Phone className="h-4 w-4 text-white" /> {business.phoneDisplay}
              </a>
            </li>
            <li>
              <a href={mailHref} className="flex items-center gap-2 text-white hover:text-white/80">
                <Mail className="h-4 w-4 text-white" /> {business.email}
              </a>
            </li>
            <li className="flex items-center gap-2 text-white/75">
              <MapPin className="h-4 w-4 text-white" /> Amsterdam &amp; omgeving
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/15">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-white/70 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} VoltFix Elektrotechniek — Amsterdam</p>
          <p>
            KvK: {business.kvk || "—"} · BTW: {business.btw || "—"} · Werkt volgens NEN 1010
          </p>
        </div>
      </div>
    </footer>
  );
}
