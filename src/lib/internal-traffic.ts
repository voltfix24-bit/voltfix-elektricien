// ---------------------------------------------------------------------------
// Eigen verkeer uitsluiten van klantmeting
// ---------------------------------------------------------------------------
// Een WhatsApp-klik die jij in de backoffice doet is geen klant die contact
// zoekt. Zulke klikken mogen nooit als conversie meetellen — niet in het eigen
// dashboard en niet in Google. Zowel de browser als de server gebruikt deze
// lijst, zodat een vervalst paginapad niets verandert aan de uitkomst.
// ---------------------------------------------------------------------------

const INTERNAL_PREFIXES = [
  '/admin',
  '/auth',
  '/dev-preview',
  '/seo-monitor',
  '/conversie-monitor',
  '/keyword-tool',
  '/onboarding',
  '/aanmelden',
  '/ondertekenen',
  '/api/',
]

/** True voor beheer-, monteur- en testpagina's. */
export function isInternalPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  const path = pathname.split('?')[0]!.toLowerCase()
  return INTERNAL_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`) || path.startsWith(prefix + '?'))
}

/** True wanneer de huidige pagina in de browser interne bediening is. */
export function isInternalPage(): boolean {
  if (typeof window === 'undefined') return false
  return isInternalPath(window.location.pathname)
}
