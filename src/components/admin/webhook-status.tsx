import { useQuery } from '@tanstack/react-query'
import { getTelegramWebhookStatus } from '@/lib/admin.functions'

/**
 * Telegram kan het afgeschermde id-preview-- domein niet bereiken; gebruik de
 * stabiele publieke projecthost (project--<id>-dev.<host> in preview).
 */
export function publicOrigin(): string {
  const { protocol, host } = window.location
  const m = host.match(/^id-preview--([0-9a-f-]+)\.(.+)$/)
  if (m) return `${protocol}//project--${m[1]}-dev.${m[2]}`
  if (host.startsWith('localhost') || host.startsWith('127.0.0.1')) {
    return 'https://project--44824aa3-8135-44e1-a592-63fc39da8084-dev.lovable.app'
  }
  return window.location.origin
}

/** Groen bolletje = Telegram-webhook actief. */
export function WebhookStatus() {
  const status = useQuery({
    queryKey: ['admin', 'webhook'],
    queryFn: () => getTelegramWebhookStatus(),
    staleTime: 60_000,
  })
  const info = status.data as { live?: boolean; error?: string | null } | undefined
  const live = Boolean(info?.live)
  const label = status.isLoading ? 'Telegram controleren…' : live ? 'Telegram live' : 'Telegram niet gekoppeld'

  return (
    <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 t-meta">
      <span
        aria-hidden
        className={`h-2 w-2 rounded-full ${
          status.isLoading ? 'bg-muted-foreground' : live ? 'bg-green-500' : 'bg-destructive'
        }`}
      />
      {label}
    </span>
  )
}
