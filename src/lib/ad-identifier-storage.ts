// ---------------------------------------------------------------------------
// Waar advertentie-identifiers in de browser kunnen staan
// ---------------------------------------------------------------------------
// Eén plek wissen is niet genoeg: hetzelfde klik-id kan op meerdere plaatsen
// terechtkomen. Deze inventaris is de enige waarheid over die plekken, zodat
// een weigering overal doorwerkt.
//
// 1. voltfix_ad_click (localStorage) — de bewaarde advertentieklik zelf.
// 2. voltfix_src (sessionStorage) — de bron van dit bezoek; bevat het klik-id
//    waarmee twee klikken uit dezelfde campagne te onderscheiden zijn.
// 3. voltfix_src_history (sessionStorage) — de laatste vijf aanrakingen.
//
// Het bronlabel zelf ("via een advertentie") is geen identifier en blijft
// staan: dat vertelt niets over een persoon en is nodig om het bezoek eerlijk
// te kunnen benoemen.
// ---------------------------------------------------------------------------

export const AD_CLICK_STORAGE_KEY = "voltfix_ad_click";
export const SOURCE_SESSION_KEY = "voltfix_src";
export const SOURCE_HISTORY_KEY = "voltfix_src_history";

function stripClickId(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return JSON.stringify(parsed.map((entry) => ({ ...entry, clickId: null })));
    }
    if (parsed && typeof parsed === "object") {
      return JSON.stringify({ ...parsed, clickId: null });
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * 4. Het geheugen van de huidige pagina. Zonder keuze bewaart de site de klik
 *    alleen hier; dat is óók een kopie en moet bij een weigering weg. Dit
 *    vakje staat bewust in dit bestand en niet in ad-click.ts: zo werkt het
 *    opruimen ook wanneer die module (nog) niet geladen is.
 */
export const adClickMemory: { value: unknown } = { value: null };

/** Wist elke bewaarde advertentie-identifier; bronlabels blijven behouden. */
export function purgeAdIdentifiers() {
  // Het geheugen eerst: dat werkt ook zonder browser.
  adClickMemory.value = null;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(AD_CLICK_STORAGE_KEY);
  } catch {
    /* privémodus */
  }
  for (const key of [SOURCE_SESSION_KEY, SOURCE_HISTORY_KEY]) {
    try {
      const cleaned = stripClickId(window.sessionStorage.getItem(key));
      if (cleaned) window.sessionStorage.setItem(key, cleaned);
    } catch {
      /* privémodus */
    }
  }
}
