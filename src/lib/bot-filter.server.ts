/**
 * Server-side bot- en spamfiltering voor first-party conversietracking.
 *
 * Doel: het conversiedashboard (/conversie-monitor) en de bounce-cijfers
 * schoon houden. Elke binnenkomende hit wordt gecontroleerd op:
 *   1. bekende crawler/scraper user-agents
 *   2. ontbrekende of onzinnige user-agent / accept-headers
 *   3. headless-browser signalen
 *   4. referral-spam domeinen (semalt, buttons-for-website, darodar, ...)
 *
 * We gooien de hit niet weg maar taggen 'm (is_bot + bot_reason), zodat we
 * achteraf kunnen zien hoeveel ruis er wordt gefilterd en de regels kunnen
 * bijstellen zonder data te verliezen.
 */

/** User-agents van crawlers, scrapers, monitoring- en preview-bots. */
const BOT_UA_PATTERN =
  /(bot\b|bots\b|spider|crawl|slurp|scrapy|curl\/|wget|python-requests|httpclient|okhttp|java\/|go-http-client|libwww|perl|phantomjs|headlesschrome|puppeteer|playwright|selenium|lighthouse|pagespeed|gtmetrix|pingdom|uptimerobot|statuscake|semrush|ahrefs|mj12|dotbot|petalbot|bytespider|dataforseo|serpstat|screaming frog|seokicks|blexbot|zgrab|masscan|nmap|censys|expanse|facebookexternalhit|whatsapp\/|telegrambot|slackbot|discordbot|embedly|preview|monitoring|checkly)/i;

/** Klassieke referral-spam / ghost-referral domeinen. */
const SPAM_REFERRER_PATTERN =
  /(semalt|buttons-for(-your)?-?website|darodar|ilovevitaly|hulfingtonpost|econom|blackhatworth|savetubevideo|4webmasters|traffic2money|success-seo|rank-checker|free-share-buttons|event-tracking|site\d*\.ru|sharebutton|floating-share|best-seo|seo-platform|forum69|adcash|trafficmonetizer|videos-for-your-business)/i;

export type BotVerdict = { isBot: boolean; reason: string | null };

const NOT_BOT: BotVerdict = { isBot: false, reason: null };

export function classifyTrafficSource(input: {
  userAgent: string | null;
  acceptLanguage: string | null;
  referrerHost?: string | null;
  utmSource?: string | null;
  secFetchMode?: string | null;
}): BotVerdict {
  const ua = (input.userAgent ?? "").trim();

  if (!ua) return { isBot: true, reason: "missing_user_agent" };
  if (ua.length < 15) return { isBot: true, reason: "short_user_agent" };
  if (BOT_UA_PATTERN.test(ua)) return { isBot: true, reason: "bot_user_agent" };

  // Echte browsers sturen altijd een Accept-Language header mee.
  if (!input.acceptLanguage) return { isBot: true, reason: "missing_accept_language" };

  // Headless Chrome verbergt zich soms achter een normale UA-string.
  if (/headless|electron\//i.test(ua)) return { isBot: true, reason: "headless_browser" };

  const ref = (input.referrerHost ?? "").toLowerCase();
  if (ref && SPAM_REFERRER_PATTERN.test(ref)) {
    return { isBot: true, reason: "spam_referrer" };
  }

  const utm = (input.utmSource ?? "").toLowerCase();
  if (utm && SPAM_REFERRER_PATTERN.test(utm)) {
    return { isBot: true, reason: "spam_utm_source" };
  }

  return NOT_BOT;
}

/** Handige helper voor route-handlers: leest de headers uit het Request. */
export function classifyRequest(
  request: Request,
  extra: { referrerHost?: string | null; utmSource?: string | null } = {},
): BotVerdict {
  return classifyTrafficSource({
    userAgent: request.headers.get("user-agent"),
    acceptLanguage: request.headers.get("accept-language"),
    secFetchMode: request.headers.get("sec-fetch-mode"),
    referrerHost: extra.referrerHost ?? null,
    utmSource: extra.utmSource ?? null,
  });
}
