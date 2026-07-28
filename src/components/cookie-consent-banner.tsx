import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ACCEPT_ALL,
  CONSENT_OPEN_EVENT,
  REJECT_ALL,
  readConsent,
  saveConsent,
  type ConsentCategories,
} from "@/lib/consent";
import { useTrackConsent } from "@/lib/analytics";
import { useLocale } from "@/lib/i18n";

type Copy = {
  title: string;
  body: string;
  policyLabel: string;
  policyTo: "/cookiebeleid" | "/en-gb/cookie-policy";
  privacyLabel: string;
  privacyTo: "/privacybeleid" | "/en-gb/privacy-policy";
  acceptAll: string;
  rejectAll: string;
  customize: string;
  save: string;
  necessary: string;
  necessaryDesc: string;
  preferences: string;
  preferencesDesc: string;
  statistics: string;
  statisticsDesc: string;
  marketing: string;
  marketingDesc: string;
  alwaysOn: string;
};

const NL: Copy = {
  title: "Cookies op VoltFix",
  body:
    "We gebruiken noodzakelijke cookies om de website te laten werken. Met jouw toestemming plaatsen we ook voorkeuren-, statistieken- en marketingcookies. Je keuze kun je altijd aanpassen via 'Cookie-instellingen' onderaan de pagina.",
  policyLabel: "cookiebeleid",
  policyTo: "/cookiebeleid",
  privacyLabel: "privacybeleid",
  privacyTo: "/privacybeleid",
  acceptAll: "Alles accepteren",
  rejectAll: "Alleen noodzakelijk",
  customize: "Instellingen",
  save: "Voorkeuren opslaan",
  necessary: "Noodzakelijk",
  necessaryDesc: "Nodig voor de basiswerking van de website (beveiliging, sessie, formulieren).",
  preferences: "Voorkeuren",
  preferencesDesc:
    "Onthoudt keuzes zoals taal (NL/EN) en jouw wijk zodat de site persoonlijker aanvoelt.",
  statistics: "Statistieken",
  statisticsDesc:
    "Google Analytics 4 — geanonimiseerd meten hoe bezoekers de site gebruiken zodat we hem kunnen verbeteren.",
  marketing: "Marketing",
  marketingDesc:
    "Google Ads — conversiemeting en remarketing zodat advertenties relevanter zijn.",
  alwaysOn: "Altijd aan",
};

const EN: Copy = {
  title: "Cookies on VoltFix",
  body:
    "We use necessary cookies to make the site work. With your consent we also use preferences, statistics and marketing cookies. You can change your choice at any time via 'Cookie settings' in the footer.",
  policyLabel: "cookie policy",
  policyTo: "/en-gb/cookie-policy",
  privacyLabel: "privacy policy",
  privacyTo: "/en-gb/privacy-policy",
  acceptAll: "Accept all",
  rejectAll: "Only necessary",
  customize: "Settings",
  save: "Save preferences",
  necessary: "Necessary",
  necessaryDesc: "Required for basic operation of the website (security, session, forms).",
  preferences: "Preferences",
  preferencesDesc:
    "Remembers choices such as language (NL/EN) and your area so the site feels more personal.",
  statistics: "Statistics",
  statisticsDesc:
    "Google Analytics 4 — anonymously measuring how visitors use the site so we can improve it.",
  marketing: "Marketing",
  marketingDesc:
    "Google Ads — conversion measurement and remarketing to keep ads relevant.",
  alwaysOn: "Always on",
};

export function CookieConsentBanner() {
  const locale = useLocale();
  const t = locale === "en" ? EN : NL;
  const trackC = useTrackConsent();

  const [open, setOpen] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [choice, setChoice] = useState<ConsentCategories>(REJECT_ALL);

  useEffect(() => {
    const hydrate = (): ConsentCategories | null => {
      const s = readConsent();
      if (!s) return null;
      return {
        analytics_storage: s.analytics_storage,
        ad_storage: s.ad_storage,
        ad_user_data: s.ad_user_data,
        ad_personalization: s.ad_personalization,
        personalization_storage: s.personalization_storage,
      };
    };
    // First visit: show banner. Otherwise stay hidden until reopened.
    const stored = hydrate();
    if (!stored) {
      setOpen(true);
      trackC("banner_view", "banner");
    } else {
      setChoice(stored);
    }
    const reopen = () => {
      const s = hydrate();
      if (s) setChoice(s);
      setShowPrefs(true);
      setOpen(true);
    };
    window.addEventListener(CONSENT_OPEN_EVENT, reopen);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, reopen);
  }, [trackC]);

  if (!open) return null;

  const commit = (
    c: ConsentCategories,
    action: "accept_all" | "reject_all" | "save",
  ) => {
    saveConsent(c);
    setChoice(c);
    setOpen(false);
    setShowPrefs(false);
    trackC(action, showPrefs ? "banner_customize" : "banner", c);
  };

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-consent-title"
      className="fixed inset-x-0 bottom-0 z-[60] px-3 pb-3 sm:px-4 sm:pb-4"
    >
      <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-background shadow-2xl">
        <div className="p-5 sm:p-6">
          <h2 id="cookie-consent-title" className="text-base font-semibold text-foreground">
            {t.title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {t.body}{" "}
            <Link
              to={t.policyTo}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {t.policyLabel}
            </Link>{" "}
            ·{" "}
            <Link
              to={t.privacyTo}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {t.privacyLabel}
            </Link>
          </p>

          {showPrefs ? (
            <div className="mt-4 max-h-[55vh] space-y-3 overflow-y-auto pr-1">
              <PrefRow
                title={t.necessary}
                desc={t.necessaryDesc}
                checked
                disabled
                pill={t.alwaysOn}
              />
              <PrefRow
                title={t.preferences}
                desc={t.preferencesDesc}
                checked={choice.personalization_storage === "granted"}
                onChange={(v) =>
                  setChoice((c) => ({
                    ...c,
                    personalization_storage: v ? "granted" : "denied",
                  }))
                }
              />
              <PrefRow
                title={t.statistics}
                desc={t.statisticsDesc}
                checked={choice.analytics_storage === "granted"}
                onChange={(v) =>
                  setChoice((c) => ({ ...c, analytics_storage: v ? "granted" : "denied" }))
                }
              />
              <PrefRow
                title={t.marketing}
                desc={t.marketingDesc}
                checked={choice.ad_storage === "granted"}
                onChange={(v) =>
                  setChoice((c) => ({
                    ...c,
                    ad_storage: v ? "granted" : "denied",
                    ad_user_data: v ? "granted" : "denied",
                    ad_personalization: v ? "granted" : "denied",
                  }))
                }
              />
            </div>
          ) : null}

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
            {!showPrefs && (
              <button
                type="button"
                onClick={() => setShowPrefs(true)}
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                data-conversion="consent"
                data-consent-action="customize"
              >
                {t.customize}
              </button>
            )}
            <button
              type="button"
              onClick={() => commit(REJECT_ALL, "reject_all")}
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              data-conversion="consent"
              data-consent-action="reject_all"
            >
              {t.rejectAll}
            </button>
            {showPrefs ? (
              <button
                type="button"
                onClick={() => commit(choice)}
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                data-conversion="consent"
                data-consent-action="save"
              >
                {t.save}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => commit(ACCEPT_ALL)}
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                data-conversion="consent"
                data-consent-action="accept_all"
              >
                {t.acceptAll}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PrefRow(props: {
  title: string;
  desc: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (v: boolean) => void;
  pill?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-muted/30 p-3">
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 accent-primary"
        checked={props.checked}
        disabled={props.disabled}
        onChange={(e) => props.onChange?.(e.currentTarget.checked)}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{props.title}</span>
          {props.pill ? (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {props.pill}
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{props.desc}</p>
      </div>
    </label>
  );
}
