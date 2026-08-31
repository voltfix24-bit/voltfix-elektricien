import { Link } from "@tanstack/react-router";
import { Instagram, Linkedin, Mail, MapPin, Phone } from "lucide-react";
import logoInvers from "@/assets/logos/voltfix-logo-invers.svg";

import { CertificationFooterMark } from "@/components/certifications";

import { useTrackConsent, useTrackConversion, useTrackSocialClick } from "@/lib/analytics";
import { business, instagramHref, linkedinHref, mailHref, serviceAreas, telHref } from "@/lib/business";
import { EN_SLUG_OVERRIDES, useLocale, usePathname, useT } from "@/lib/i18n";
import { locations } from "@/data/locations";

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
  const trackC = useTrackConsent();
  // Volledige dienstenlijst in de footer (breder dan de header-navigatie),
  // zodat ook laadpaal- en keuringspagina's sitewide intern gelinkt zijn.
  const services =
    locale === "en"
      ? [
          { to: "/en-gb/spoed-elektricien-amsterdam", label: "Emergency electrician" },
          { to: "/en-gb/groepenkast-amsterdam", label: "Fuse box replacement" },
          { to: "/en-gb/perilex-amsterdam", label: "Perilex socket" },
          { to: "/en-gb/stroomstoring-amsterdam", label: "Power outage" },
          { to: "/en-gb/ev-charger-installation-amsterdam", label: "EV charger installation" },
          { to: "/en-gb/elektricien-amsterdam", label: "Hire an electrician" },
        ]
      : [
          { to: "/spoed-elektricien-amsterdam", label: "Spoed elektricien" },
          { to: "/groepenkast-amsterdam", label: "Groepenkast vervangen" },
          { to: "/3-fase-aansluiting-amsterdam", label: "3-fase aansluiting" },
          { to: "/perilex-amsterdam", label: "Perilex aansluiten" },
          { to: "/stroomstoring-amsterdam", label: "Stroomstoring" },
          { to: "/laadpaal-amsterdam", label: "Laadpaal installeren" },
          { to: "/elektricien-amsterdam", label: "Elektricien inhuren" },
        ];

  // Uitleg-/kennispagina's krijgen sitewide een interne link.
  const guides =
    locale === "en"
      ? [
          { to: "/en-gb/how-to-assemble-a-fuse-box", label: "How to assemble a fuse box" },
          { to: "/en-gb/faq", label: "Frequently asked questions" },
        ]
      : [
          { to: "/perilex-stekker", label: "Perilex stekker uitgelegd" },
          { to: "/groepenkast-samenstellen", label: "Groepenkast samenstellen" },
          { to: "/veelgestelde-vragen", label: "Veelgestelde vragen" },
        ];

  // Werkgebieden: wijken met een eigen locatiepagina worden echte interne
  // links (versterkt de locatiesilo); overige gebieden blijven tekstlabels.
  const areaEntries: { label: string; to?: string }[] = [
    ...locations.map((l) => {
      const to = locale === "en" ? EN_SLUG_OVERRIDES[l.path] : l.path;
      return { label: l.name, to };
    }),
    ...serviceAreas
      .filter((a) => !locations.some((l) => l.name.toLowerCase() === a.replace("-", " ").toLowerCase()))
      .slice(0, 4)
      .map((a) => ({ label: a })),
  ];

  return (
    <footer className="bg-primary-hover text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center">
            <img src={logoInvers} loading="lazy" decoding="async" alt="VoltFix Elektricien Amsterdam logo" className="h-10 w-auto" width={179} height={80} />
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

          <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-white">
            {locale === "en" ? "Guides" : "Uitleg"}
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            {guides.map((g) => (
              <li key={g.to}>
                <Link to={g.to} className="text-white/75 transition-colors hover:text-white">
                  {g.label}
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
            {areaEntries.map((a) => (
              <li key={a.label}>
                {a.to ? (
                  <Link
                    to={a.to}
                    className="text-white/80 underline-offset-4 transition-colors hover:text-white hover:underline"
                  >
                    {a.label}
                  </Link>
                ) : (
                  a.label
                )}
              </li>
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
                  <span className="block font-medium text-white">
                    {locale === "en" ? "Amsterdam visiting location" : "Bezoeklocatie Amsterdam"}
                  </span>
                  {business.streetAddress}
                  <br />
                  {business.postalCode} {business.city}
                  <br />
                  <span className="text-white/60">
                    {locale === "en" ? "By appointment only" : "Alleen op afspraak"}
                  </span>
                </span>
              </a>
            </li>

          </ul>
        </div>
      </div>

      <CertificationFooterMark />

      <div className="border-t border-white/15">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-5 text-xs text-white/70 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1 leading-relaxed">
            <p>© {new Date().getFullYear()} VoltFix</p>
            {locale === "en" ? (
              <>
                <p>VoltFix is a trade name of {business.legalName}.</p>
                <p>Chamber of Commerce {business.kvk} · VAT {business.btw}</p>
                <p>
                  Amsterdam visiting location: {business.streetAddress},{" "}
                  {business.postalCode} — by appointment only
                </p>
              </>
            ) : (
              <>
                <p>VoltFix is een handelsnaam van {business.legalName}.</p>
                <p>KvK {business.kvk} · BTW {business.btw}</p>
                <p>
                  Bezoeklocatie Amsterdam: {business.streetAddress},{" "}
                  {business.postalCode} — alleen op afspraak
                </p>
              </>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Link
              to={locale === "en" ? "/en-gb/privacy-policy" : "/privacybeleid"}
              className="text-white/80 underline-offset-4 hover:text-white hover:underline"
            >
              {locale === "en" ? "Privacy policy" : "Privacybeleid"}
            </Link>
            <span aria-hidden="true">·</span>
            <Link
              to={locale === "en" ? "/en-gb/faq" : "/veelgestelde-vragen"}
              className="text-white/80 underline-offset-4 hover:text-white hover:underline"
            >
              {locale === "en" ? "FAQ" : "Veelgestelde vragen"}
            </Link>
            <span aria-hidden="true">·</span>
            <Link
              to={locale === "en" ? "/en-gb/cookie-policy" : "/cookiebeleid"}
              className="text-white/80 underline-offset-4 hover:text-white hover:underline"
            >
              {locale === "en" ? "Cookie policy" : "Cookiebeleid"}
            </Link>
            <span aria-hidden="true">·</span>
            <Link
              to={locale === "en" ? "/en-gb/cookie-policy" : "/cookiebeleid"}
              hash="instellingen"
              className="text-white/80 underline-offset-4 hover:text-white hover:underline"
              data-conversion="consent"
              data-consent-action="open-settings"
              onClick={() => {
                trackC("open_settings", "footer");
                // If already on the cookie policy page, opening won't retrigger
                // the route effect — dispatch immediately so the banner opens.
                void import("@/lib/consent").then((m) => m.openConsentPreferences());
              }}
            >
              {locale === "en" ? "Cookie settings" : "Cookie-instellingen"}
            </Link>
            <span aria-hidden="true">·</span>
            <span>{t.footerStandard}</span>
          </div>
        </div>
      </div>

    </footer>
  );
}
