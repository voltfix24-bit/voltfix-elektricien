import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'

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
  if (!install) return <Dialog><DialogTrigger asChild><Button variant="outline" className="min-h-11"><Download className="size-4" /> Op startscherm</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>VoltFix op je startscherm</DialogTitle><DialogDescription>Open deze pagina op je telefoon via de gepubliceerde website.</DialogDescription></DialogHeader><div className="space-y-4 text-sm"><p><strong>iPhone:</strong> open in Safari, tik op Delen en kies ‘Zet op beginscherm’. Zet ‘Open als webapp’ aan als die optie verschijnt.</p><p><strong>Android:</strong> open in Chrome, tik op het menu ⋮ en kies ‘App installeren’ of ‘Toevoegen aan startscherm’.</p><p className="text-muted-foreground">Je opent voortaan direct de leads. Beheerderslogin en internet blijven nodig; klantgegevens worden niet offline opgeslagen.</p></div></DialogContent></Dialog>
  return <Button variant="outline" onClick={async () => { await install.prompt(); await install.userChoice; setInstall(null) }}>
    <Download className="size-4" /> Installeer VoltFix
  </Button>
}