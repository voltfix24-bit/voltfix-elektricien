import { Link } from "@tanstack/react-router";
import { BookOpen, ArrowRight } from "lucide-react";

import { useLocale } from "@/lib/i18n";

type Guide = { to: string; title: string; text: string };

const GUIDES_NL: Guide[] = [
  {
    to: "/perilex-stekker",
    title: "Perilex stekker: types, aansluiten en veiligheid",
    text: "Welke perilex stekker past bij uw fornuis of oven, en wat mag u zelf doen?",
  },
  {
    to: "/groepenkast-samenstellen",
    title: "Groepenkast samenstellen",
    text: "Hoeveel groepen en aardlekschakelaars heeft u nodig? Stap voor stap uitgelegd.",
  },
  {
    to: "/veelgestelde-vragen",
    title: "Veelgestelde vragen",
    text: "Tarieven, reactietijden, garantie en NEN 1010 — de antwoorden op een rij.",
  },
];

const GUIDES_EN: Guide[] = [
  {
    to: "/en-gb/how-to-assemble-a-fuse-box",
    title: "How to assemble a fuse box",
    text: "How many circuits and RCDs you need, explained step by step.",
  },
  {
    to: "/en-gb/faq",
    title: "Frequently asked questions",
    text: "Rates, response times, guarantees and the NEN 1010 standard.",
  },
];

/**
 * Interne linkblok naar uitleg-/kennispagina's. Deze pagina's krijgen weinig
 * links vanuit de dienstensilo; dit blok geeft ze crawl- en linkkracht.
 */
export function GuideLinks({
  currentPath,
  heading,
  className = "",
}: {
  currentPath?: string;
  heading?: string;
  className?: string;
}) {
  const locale = useLocale();
  const guides = (locale === "en" ? GUIDES_EN : GUIDES_NL).filter((g) => g.to !== currentPath);
  if (guides.length === 0) return null;

  const title =
    heading ?? (locale === "en" ? "Guides and background" : "Uitleg en achtergrond");
  const intro =
    locale === "en"
      ? "Practical explanations from our electricians in Amsterdam."
      : "Praktische uitleg van onze elektriciens in Amsterdam.";

  return (
    <section className={`border-t border-border bg-background ${className}`}>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-2xl font-bold sm:text-3xl">{title}</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">{intro}</p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {guides.map((g) => (
            <li key={g.to}>
              <Link
                to={g.to}
                className="group flex h-full flex-col rounded-lg border border-border bg-surface p-5 transition-colors hover:border-primary/50 hover:bg-primary/5"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <BookOpen className="h-4 w-4" />
                </span>
                <span className="mt-3 font-semibold group-hover:text-primary">{g.title}</span>
                <span className="mt-1.5 flex-1 text-sm text-muted-foreground">{g.text}</span>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  {locale === "en" ? "Read more" : "Lees meer"}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
