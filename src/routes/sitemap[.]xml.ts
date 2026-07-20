import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://www.voltfix.nl";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          // Nederlands
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/elektricien-amsterdam", changefreq: "monthly", priority: "0.9" },
          { path: "/spoed-elektricien-amsterdam", changefreq: "monthly", priority: "0.9" },
          { path: "/Groepenkast-Amsterdam", changefreq: "monthly", priority: "0.9" },
          { path: "/perilex-amsterdam", changefreq: "monthly", priority: "0.9" },
          { path: "/stroomstoring-amsterdam", changefreq: "monthly", priority: "0.9" },
          { path: "/over-ons", changefreq: "yearly", priority: "0.5" },
          { path: "/contact", changefreq: "yearly", priority: "0.7" },
          // English
          { path: "/en-gb", changefreq: "weekly", priority: "0.9" },
          { path: "/en-gb/elektricien-amsterdam", changefreq: "monthly", priority: "0.8" },
          { path: "/en-gb/spoed-elektricien-amsterdam", changefreq: "monthly", priority: "0.8" },
          { path: "/en-gb/Groepenkast-Amsterdam", changefreq: "monthly", priority: "0.8" },
          { path: "/en-gb/perilex-amsterdam", changefreq: "monthly", priority: "0.8" },
          { path: "/en-gb/stroomstoring-amsterdam", changefreq: "monthly", priority: "0.8" },
          { path: "/en-gb/over-ons", changefreq: "yearly", priority: "0.4" },
          { path: "/en-gb/contact", changefreq: "yearly", priority: "0.6" },
        ];

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
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
