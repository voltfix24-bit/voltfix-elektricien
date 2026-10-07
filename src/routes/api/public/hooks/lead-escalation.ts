import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/public/hooks/lead-escalation')({
  server: { handlers: { POST: async ({ request }) => {
    try {
      const { handleLeadEscalations } = await import('@/lib/lead-escalation.server')
      const response = await handleLeadEscalations(request)
      // Zelfde beurt, zelfde beveiligde hook: de herhaalvraag om een plandatum
      // en het automatisch sluiten van oude reviewverzoeken.
      if (response.ok) {
        // Voorrangstijd voorbij: klus alsnog naar de gewone monteursgroep.
        const { releasePriorityLeads } = await import('@/lib/lead-priority.server')
        await releasePriorityLeads().catch((e) => console.error('releasePriorityLeads failed', e))
        const [{ sendSchedulePrompts }, { closeStaleReviews }] = await Promise.all([
          import('@/lib/lead-schedule.server'),
          import('@/lib/review-close.server'),
        ])
        await sendSchedulePrompts().catch((e) => console.error('sendSchedulePrompts failed', e))
        await closeStaleReviews().catch((e) => console.error('closeStaleReviews failed', e))
      }
      return response
    } catch {
      console.error('Lead escalation check failed')
      return new Response('Escalation check failed', { status: 500 })
    }
  } } },
})
