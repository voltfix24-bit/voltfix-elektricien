import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/unsubscribe')({
  head: () => ({
    meta: [
      { title: 'Uitschrijven — VoltFix' },
      { name: 'robots', content: 'noindex,nofollow' },
    ],
  }),
  component: UnsubscribePage,
})

type State =
  | { kind: 'loading' }
  | { kind: 'ready' }
  | { kind: 'already' }
  | { kind: 'invalid' }
  | { kind: 'done' }
  | { kind: 'error'; message: string }

function UnsubscribePage() {
  const [state, setState] = useState<State>({ kind: 'loading' })
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('token')
    setToken(t)
    if (!t) {
      setState({ kind: 'invalid' })
      return
    }
    fetch(`/email/unsubscribe?token=${encodeURIComponent(t)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}))
        if (!res.ok) return setState({ kind: 'invalid' })
        if (data.valid === false && data.reason === 'already_unsubscribed') {
          return setState({ kind: 'already' })
        }
        if (data.valid) return setState({ kind: 'ready' })
        setState({ kind: 'invalid' })
      })
      .catch(() => setState({ kind: 'error', message: 'Netwerkfout' }))
  }, [])

  async function confirm() {
    if (!token) return
    setState({ kind: 'loading' })
    try {
      const res = await fetch('/email/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.success) return setState({ kind: 'done' })
      if (data.reason === 'already_unsubscribed') return setState({ kind: 'already' })
      setState({ kind: 'error', message: data.error ?? 'Er ging iets mis' })
    } catch {
      setState({ kind: 'error', message: 'Netwerkfout' })
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="text-3xl font-bold">Uitschrijven van VoltFix e-mails</h1>
      {state.kind === 'loading' && <p className="mt-6 text-muted-foreground">Even geduld…</p>}
      {state.kind === 'ready' && (
        <>
          <p className="mt-6 text-muted-foreground">
            Bevestig dat u geen e-mails meer wilt ontvangen van VoltFix.
          </p>
          <button
            onClick={confirm}
            className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 font-semibold text-primary-foreground hover:opacity-90"
          >
            Bevestig uitschrijven
          </button>
        </>
      )}
      {state.kind === 'done' && (
        <p className="mt-6 text-green-700">
          U bent uitgeschreven. U ontvangt geen e-mails meer van VoltFix.
        </p>
      )}
      {state.kind === 'already' && (
        <p className="mt-6 text-muted-foreground">Dit e-mailadres was al uitgeschreven.</p>
      )}
      {state.kind === 'invalid' && (
        <p className="mt-6 text-destructive">Deze link is ongeldig of verlopen.</p>
      )}
      {state.kind === 'error' && <p className="mt-6 text-destructive">{state.message}</p>}
    </div>
  )
}
