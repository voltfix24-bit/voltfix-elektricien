import { createFileRoute } from "@tanstack/react-router";

import heroImg from "@/assets/voltfix-perilex-stekker-amsterdam.webp.asset.json";
import heroImg560 from "@/assets/voltfix-perilex-stekker-amsterdam-560.webp.asset.json";
import heroImg1120 from "@/assets/voltfix-perilex-stekker-amsterdam-1120.webp.asset.json";
import { PerilexPage } from "@/components/perilex-page";
import { perilexFaqs } from "@/lib/perilex-content";
import { perilexServiceOffers } from "@/lib/perilex-schema";
import {
  absoluteUrl,
  altLinks,
  breadcrumbSchema,
  faqSchema,
  ldScript,
  pageMeta,
  serviceSchema,
} from "@/lib/seo";

const path = "/perilex-amsterdam";
const faqs = perilexFaqs("nl");

export const Route = createFileRoute("/perilex-amsterdam")({
  head: () => ({
    meta: pageMeta({
      title: "Perilex aansluiten Amsterdam | Inductie | VoltFix",
      description:
        "Perilex-stekker op je kookplaat, oven of fornuis aansluiten in Amsterdam voor €120 excl. btw, bij een bestaande geschikte Perilex-aansluiting en werkende groep.",
      path,
      ogTitle: "Perilex aansluiten in Amsterdam — €120 excl. btw",
      ogDescription:
        "Kookplaat, oven of fornuis aansluiten en inductieaansluitingen voorbereiden in Amsterdam. Tarief geldt bij een bestaande geschikte aansluiting en werkende groep.",
      ogType: "article",
      ogImage: absoluteUrl(heroImg.url),
    }),
    links: [
      { rel: "canonical", href: absoluteUrl(path) },
      {
        rel: "preload",
        as: "image",
        href: heroImg560.url,
        imagesrcset: `${heroImg560.url} 560w, ${heroImg1120.url} 1120w`,
        imagesizes: "(min-width: 640px) 176px, 128px",
        fetchpriority: "high",
      },
      ...altLinks(path),
    ],
    scripts: [
      ldScript({
        ...serviceSchema({
          name: "Perilex aansluiten Amsterdam",
          description:
            "Aansluiten van kookplaten, ovens en fornuizen op een bestaande Perilex-aansluiting en voorbereiden van inductieaansluitingen in Amsterdam.",
          path,
        }),
        ...perilexServiceOffers("nl", path),
      }),
      ldScript(faqSchema(faqs, "nl", path)),
      ldScript(
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Perilex aansluiten Amsterdam", path },
        ]),
      ),
    ],
  }),
  component: () => <PerilexPage lang="nl" />,
});
