import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

export function InstallAdminApp() {
  const [install, setInstall] = useState<InstallEvent | null>(null)
  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/admin-sw.js').catch(() => {})
    const handler = (event: Event) => { event.preventDefault(); setInstall(event as InstallEvent) }
    const installed = () => setInstall(null)
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', installed)
    return () => { window.removeEventListener('beforeinstallprompt', handler); window.removeEventListener('appinstalled', installed) }
  }, [])
  if (!install) return null
  return <Button variant="outline" onClick={async () => { await install.prompt(); await install.userChoice; setInstall(null) }}>
    <Download className="size-4" /> Installeer VoltFix
  </Button>
}