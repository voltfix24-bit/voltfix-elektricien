/**
 * Server-only laag voor IndexNow: stuurt gewijzigde URL's naar Bing.
 */

import {
  INDEXNOW_KEY,
  INDEXNOW_KEY_LOCATION,
  indexNowStatusMessage,
  type IndexNowResult,
} from "./indexnow";
import { BASE_URL, allSiteUrls } from "./site-urls";

const ENDPOINT = "https://api.indexnow.org/indexnow";

/** Maakt van een pad of volledige URL een absolute URL op het eigen domein. */
function normalize(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const url = trimmed.startsWith("http") ? trimmed : `${BASE_URL}${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
  return url.startsWith(`${BASE_URL}/`) || url === BASE_URL ? url : null;
}

/**
 * Pingt Bing via IndexNow. Zonder `urls` worden alle indexeerbare pagina's
 * uit de sitemap aangeboden (handig na een grote update of een deploy).
 */
export async function pingIndexNow(urls?: string[]): Promise<IndexNowResult> {
  const list = [
    ...new Set(
      (urls && urls.length > 0 ? urls : allSiteUrls())
        .map(normalize)
        .filter((u): u is string => u !== null),
    ),
  ].slice(0, 10000);

  if (list.length === 0) {
    throw new Error("Geen geldige URL's op www.voltfix.nl om aan te bieden.");
  }

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: new URL(BASE_URL).host,
      key: INDEXNOW_KEY,
      keyLocation: INDEXNOW_KEY_LOCATION,
      urlList: list,
    }),
  });

  const accepted = res.status === 200 || res.status === 202;
  if (!accepted) {
    const body = await res.text().catch(() => "");
    console.error(`IndexNow-verzoek mislukt [${res.status}]: ${body.slice(0, 300)}`);
  }

  return {
    submitted: list.length,
    urls: list,
    status: res.status,
    accepted,
    message: indexNowStatusMessage(res.status),
    submittedAt: new Date().toISOString(),
  };
}
