import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/public/hooks/lead-reminders')({
  server: { handlers: { POST: async ({ request }) => {
    try {
      const { handleLeadReminders } = await import('@/lib/lead-reminders.server')
      return await handleLeadReminders(request)
    } catch {
      console.error('Lead reminder check failed')
      return new Response('Reminder check failed', { status: 500 })
    }
  } } },
})