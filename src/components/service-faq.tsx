import { type ReactNode } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useT } from "@/lib/i18n";

export type Faq = { q: string; a: ReactNode };

type Props = {
  faqs: Faq[];
  title?: string;
};

export function ServiceFaq({ faqs, title }: Props) {
  const t = useT();
  return (
    <section className="mx-auto max-w-3xl px-4 py-16">
      <h2 className="text-center text-2xl font-bold sm:text-3xl">{title ?? t.faqHeading}</h2>
      <Accordion type="single" collapsible className="mt-8">
        {faqs.map((f, i) => (
          <AccordionItem key={i} value={`item-${i}`} className="border-border">
            <AccordionTrigger className="text-left text-base font-semibold hover:text-primary">
              {f.q}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {f.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
