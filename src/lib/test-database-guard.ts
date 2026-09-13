/**
 * Beveiliging voor destructieve integratietests.
 *
 * De fase 5B-tests bouwen het schema opnieuw op en wissen daarbij alles.
 * Zonder harde controle kan één verkeerd gezette omgevingsvariabele een
 * echte database leegmaken. Deze controle staat tussen de test en de
 * `drop schema`: hij laat uitsluitend een lokale wegwerpdatabase door.
 */

export type DisposableCheck = { ok: true } | { ok: false; reason: string }

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]', '0.0.0.0'])

/** Alleen een lokale database met "test" of "tmp" in de naam mag gewist worden. */
export function checkDisposableDatabaseUrl(raw: string | undefined, allowFlag: string | undefined): DisposableCheck {
  if (!raw) return { ok: false, reason: 'geen database-URL opgegeven' }
  if (allowFlag !== 'yes') {
    return { ok: false, reason: 'INFO_REQUEST_TEST_ALLOW_RESET moet expliciet op "yes" staan' }
  }
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return { ok: false, reason: 'database-URL is onleesbaar' }
  }
  if (!/^postgres(ql)?:$/.test(url.protocol)) return { ok: false, reason: 'geen postgres-URL' }
  if (!LOCAL_HOSTS.has(url.hostname)) return { ok: false, reason: `host ${url.hostname} is niet lokaal` }
  const name = url.pathname.replace(/^\//, '')
  if (!name) return { ok: false, reason: 'databasenaam ontbreekt' }
  if (/prod|live|supabase|pooler/i.test(`${name}${url.hostname}`)) {
    return { ok: false, reason: `databasenaam ${name} lijkt op een echte omgeving` }
  }
  if (!/(^|[-_])(test|tmp)/i.test(name)) {
    return { ok: false, reason: `databasenaam ${name} bevat geen "test" of "tmp"` }
  }
  return { ok: true }
}

/**
 * Tweede slot: een wegwerpdatabase bevat geen echte gegevens. Zodra er ergens
 * rijen staan die op productie wijzen, stopt de test zonder iets te wissen.
 */
export function checkDatabaseIsEmpty(counts: Array<{ table: string; rows: number }>): DisposableCheck {
  const filled = counts.filter(entry => entry.rows > 0)
  if (filled.length) {
    return { ok: false, reason: `database bevat gegevens (${filled.map(f => `${f.table}: ${f.rows}`).join(', ')})` }
  }
  return { ok: true }
}

export function disposableDatabaseError(reason: string): Error {
  return new Error(
    `Weigering: de integratietests wissen het volledige schema en draaien alleen op een lokale wegwerpdatabase — ${reason}.`,
  )
}
