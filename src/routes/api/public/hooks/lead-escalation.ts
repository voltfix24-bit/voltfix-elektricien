import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/public/hooks/lead-escalation')({
  server: { handlers: { POST: async ({ request }) => {
    try {
      const { handleLeadEscalations } = await import('@/lib/lead-escalation.server')
      return await handleLeadEscalations(request)
    } catch {
      console.error('Lead escalation check failed')
      return new Response('Escalation check failed', { status: 500 })
    }
  } } },
})
