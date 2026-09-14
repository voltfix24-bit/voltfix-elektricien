import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const tokenSchema = z.string().regex(/^[A-Za-z0-9_-]{40,60}$/)

export const Route = createFileRoute('/api/public/completion-signature/')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = new URL(request.url).searchParams.get('token') ?? ''
        if (!tokenSchema.safeParse(token).success) return Response.json({ error: 'Ongeldige link' }, { status: 404 })
        const { getSignatureContext } = await import('@/lib/completion-proof.server')
        const context = await getSignatureContext(token)
        if (!context) return Response.json({ error: 'Deze link is verlopen of al gebruikt.' }, { status: 410 })
        return Response.json(context, { headers: { 'Cache-Control': 'no-store' } })
      },
      POST: async ({ request }) => {
        const origin = request.headers.get('origin')
        if (!origin || origin !== new URL(request.url).origin) return new Response('Forbidden', { status: 403 })
        const parsed = z.object({ token: tokenSchema, signature: z.string().max(2_000_000) }).safeParse(await request.json().catch(() => null))
        if (!parsed.success) return Response.json({ error: 'Ongeldige invoer' }, { status: 400 })
        try {
          const { submitSignature } = await import('@/lib/completion-proof.server')
          await submitSignature(parsed.data.token, parsed.data.signature)
          return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
        } catch (error) {
          return Response.json({ error: error instanceof Error ? error.message : 'Ondertekenen mislukt' }, { status: 409 })
        }
      },
    },
  },
})
