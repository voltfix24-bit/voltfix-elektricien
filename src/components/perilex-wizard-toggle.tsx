import { useState } from "react";
import { Wrench, ChevronDown } from "lucide-react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PerilexWizard, type WizardLang } from "@/components/perilex-wizard";

const COPY: Record<WizardLang, { title: string; subtitle: string }> = {
  nl: {
    title: "Stap-voor-stap: zelf je perilex aansluiten",
    subtitle: "Doorloop onze gratis hulp-wizard en check eerst veilig of je het zelf kunt doen.",
  },
  en: {
    title: "Step-by-step: connect your perilex yourself",
    subtitle: "Walk through our free help wizard and first safely check whether you can do it yourself.",
  },
};

// Uitklapbare knop die de interactieve "Perilex zelf aansluiten"-wizard toont.
export function PerilexWizardToggle({ lang = "nl" }: { lang?: WizardLang }) {
  const [open, setOpen] = useState(false);
  const c = COPY[lang];

  return (
    <section className="not-prose my-10">
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
