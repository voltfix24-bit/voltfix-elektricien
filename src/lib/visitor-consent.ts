// ---------------------------------------------------------------------------
// Vaste identiteit van deze browser voor het beheren van de eigen toestemming
// ---------------------------------------------------------------------------
// Waarom dit bestaat: een klik-id is geen geheim. Wie het klik-id van iemand
// anders kent, mocht daarmee eerder bepalen wie "eigenaar" van die klik werd —
// simpelweg door er als eerste een bon voor op te halen.
//
// De oplossing is een geheim dat de browser zelf bewaart en dat nergens in een
// URL of bericht voorkomt. Dat geheim, en niet het klik-id, bepaalt welke
// metingen en dossiers bij deze bezoeker horen. De server bewaart er alleen een
// vingerafdruk van.
//
// Dit is functionele opslag: hij is nodig om een intrekking te kunnen honoreren
// en bevat geen advertentie-identifier. Hij blijft dus ook bestaan wanneer de
// bezoeker advertentiecookies weigert — zonder hem zou een latere intrekking
// niemand meer kunnen bereiken.
// ---------------------------------------------------------------------------

export const VISITOR_CONSENT_KEY = "voltfix_consent_visitor";

/** Alleen leesbaar binnen deze pagina, als de opslag geweigerd wordt. */
let memoryToken: string | null = null;

function randomToken(): string | null {
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  return null;
}

const TOKEN_PATTERN = /^[A-Za-z0-9._-]{16,200}$/;

/**
 * Het geheim van deze browser; wordt aangemaakt bij het eerste gebruik en
 * blijft daarna gelijk. Geeft altijd dezelfde waarde binnen één paginabezoek.
 */
export function getVisitorConsentToken(): string | null {
  if (typeof window === "undefined") return null;
  if (memoryToken) return memoryToken;
  try {
    const stored = window.localStorage.getItem(VISITOR_CONSENT_KEY);
    if (stored && TOKEN_PATTERN.test(stored)) {
      memoryToken = stored;
      return stored;
    }
  } catch {
    /* privémodus */
  }
  const fresh = randomToken();
  if (!fresh) return null;
  memoryToken = fresh;
  try {
    window.localStorage.setItem(VISITOR_CONSENT_KEY, fresh);
  } catch {
    /* privémodus: het geheim leeft dan alleen in deze pagina */
  }
  return fresh;
}

/** Alleen voor tests. */
export function __resetVisitorConsentToken() {
  memoryToken = null;
}
