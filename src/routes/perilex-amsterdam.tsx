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
        title: "Perilex en kookplaat aansluiten Amsterdam | VoltFix",
      description:
          "Perilex aansluiten voor €120 excl. btw. Voorrijden inbegrepen; stekker en aansluitkabel niet. Bij geschikte aansluiting en groep.",
      path,
        ogTitle: "Perilex en kookplaat aansluiten in Amsterdam",
      ogDescription:
        "Vast aansluittarief bij een geschikte Perilex-aansluiting en groep. Voorrijden inbegrepen; stekker en aansluitkabel niet.",
      ogType: "article",
      ogImage: absoluteUrl(heroImg.url),
    }),
    links: [
      { rel: "canonical", href: absoluteUrl(path) },
      {
        rel: "preload",
        as: "image",
        href: heroImg560.url,
        imageSrcSet: `${heroImg560.url} 560w, ${heroImg1120.url} 1120w`,
        imageSizes: "(min-width: 640px) 176px, 128px",
        fetchPriority: "high",
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
      // Geen automatische 60-minutenvraag: Perilex is geplande dienst, en het
      // schema mag alleen de zichtbare vragen van deze pagina bevatten.
      ldScript(faqSchema(faqs, "nl", path, false)),
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
