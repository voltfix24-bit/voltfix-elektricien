import { Body, Container, Head, Html, Link, Preview, Text } from '@react-email/components'
import { business } from '@/lib/business'
import type { TemplateEntry } from './registry'

function OverdueLead({ jobType, city, leadId, hours }: { jobType?: string; city?: string; leadId?: string; hours?: number }) {
  return <Html lang="nl"><Head /><Preview>Lead nog niet opgepakt</Preview><Body><Container>
    <Text><strong>VoltFix — lead nog niet opgepakt</strong></Text>
    <Text>{jobType}{city ? ` · ${city}` : ''}</Text>
    <Text>Deze lead is langer dan {hours} uur geleden doorgestuurd en was bij de controle nog niet geclaimd.</Text>
    <Text>Referentie: {leadId}</Text>
    <Link href="https://www.voltfix.nl/admin/leads">Open het leadoverzicht</Link>
  </Container></Body></Html>
}

export const template = {
  component: OverdueLead,
  subject: 'VoltFix — doorgestuurde lead nog niet opgepakt',
  displayName: 'Ongeclaimde lead (beheerder)',
  to: business.email,
  previewData: { jobType: 'Storing / geen stroom', city: 'Amsterdam', leadId: 'Voorbeeld', hours: 1 },
} satisfies TemplateEntry