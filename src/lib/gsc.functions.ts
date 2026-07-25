import { createServerFn } from "@tanstack/react-start";

const GATEWAY = "https://connector-gateway.lovable.dev/google_search_console";
const SITE_URL = "sc-domain:voltfix.nl";

export const IMPORTANT_URLS: { url: string; label: string }[] = [
  { url: "https://www.voltfix.nl/", label: "Home (NL)" },
  { url: "https://www.voltfix.nl/en-gb", label: "Home (EN)" },
  { url: "https://www.voltfix.nl/perilex-amsterdam", label: "Perilex Amsterdam" },
  { url: "https://www.voltfix.nl/Groepenkast-Amsterdam", label: "Groepenkast Amsterdam" },
  { url: "https://www.voltfix.nl/elektricien-amsterdam", label: "Elektricien Amsterdam" },
  { url: "https://www.voltfix.nl/spoed-elektricien-amsterdam", label: "Spoed elektricien" },
  { url: "https://www.voltfix.nl/laadpaal-amsterdam", label: "Laadpaal Amsterdam" },
  { url: "https://www.voltfix.nl/keuring-amsterdam", label: "NEN-keuring" },
  { url: "https://www.voltfix.nl/stroomstoring-amsterdam", label: "Stroomstoring" },
  { url: "https://www.voltfix.nl/elektricien-amsterdam-zuid", label: "Wijk: Zuid" },
  { url: "https://www.voltfix.nl/elektricien-amsterdam-west", label: "Wijk: West" },
  { url: "https://www.voltfix.nl/elektricien-amsterdam-oost", label: "Wijk: Oost" },
  { url: "https://www.voltfix.nl/elektricien-amsterdam-noord", label: "Wijk: Noord" },
  { url: "https://www.voltfix.nl/elektricien-amsterdam-centrum", label: "Wijk: Centrum" },
  { url: "https://www.voltfix.nl/elektricien-amsterdam-de-pijp", label: "Wijk: De Pijp" },
  { url: "https://www.voltfix.nl/elektricien-amsterdam-ijburg", label: "Wijk: IJburg" },
  { url: "https://www.voltfix.nl/elektricien-amstelveen", label: "Amstelveen" },
  { url: "https://www.voltfix.nl/elektricien-haarlem", label: "Haarlem" },
  { url: "https://www.voltfix.nl/en-gb/perilex-amsterdam", label: "EN Perilex" },
  { url: "https://www.voltfix.nl/en-gb/Groepenkast-Amsterdam", label: "EN Groepenkast" },
  { url: "https://www.voltfix.nl/en-gb/electrician-amsterdam-zuid", label: "EN Zuid" },
  { url: "https://www.voltfix.nl/en-gb/electrician-amsterdam-west", label: "EN West" },
  { url: "https://www.voltfix.nl/en-gb/electrician-amsterdam-centre", label: "EN Centre" },
  { url: "https://www.voltfix.nl/en-gb/electrician-amstelveen", label: "EN Amstelveen" },
];

export type IndexRow = {
  url: string;
  label: string;
  verdict: string;
  coverageState: string;
  lastCrawlTime?: string;
  isWarning: boolean;
  error?: string;
};

async function inspectOne(url: string, label: string): Promise<IndexRow> {
  try {
    const res = await fetch(`${GATEWAY}/v1/urlInspection/index:inspect`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": process.env.GOOGLE_SEARCH_CONSOLE_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inspectionUrl: url, siteUrl: SITE_URL }),
    });
    if (!res.ok) {
      const text = await res.text();
      return {
        url,
        label,
        verdict: "ERROR",
        coverageState: "—",
        isWarning: true,
        error: `${res.status}: ${text.slice(0, 200)}`,
      };
    }
    const json = (await res.json()) as {
      inspectionResult?: {
        indexStatusResult?: {
          verdict?: string;
          coverageState?: string;
          lastCrawlTime?: string;
        };
      };
    };
    const s = json.inspectionResult?.indexStatusResult;
    const coverage = s?.coverageState ?? "Unknown";
    const verdict = s?.verdict ?? "UNKNOWN";
    const isWarning =
      coverage.toLowerCase().includes("discovered") ||
      coverage.toLowerCase().includes("crawled - currently not indexed") ||
      coverage.toLowerCase().includes("excluded") ||
      verdict === "FAIL";
    return {
      url,
      label,
      verdict,
      coverageState: coverage,
      lastCrawlTime: s?.lastCrawlTime,
      isWarning,
    };
  } catch (err) {
    return {
      url,
      label,
      verdict: "ERROR",
      coverageState: "—",
      isWarning: true,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export const inspectImportantUrls = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ rows: IndexRow[]; checkedAt: string }> => {
    if (!process.env.LOVABLE_API_KEY || !process.env.GOOGLE_SEARCH_CONSOLE_API_KEY) {
      throw new Error("Search Console connector is not linked.");
    }
    // Sequential to avoid gateway rate limits.
    const rows: IndexRow[] = [];
    for (const item of IMPORTANT_URLS) {
      rows.push(await inspectOne(item.url, item.label));
    }
    return { rows, checkedAt: new Date().toISOString() };
  },
);
