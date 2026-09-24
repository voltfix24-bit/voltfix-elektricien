/**
 * Beheerderstestlink voor de bestaande websiteformulieren (browserkant).
 *
 * De link bevat een geheim token in het #-fragment (wordt nooit naar een
 * server of in een verwijzer meegestuurd). Een inline script in de head zet
 * het token vóór het laden van Google-tags in sessionStorage van déze tab en
 * haalt het uit de zichtbare URL. Zolang die testsessie actief is laden
 * gtag.js en gtm.js niet. Het token zelf bewijst niets in de browser: alleen
 * de server beslist, na controle, of een aanvraag een test is.
 */

export const FORM_TEST_STORAGE_KEY = 'vf_form_test'
export const FORM_TEST_IDEM_KEY = 'vf_form_test_idem'
export const FORM_TEST_HASH_PARAM = 'vftest'
export const FORM_TEST_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/
export const FORM_TEST_TTL_MS = 30 * 60 * 1000

/** Moet vóór elke Google-tagloader in de head staan. */
export const formTestActivationInlineScript =
  `(function(w){try{` +
  `var s=w.sessionStorage,h=w.location.hash||'',m=h.match(/[#&]${FORM_TEST_HASH_PARAM}=([A-Za-z0-9_-]{43})/);` +
  `if(m){s.setItem('${FORM_TEST_STORAGE_KEY}',m[1]);` +
  `w.history.replaceState(w.history.state,'',w.location.pathname+w.location.search);}` +
  `if(s.getItem('${FORM_TEST_STORAGE_KEY}'))w.__vfFormTest=true;` +
  `}catch(e){}})(window);`

export function readFormTestToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const t = window.sessionStorage.getItem(FORM_TEST_STORAGE_KEY)
    return t && FORM_TEST_TOKEN_PATTERN.test(t) ? t : null
  } catch {
    return null
  }
}

export function isFormTestSession(): boolean {
  return readFormTestToken() !== null
}

/**
 * Voegt het testtoken en een vaste herhaalsleutel toe aan een formulier-
 * verzending. Zonder actieve testsessie verandert er niets.
 */
export function appendFormTest(fd: FormData): void {
  const token = readFormTestToken()
  if (!token) return
  fd.set('formTestToken', token)
  if (!fd.has('idempotencyKey')) {
    let key: string | null = null
    try {
      key = window.sessionStorage.getItem(FORM_TEST_IDEM_KEY)
      if (!key) {
        key = `ft${crypto.randomUUID().replace(/-/g, '')}`
        window.sessionStorage.setItem(FORM_TEST_IDEM_KEY, key)
      }
    } catch {
      key = null
    }
    if (key) fd.set('idempotencyKey', key)
  }
}
