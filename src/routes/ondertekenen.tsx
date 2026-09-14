import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/ondertekenen')({
  head: () => ({ meta: [
    { title: 'Klus ondertekenen | VoltFix' },
    { name: 'description', content: 'Bevestig de uitgevoerde klus met uw handtekening.' },
    { name: 'robots', content: 'noindex, nofollow' },
    { property: 'og:title', content: 'Klus ondertekenen | VoltFix' },
    { property: 'og:description', content: 'Bevestig de uitgevoerde klus.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
  ] }),
  component: SignaturePage,
})

function SignaturePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [context, setContext] = useState<{ customerName: string; address: string } | null>(null)
  const [error, setError] = useState('')
  const [drawing, setDrawing] = useState(false)
  const [hasInk, setHasInk] = useState(false)
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const token = typeof window === 'undefined' ? '' : new URLSearchParams(window.location.search).get('token') ?? ''

  useEffect(() => {
    if (!token) { setError('Deze link is ongeldig.'); return }
    fetch(`/api/public/completion-signature?token=${encodeURIComponent(token)}`)
      .then(async (res) => { const body = await res.json(); if (!res.ok) throw new Error(body.error); return body })
      .then(setContext).catch((reason) => setError(reason instanceof Error ? reason.message : 'Deze link is ongeldig.'))
  }, [token])

  function point(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    return { x: (event.clientX - rect.left) * canvas.width / rect.width, y: (event.clientY - rect.top) * canvas.height / rect.height }
  }
  function draw(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing) return
    const canvas = canvasRef.current; const p = point(event); const ctx = canvas?.getContext('2d')
    if (!canvas || !p || !ctx) return
    ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.strokeStyle = '#111827'; ctx.lineTo(p.x, p.y); ctx.stroke(); setHasInk(true)
  }
  function start(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current; const p = point(event); const ctx = canvas?.getContext('2d')
    if (!canvas || !p || !ctx) return
    event.currentTarget.setPointerCapture(event.pointerId); ctx.beginPath(); ctx.moveTo(p.x, p.y); setDrawing(true)
  }
  function clear() { const canvas = canvasRef.current; canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height); setHasInk(false) }
  async function submit() {
    const canvas = canvasRef.current
    if (!canvas || !hasInk) return
    setSending(true); setError('')
    const res = await fetch('/api/public/completion-signature', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, signature: canvas.toDataURL('image/png') }) })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) { setError(body.error ?? 'Ondertekenen mislukt.'); setSending(false); return }
    setDone(true)
  }

  return <main className="mx-auto flex min-h-dvh max-w-lg items-center px-4 py-10">
    <section className="w-full rounded-xl border border-border bg-card p-5 shadow-sm">
      <p className="text-sm font-bold text-primary">VoltFix</p>
      <h1 className="mt-1 text-2xl font-extrabold">Klus ondertekenen</h1>
      {error && <p role="alert" className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
      {!context && !error && <p className="mt-5 flex items-center gap-2 text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Gegevens laden…</p>}
      {done ? <div className="mt-6 text-center"><Check className="mx-auto size-10 text-success" /><p className="mt-2 font-bold">Ondertekend</p><p className="text-sm text-muted-foreground">De klus is nu als uitgevoerd vastgelegd.</p></div> : context && <>
        <dl className="mt-5 space-y-3 text-sm"><div><dt className="text-muted-foreground">Klant</dt><dd className="font-bold">{context.customerName}</dd></div><div><dt className="text-muted-foreground">Adres</dt><dd className="font-bold">{context.address}</dd></div></dl>
        <label className="mt-6 block text-sm font-bold" htmlFor="signature-canvas">Handtekening klant</label>
        <canvas id="signature-canvas" ref={canvasRef} width={700} height={320} className="mt-2 h-52 w-full touch-none rounded-lg border border-input bg-background" onPointerDown={start} onPointerMove={draw} onPointerUp={() => setDrawing(false)} onPointerCancel={() => setDrawing(false)} />
        <button type="button" className="mt-2 text-sm font-semibold text-muted-foreground underline" onClick={clear}>Opnieuw tekenen</button>
        <Button className="mt-5 min-h-12 w-full" disabled={!hasInk || sending} onClick={submit}>{sending ? <Loader2 className="animate-spin" /> : <Check />} Ondertekenen</Button>
      </>}
    </section>
  </main>
}
