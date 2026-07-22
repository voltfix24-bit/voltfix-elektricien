import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://www.voltfix.nl";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
  lastmod?: string;
}


export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const today = new Date().toISOString().slice(0, 10);
        const newEnAreas = new Set([
          "/en-gb/electrician-amsterdam-zuid",
          "/en-gb/electrician-amsterdam-west",
          "/en-gb/electrician-amsterdam-centre",
          "/en-gb/electrician-amstelveen",
        ]);
        const entries: SitemapEntry[] = ([
          // Nederlands
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/elektricien-amsterdam", changefreq: "monthly", priority: "0.9" },
          { path: "/elektricien-amsterdam-centrum", changefreq: "monthly", priority: "0.8" },
          { path: "/elektricien-amsterdam-zuid", changefreq: "monthly", priority: "0.8" },
          { path: "/elektricien-amsterdam-west", changefreq: "monthly", priority: "0.8" },
          { path: "/elektricien-amsterdam-oost", changefreq: "monthly", priority: "0.8" },
          { path: "/elektricien-amsterdam-noord", changefreq: "monthly", priority: "0.8" },
          { path: "/elektricien-amsterdam-de-pijp", changefreq: "monthly", priority: "0.8" },
          { path: "/elektricien-amsterdam-ijburg", changefreq: "monthly", priority: "0.8" },
          { path: "/elektricien-amstelveen", changefreq: "monthly", priority: "0.8" },
          { path: "/elektricien-haarlem", changefreq: "monthly", priority: "0.8" },
          { path: "/spoed-elektricien-amsterdam", changefreq: "monthly", priority: "0.9" },
          { path: "/Groepenkast-Amsterdam", changefreq: "monthly", priority: "0.9" },
          { path: "/perilex-amsterdam", changefreq: "monthly", priority: "0.9" },
          { path: "/stroomstoring-amsterdam", changefreq: "monthly", priority: "0.9" },
          { path: "/laadpaal-amsterdam", changefreq: "monthly", priority: "0.9" },
          { path: "/keuring-amsterdam", changefreq: "monthly", priority: "0.9" },
          { path: "/over-ons", changefreq: "yearly", priority: "0.5" },
          { path: "/contact", changefreq: "yearly", priority: "0.7" },
          // English
          { path: "/en-gb", changefreq: "weekly", priority: "0.9" },
          { path: "/en-gb/elektricien-amsterdam", changefreq: "monthly", priority: "0.8" },
          { path: "/en-gb/spoed-elektricien-amsterdam", changefreq: "monthly", priority: "0.8" },
          { path: "/en-gb/Groepenkast-Amsterdam", changefreq: "monthly", priority: "0.8" },
          { path: "/en-gb/perilex-amsterdam", changefreq: "monthly", priority: "0.8" },
          { path: "/en-gb/stroomstoring-amsterdam", changefreq: "monthly", priority: "0.8" },
          { path: "/en-gb/ev-charger-installation-amsterdam", changefreq: "monthly", priority: "0.8" },
          { path: "/en-gb/electrical-inspection-amsterdam", changefreq: "monthly", priority: "0.8" },
          { path: "/en-gb/electrician-amsterdam-zuid", changefreq: "monthly", priority: "0.8" },
          { path: "/en-gb/electrician-amsterdam-west", changefreq: "monthly", priority: "0.8" },
          { path: "/en-gb/electrician-amsterdam-centre", changefreq: "monthly", priority: "0.8" },
          { path: "/en-gb/electrician-amstelveen", changefreq: "monthly", priority: "0.8" },
          { path: "/en-gb/over-ons", changefreq: "yearly", priority: "0.4" },
          { path: "/en-gb/contact", changefreq: "yearly", priority: "0.6" },
        ] as SitemapEntry[]).map((e) => (newEnAreas.has(e.path) ? { ...e, lastmod: today, changefreq: "weekly" as const, priority: "0.9" } : e));

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );


        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
