import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/public/hooks/lead-digest')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { handleLeadDigest } = await import('@/lib/lead-digest.server')
          return await handleLeadDigest(request)
        } catch (error) {
          console.error('Lead digest failed', error)
          return new Response('Digest failed', { status: 500 })
        }
      },
    },
  },
})
