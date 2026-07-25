import * as React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  name?: string
  phone?: string
  email?: string
  postalCode?: string
  jobType?: string
  message?: string
  locale?: string
  sourcePath?: string
  attachments?: Array<{ url: string; filename: string }>
  submittedAt?: string
}

const brand = '#3A0CA3'
const accent = '#FFF275'
const border = '#E5E7EB'

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { margin: '0 auto', padding: '24px 20px', maxWidth: '600px' }
const box = {
  border: `1px solid ${border}`,
  borderRadius: '8px',
  padding: '16px 20px',
  marginTop: '16px',
}
const row = { margin: '4px 0', fontSize: '14px', color: '#111827' }
const label = { color: '#6B7280', fontSize: '12px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }
const button = {
  display: 'inline-block',
  backgroundColor: brand,
  color: '#ffffff',
  padding: '10px 18px',
  borderRadius: '6px',
  textDecoration: 'none',
  fontWeight: 700,
  marginRight: '8px',
  marginTop: '8px',
}

const Email = ({
  name,
  phone,
  email,
  postalCode,
  jobType,
  message,
  locale,
  sourcePath,
  attachments = [],
  submittedAt,
}: Props) => {
  const telHref = phone ? `tel:${phone.replace(/[^\d+]/g, '')}` : '#'
  const mailHref = email ? `mailto:${email}` : '#'
  const waNumber = phone ? phone.replace(/[^\d]/g, '') : ''
  const waHref = waNumber ? `https://wa.me/${waNumber}` : '#'

  return (
    <Html lang="nl" dir="ltr">
      <Head />
      <Preview>Nieuwe offerte-aanvraag van {name ?? 'onbekend'}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section
            style={{
              backgroundColor: brand,
              borderRadius: '8px',
              padding: '18px 20px',
            }}
          >
            <Heading style={{ color: '#ffffff', margin: 0, fontSize: '20px' }}>
              ⚡ Nieuwe offerte-aanvraag
            </Heading>
            <Text style={{ color: accent, margin: '6px 0 0 0', fontSize: '13px' }}>
              VoltFix · {submittedAt ?? new Date().toISOString()}
            </Text>
          </Section>

          <Section style={box}>
            <Text style={label}>Klant</Text>
            <Text style={{ ...row, fontSize: '16px', fontWeight: 700 }}>{name ?? '—'}</Text>

            <Text style={label}>Telefoon</Text>
            <Text style={row}>
              <Link href={telHref} style={{ color: brand }}>
                {phone ?? '—'}
              </Link>
              {waNumber && (
                <>
                  {' · '}
                  <Link href={waHref} style={{ color: '#25D366' }}>
                    WhatsApp
                  </Link>
                </>
              )}
            </Text>

            <Text style={label}>E-mail</Text>
            <Text style={row}>
              <Link href={mailHref} style={{ color: brand }}>
                {email ?? '—'}
              </Link>
            </Text>

            <Text style={label}>Postcode</Text>
            <Text style={row}>{postalCode ?? '—'}</Text>

            <Text style={label}>Soort klus</Text>
            <Text style={row}>{jobType ?? '—'}</Text>

            {message && (
              <>
                <Text style={label}>Bericht</Text>
                <Text style={{ ...row, whiteSpace: 'pre-wrap' as const }}>{message}</Text>
              </>
            )}

            {sourcePath && (
              <>
                <Text style={label}>Herkomst</Text>
                <Text style={row}>
                  {sourcePath} ({locale ?? 'nl'})
                </Text>
              </>
            )}
          </Section>

          {attachments.length > 0 && (
            <Section style={box}>
              <Text style={label}>Bijlagen ({attachments.length})</Text>
              <Text style={{ ...row, color: '#6B7280', fontSize: '12px' }}>
                Foto's van de klant. Links zijn 7 dagen geldig.
              </Text>
              {attachments.map((a, i) => (
                <Text key={i} style={row}>
                  📎{' '}
                  <Link href={a.url} style={{ color: brand }}>
                    {a.filename}
                  </Link>
                </Text>
              ))}
            </Section>
          )}

          <Section style={{ textAlign: 'center' as const, marginTop: '20px' }}>
            {phone && (
              <Link href={telHref} style={button}>
                Bel klant
              </Link>
            )}
            {waNumber && (
              <Link href={waHref} style={{ ...button, backgroundColor: '#25D366' }}>
                WhatsApp
              </Link>
            )}
          </Section>

          <Hr style={{ margin: '24px 0', borderColor: border }} />
          <Text style={{ fontSize: '12px', color: '#6B7280', textAlign: 'center' as const }}>
            Automatische notificatie via voltfix.nl — reageer direct op {email ?? 'de klant'}.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    `⚡ Nieuwe aanvraag: ${data.jobType ?? 'offerte'} — ${data.name ?? ''}`.trim(),
  displayName: 'Offerte-aanvraag (notificatie)',
  to: 'info@voltfix.nl',
  previewData: {
    name: 'Jan de Vries',
    phone: '06 45 19 35 89',
    email: 'jan@example.com',
    postalCode: '1053 MV',
    jobType: 'Groepenkast vervangen',
    message: 'Meterkast is oud, graag een offerte voor vervanging.',
    locale: 'nl',
    sourcePath: '/contact',
    submittedAt: new Date().toISOString(),
    attachments: [
      { url: 'https://example.com/photo1.jpg', filename: 'meterkast-1.jpg' },
      { url: 'https://example.com/photo2.jpg', filename: 'meterkast-2.jpg' },
    ],
  },
} satisfies TemplateEntry
