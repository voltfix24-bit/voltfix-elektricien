import { useEffect, useRef, useState } from "react";
import { Wrench, ChevronDown, ArrowDown, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PerilexWizard, type WizardLang } from "@/components/perilex-wizard";

const COPY: Record<WizardLang, { title: string; subtitle: string; cta: string; ctaHint: string }> = {
  nl: {
    title: "Stap-voor-stap: zelf je perilex aansluiten",
    subtitle: "Doorloop onze gratis hulp-wizard en check eerst veilig of je het zelf kunt doen.",
    cta: "Zelf je perilex aansluiten?",
    ctaHint: "Open de gratis stap-voor-stap wizard",
  },
  en: {
    title: "Step-by-step: connect your perilex yourself",
    subtitle: "Walk through our free help wizard and first safely check whether you can do it yourself.",
    cta: "Connecting a perilex yourself?",
    ctaHint: "Open the free step-by-step wizard",
  },
};

// Custom event waarmee de CTA bovenin de pagina de wizard opent + erheen scrollt.
const OPEN_EVENT = "voltfix:open-perilex-wizard";

export function openPerilexWizard() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(OPEN_EVENT));
}

// Compacte knop voor bovenin de pagina.
// - Zonder `href`: dispatcht het open-event (legacy: wizard staat op dezelfde pagina).
// - Met `href`: rendert een router-Link naar de aparte wizard-route.
export function PerilexWizardCta({
  lang = "nl",
  href,
}: {
  lang?: WizardLang;
  href?: string;
}) {
  const c = COPY[lang];
  const inner = (
    <>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Wrench className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-foreground">{c.cta}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{c.ctaHint}</span>
      </span>
      {href ? (
        <ArrowRight className="h-5 w-5 shrink-0 text-primary transition-transform group-hover:translate-x-0.5" />
      ) : (
        <ArrowDown className="h-5 w-5 shrink-0 text-primary transition-transform group-hover:translate-y-0.5" />
      )}
    </>
  );
  const cls =
    "not-prose group flex w-full items-center gap-4 rounded-xl border border-primary/30 bg-primary/5 p-4 text-left transition-colors hover:border-primary hover:bg-primary/10";
  if (href) {
    return (
      <Link to={href} className={cls}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={openPerilexWizard} className={cls}>
      {inner}
    </button>
  );
}

// Uitklapbare knop die de interactieve "Perilex zelf aansluiten"-wizard toont.
export function PerilexWizardToggle({ lang = "nl" }: { lang?: WizardLang }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const c = COPY[lang];

  // Open + scroll wanneer de CTA bovenin de pagina wordt aangeklikt.
  useEffect(() => {
    const handler = () => {
      setOpen(true);
      requestAnimationFrame(() => {
        const el = ref.current;
        if (!el || typeof window === "undefined") return;
        const top = el.getBoundingClientRect().top + window.scrollY - 12;
        window.scrollTo({ top, behavior: "smooth" });
      });
    };
    window.addEventListener(OPEN_EVENT, handler);
    return () => window.removeEventListener(OPEN_EVENT, handler);
  }, []);

  return (
    <section ref={ref} id="perilex-wizard" className="not-prose my-10 scroll-mt-4">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="group flex w-full items-center gap-4 rounded-xl border border-border bg-surface p-5 text-left shadow-sm transition-colors hover:border-primary"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Wrench className="h-6 w-6" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-bold text-foreground">{c.title}</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">{c.subtitle}</span>
            </span>
            <ChevronDown
              className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 ${
                open ? "rotate-180" : ""
              }`}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-4">
            <PerilexWizard lang={lang} />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </section>
  );
}
