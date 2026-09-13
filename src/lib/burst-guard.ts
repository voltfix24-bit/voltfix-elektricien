/**
 * Burstbescherming voor het publieke aanvraagformulier.
 *
 * Doel: een reeks aanvragen vlak achter elkaar — een script, een testopstelling
 * of iemand die de knop blijft indrukken — mag nooit een rij Telegram-berichten
 * naar de monteursgroep sturen. De aanvraag gaat niet verloren: hij wordt stil
 * opgeslagen ter controle, precies zoals het bestaande spamfilter doet.
 *
 * Pure functie, zodat de drempels testbaar zijn zonder database of netwerk.
 */

export const BURST_WINDOW_MINUTES = 10
/** Zelfde afzender (IP of telefoonnummer) binnen het venster. */
export const BURST_MAX_PER_SENDER = 3
/** Hele site binnen het venster; hierboven is het geen normaal verkeer meer. */
export const BURST_MAX_TOTAL = 12

export type BurstCounts = {
  /** Aanvragen van dezelfde afzender in het venster, deze nog niet meegeteld. */
  sameSender: number
  /** Alle aanvragen in het venster, deze nog niet meegeteld. */
  total: number
}

export type BurstDecision = { hold: false } | { hold: true; reason: string }

export function burstDecision(counts: BurstCounts): BurstDecision {
  if (counts.sameSender >= BURST_MAX_PER_SENDER) {
    return { hold: true, reason: `burst_same_sender:${counts.sameSender + 1}/${BURST_WINDOW_MINUTES}min` }
  }
  if (counts.total >= BURST_MAX_TOTAL) {
    return { hold: true, reason: `burst_site_wide:${counts.total + 1}/${BURST_WINDOW_MINUTES}min` }
  }
  return { hold: false }
}

/** Begin van het telvenster als ISO-tijd. */
export function burstWindowStart(now: Date = new Date()): string {
  return new Date(now.getTime() - BURST_WINDOW_MINUTES * 60_000).toISOString()
}
