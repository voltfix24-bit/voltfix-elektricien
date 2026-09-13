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
          "Connect an induction hob, oven or cooker in Amsterdam. €120 excl. VAT with an existing suitable Perilex socket and working circuit.",
        path,
        locale: "en",
        ogTitle: "Induction hob and Perilex connection in Amsterdam",
        ogDescription:
          "Connecting hobs, ovens and cookers and preparing induction connection points in Amsterdam. Rate applies with an existing suitable socket and working circuit.",
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
        imagesrcset: `${heroImg560.url} 560w, ${heroImg1120.url} 1120w`,
        imagesizes: "(min-width: 640px) 176px, 128px",
        fetchpriority: "high",
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
      ldScript(faqSchema(faqs, "en", path)),
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
