/**
 * Voorrang bij storingen.
 *
 * Eén regel, in één zin uit te leggen: zit je al op een storing, dan mag
 * iemand die vrij is er twee minuten eerder bij. Geen ranglijst, geen
 * acceptatieplicht, geen weigerteller — alleen wat iemand heeft aangenomen.
 *
 * De autoriteit blijft de database (`claim_lead`): daar wordt de toestand
 * bepaald op het moment van aannemen en blijft het claimen één atomaire
 * update. Deze module is de gedeelde rekenkern voor het admin-scherm en de
 * teksten, en houdt de regel testbaar.
 */

export const BUSY_WINDOW_MINUTES = 120 // een storing kost ongeveer 2 uur
export const DELAY_SECONDS = 120

export type ClaimPrioritySettings = {
  enabled: boolean
  busyWindowMinutes: number
  delaySeconds: number
}

export const DEFAULT_CLAIM_PRIORITY: ClaimPrioritySettings = {
  enabled: true,
  busyWindowMinutes: BUSY_WINDOW_MINUTES,
  delaySeconds: DELAY_SECONDS,
}

export type PriorityContractor = {
  id: string
  isActive?: boolean
  lastStoringClaimAt?: string | null
}

/** Zit deze monteur nog op een storing? */
export function isOnStoring(
  c: Pick<PriorityContractor, 'lastStoringClaimAt'>,
  now: Date = new Date(),
  settings: ClaimPrioritySettings = DEFAULT_CLAIM_PRIORITY,
): boolean {
  if (!c.lastStoringClaimAt) return false
  const minutes = (now.getTime() - new Date(c.lastStoringClaimAt).getTime()) / 60000
  return minutes >= 0 && minutes < settings.busyWindowMinutes
}

/** Hoeveel minuten deze monteur nog als bezig telt (0 = vrij). */
export function busyMinutesLeft(
  c: Pick<PriorityContractor, 'lastStoringClaimAt'>,
  now: Date = new Date(),
  settings: ClaimPrioritySettings = DEFAULT_CLAIM_PRIORITY,
): number {
  if (!isOnStoring(c, now, settings)) return 0
  const minutes = (now.getTime() - new Date(c.lastStoringClaimAt!).getTime()) / 60000
  return Math.max(0, Math.ceil(settings.busyWindowMinutes - minutes))
}

/**
 * Vertraging in seconden voor deze monteur bij deze lead.
 * Alleen bij storingen, en alleen als er iemand vrij is om voor te gaan.
 */
export function claimDelaySeconds(
  lead: { isEmergency: boolean },
  contractor: PriorityContractor,
  activeContractors: PriorityContractor[],
  now: Date = new Date(),
  settings: ClaimPrioritySettings = DEFAULT_CLAIM_PRIORITY,
): number {
  if (!settings.enabled) return 0
  if (!lead.isEmergency) return 0 // gepland werk: nooit een rem
  if (!isOnStoring(contractor, now, settings)) return 0 // zelf vrij: direct

  const someoneFree = activeContractors.some(
    (c) => c.isActive !== false && c.id !== contractor.id && !isOnStoring(c, now, settings),
  )
  return someoneFree ? settings.delaySeconds : 0 // iedereen bezig: gelijke voorrang
}

export type ClaimCheck =
  | { allowed: true }
  | { allowed: false; secondsLeft: number; since: string }

export function canClaimNow(
  lead: { isEmergency: boolean; dispatchedAt: string | null },
  contractor: PriorityContractor,
  activeContractors: PriorityContractor[],
  now: Date = new Date(),
  settings: ClaimPrioritySettings = DEFAULT_CLAIM_PRIORITY,
): ClaimCheck {
  if (!lead.dispatchedAt) return { allowed: true }
  const delay = claimDelaySeconds(lead, contractor, activeContractors, now, settings)
  if (delay <= 0) return { allowed: true }
  const elapsed = (now.getTime() - new Date(lead.dispatchedAt).getTime()) / 1000
  if (elapsed >= delay) return { allowed: true }
  return {
    allowed: false,
    secondsLeft: Math.ceil(delay - elapsed),
    since: contractor.lastStoringClaimAt!,
  }
}

/** "1 min 20" / "45 sec" — kort genoeg voor een Telegram-venstertje. */
export function waitText(secondsLeft: number): string {
  const s = Math.max(0, Math.ceil(secondsLeft))
  if (s < 60) return `${s} sec`
  const m = Math.floor(s / 60)
  const rest = s % 60
  return rest === 0 ? `${m} min` : `${m} min ${String(rest).padStart(2, '0')}`
}

/** Tijdstip in Amsterdamse klok, zoals de monteur het in de groep ziet. */
export function clockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('nl-NL', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Amsterdam',
  })
}

/** Bewust transparant: wie wacht, moet kunnen zien waaróm. */
export function tooEarlyNotice(secondsLeft: number, since: string | null): string {
  const first = `Nog ${waitText(secondsLeft)}.`
  const why = since ? ` Je hebt sinds ${clockTime(since)} een storing lopen.` : ''
  return `${first}${why}\nProbeer het daarna opnieuw.`
}
