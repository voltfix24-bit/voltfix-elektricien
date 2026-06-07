import { business } from "@/lib/business";
import { CtaButtons } from "@/components/cta-buttons";

type Props = {
  title?: string;
  text?: string;
  message?: string;
};

// Repeated conversion band placed after major sections.
export function CtaBand({ title, text, message }: Props) {
  return (
    <section className="relative overflow-hidden border-y border-primary/20 bg-card">
      <div className="absolute inset-0 bg-grid opacity-60" aria-hidden />
      <div className="relative mx-auto max-w-4xl px-4 py-14 text-center">
        <h2 className="text-2xl font-bold text-balance sm:text-3xl">
          {title ?? "Direct een elektricien nodig in Amsterdam?"}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          {text ??
            `Bel ${business.phoneDisplay} of stuur een WhatsApp. Vaak binnen 30–60 minuten ter plaatse bij spoed, met een vaste prijsafspraak vooraf.`}
        </p>
        <div className="mt-7 flex justify-center">
          <CtaButtons message={message} />
        </div>
      </div>
    </section>
  );
}
