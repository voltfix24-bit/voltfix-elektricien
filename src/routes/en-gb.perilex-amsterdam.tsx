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
  localeMeta,
  pageMeta,
  serviceSchema,
} from "@/lib/seo";

const nlPath = "/perilex-amsterdam";
const path = "/en-gb/perilex-amsterdam";
const faqs = perilexFaqs("en");

export const Route = createFileRoute("/en-gb/perilex-amsterdam")({
  head: () => ({
    meta: [
      ...pageMeta({
        title: "Induction hob & Perilex connection Amsterdam | VoltFix",
        description:
          "Perilex connection for €120 excl. VAT. Travel included; plug and cable excluded. For a suitable socket and working circuit.",
        path,
        locale: "en",
        ogTitle: "Induction hob and Perilex connection in Amsterdam",
        ogDescription:
          "Fixed connection rate with a suitable Perilex socket and circuit. Travel included; plug and connection cable excluded.",
        ogType: "article",
        ogImage: absoluteUrl(heroImg.url),
      }),
      ...localeMeta("en"),
    ],
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
      ...altLinks(nlPath),
    ],
    scripts: [
      ldScript({
        ...serviceSchema({
          name: "Perilex connection Amsterdam",
          description:
            "Connecting hobs, ovens and cookers to an existing Perilex connection and preparing induction connection points in Amsterdam.",
          path,
          locale: "en",
        }),
        ...perilexServiceOffers("en", path),
      }),
      // Schema bevat uitsluitend de zichtbare vragen; geen spoedbelofte.
      ldScript(faqSchema(faqs, "en", path, false)),
      ldScript(
        breadcrumbSchema([
          { name: "Home", path: "/en-gb" },
          { name: "Perilex connection Amsterdam", path },
        ]),
      ),
    ],
  }),
  component: () => <PerilexPage lang="en" />,
});
