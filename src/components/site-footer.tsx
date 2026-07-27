import { Link } from "@tanstack/react-router";
import { Instagram, Linkedin, Mail, MapPin, Phone, Zap } from "lucide-react";

import { CertificationFooterMark } from "@/components/certifications";

import { useTrackConversion, useTrackSocialClick } from "@/lib/analytics";
import { business, instagramHref, linkedinHref, mailHref, serviceAreas, telHref } from "@/lib/business";
import { navEn, navNl, useLocale, usePathname, useT } from "@/lib/i18n";

const socialLinks = [
  { href: instagramHref, label: "Instagram", icon: Instagram, network: "instagram" as const },
  { href: linkedinHref, label: "LinkedIn", icon: Linkedin, network: "linkedin" as const },
];

export function SiteFooter() {
  const locale = useLocale();
  const pagePath = usePathname();
  const t = useT();
  const track = useTrackConversion();
  const trackSocial = useTrackSocialClick();
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
          <div className="mt-4 flex items-center gap-3">
            {socialLinks.map((s) => (
              <a
                key={s.label}
                href={s.href({ pagePath, location: "footer", language: locale })}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`VoltFix op ${s.label}`}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white hover:text-primary-hover"
                data-gtm="cta-social"
                data-gtm-event="social_click"
                data-gtm-location="footer"
                data-gtm-network={s.network}
                data-gtm-page={pagePath}
                data-gtm-language={locale}
                onClick={() => trackSocial(s.network, "footer")}
              >
                <s.icon className="h-4 w-4" />
              </a>
            ))}
          </div>
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
              <a
                href={telHref}
                className="flex items-center gap-2 text-white hover:text-white/80 gtm-cta-call"
                data-gtm="cta-call"
                data-gtm-location="footer"
                onClick={() => track("call", "footer")}
              >
                <Phone className="h-4 w-4 text-white" /> {business.phoneDisplay}
              </a>
            </li>
            <li>
              <a href={mailHref} className="flex items-center gap-2 text-white hover:text-white/80">
                <Mail className="h-4 w-4 text-white" /> {business.email}
              </a>
            </li>
            <li>
              <a
                href={business.hasMap}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 text-white/75 transition-colors hover:text-white"
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-white" />
                <span>
                  <span className="block font-medium text-white">{t.footerAddress}</span>
                  {business.streetAddress}
                  <br />
                  {business.postalCode} {business.city}
                </span>
              </a>
            </li>
          </ul>
        </div>
      </div>

      <CertificationFooterMark />

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
