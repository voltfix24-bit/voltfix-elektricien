/**
 * IndexNow: browser-veilige constanten en types.
 *
 * IndexNow is het protocol van Bing (en Yandex, Seznam, Naver) waarmee een
 * site zelf meldt dat een URL is toegevoegd of gewijzigd. Bing haalt de
 * pagina dan meestal binnen minuten op in plaats van bij de volgende crawl.
 *
 * De sleutel is bewust publiek: hij moet als tekstbestand op de site staan
 * (/{key}.txt) zodat Bing kan verifiëren dat wij eigenaar zijn.
 */

export const INDEXNOW_KEY = "fd4f9e79c7811ae1a154e80f2d782888";

export const INDEXNOW_KEY_LOCATION = `https://www.voltfix.nl/${INDEXNOW_KEY}.txt`;

export type IndexNowResult = {
  /** Aantal URL's dat is aangeboden. */
  submitted: number;
  urls: string[];
  status: number;
  /** true bij HTTP 200 (verwerkt) of 202 (geaccepteerd, sleutelcheck volgt). */
  accepted: boolean;
  message: string;
  submittedAt: string;
};

/** Menselijke uitleg bij de statuscodes die IndexNow teruggeeft. */
export function indexNowStatusMessage(status: number): string {
  switch (status) {
    case 200:
      return "URL's ontvangen en verwerkt door Bing.";
    case 202:
      return "URL's geaccepteerd; Bing controleert nu de sleutel op de site.";
    case 400:
      return "Ongeldig verzoek: controleer de URL-indeling.";
    case 403:
      return "Sleutel niet geldig: het sleutelbestand is niet bereikbaar op de site.";
    case 422:
      return "URL's horen niet bij dit domein of de sleutel komt niet overeen.";
    case 429:
      return "Te veel verzoeken. Probeer het later opnieuw.";
    default:
      return `Onverwachte status ${status} van IndexNow.`;
  }
}
