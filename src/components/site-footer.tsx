import { Link } from "@tanstack/react-router";
import { Mail, MapPin, Phone, Zap } from "lucide-react";

import { useTrackConversion } from "@/lib/analytics";
import { business, mailHref, serviceAreas, telHref } from "@/lib/business";
import { navEn, navNl, useLocale, useT } from "@/lib/i18n";

export function SiteFooter() {
  const locale = useLocale();
  const t = useT();
  const track = useTrackConversion();
  const services = (locale === "en" ? navEn : navNl).slice(0, 4);

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
          <p className="mt-4 text-sm text-white/75">{t.footerBlurb}</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-white">
            {t.footerServices}
          </h3>
          <ul className="mt-4 space-y-2 text-sm">
            {services.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="text-white/75 transition-colors hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-white">
            {t.footerArea}
          </h3>
          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-white/75">
            {serviceAreas.slice(0, 8).map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-white">
            {t.footerContact}
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
              <MapPin className="h-4 w-4 text-white" /> {t.footerAreaLabel}
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/15">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-white/70 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {t.footerRights}</p>
          <p>
            KvK: {business.kvk || "—"} · BTW: {business.btw || "—"} · {t.footerStandard}
          </p>
        </div>
      </div>
    </footer>
  );
}
