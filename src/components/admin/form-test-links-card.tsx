import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createFormTestLinkFn } from '@/lib/form-test-link.functions'

type Link = { url: string; expiresAt: string; label: string; gclid: string | null }

/** Beheerderstestlinks voor de bestaande websiteformulieren. */
export function FormTestLinksCard() {
  const create = useServerFn(createFormTestLinkFn)
  const [links, setLinks] = useState<Link[]>([])
  const mut = useMutation({
    mutationFn: (variant: 'A' | 'B' | 'C') => create({ data: { variant } }),
    onSuccess: (link) => setLinks((prev) => [link as Link, ...prev]),
    onError: (err: any) => toast.error(err?.message ?? 'Testlink aanmaken mislukt'),
  })

  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle>Formuliertest (testlink)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-muted-foreground">
          Een testlink is 30 minuten geldig en geeft precies één aanvraag. Die wordt vóór opslag als test gemarkeerd:
          alleen de TEST-groep krijgt een melding, geen klant- of eigenaarsmail, geen Google-export. Open elke link in
          een volledig nieuw browserprofiel.
        </p>
        <div className="flex flex-wrap gap-2">
          {(['A', 'B', 'C'] as const).map((v) => (
            <Button key={v} size="sm" variant="outline" disabled={mut.isPending} onClick={() => mut.mutate(v)}>
              Testlink {v}
            </Button>
          ))}
        </div>
        {links.map((link) => (
          <div key={link.url} className="space-y-1 rounded-lg border border-border p-2">
            <p className="font-bold">{link.label}</p>
            <p className="break-all font-mono text-[12px]">{link.url}</p>
            <p className="text-[12px] text-muted-foreground">
              Verloopt {new Date(link.expiresAt).toLocaleTimeString('nl-NL', { timeZone: 'Europe/Amsterdam' })}
              {link.gclid ? ` · fictief klik-id ${link.gclid}` : ''}
            </p>
            <Button size="sm" variant="ghost" onClick={() => navigator.clipboard?.writeText(link.url)}>
              Kopiëren
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
