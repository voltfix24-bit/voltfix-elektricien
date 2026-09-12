const KEY = 'voltfix_draft_lead'
const MAX_AGE_MS = 24 * 60 * 60 * 1000

export type LeadDraft = { savedAt: number; values: Record<string, unknown> }

export function saveLeadDraft(values: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ savedAt: Date.now(), values } satisfies LeadDraft))
  } catch {
    /* opslag vol of geblokkeerd: concept gaat dan simpelweg niet mee */
  }
}

export function readLeadDraft(): LeadDraft | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as LeadDraft
    if (!parsed?.values || Date.now() - parsed.savedAt > MAX_AGE_MS) return null
    return parsed
  } catch {
    return null
  }
}

export function clearLeadDraft() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(KEY)
  } catch {
    /* niets te doen */
  }
}

/** Bevat het concept genoeg om aan te bieden voor herstel? */
export function draftHasContent(values: Record<string, unknown>) {
  return Object.entries(values).some(([key, value]) => {
    if (key === 'price_euro' || key === 'pricing_type') return false
    return typeof value === 'string' ? value.trim().length > 0 : Boolean(value)
  })
}
