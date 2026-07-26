import * as React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
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
const LOGO_URL =
  'https://www.voltfix.nl/__l5e/assets-v1/688e14d6-58b1-4e9f-a2a9-4948316065fd/voltfix-email-logo.png'

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { margin: '0 auto', padding: '24px 20px', maxWidth: '600px' }
const box = {
  border: `1px solid ${border}`,
  borderRadius: '8px',
  padding: '16px 20px',
  marginTop: '16px',
}
const row = { margin: '4px 0', fontSize: '14px', color: '#111827' }
const label = {
  color: '#6B7280',
  fontSize: '12px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
}
const button = {
  display: 'inline-block',
  backgroundColor: brand,
  color: '#ffffff',
  padding: '12px 22px',
  borderRadius: '6px',
  textDecoration: 'none',
  fontWeight: 700,
  marginRight: '8px',
  fontSize: '15px',
}

// Short preview to make notifications scannable in the inbox
const scannablePreview = (
  jobType?: string,
  postalCode?: string,
  name?: string,
) => {
  const parts = [
    jobType ? jobType : 'Aanvraag',
    postalCode ? postalCode : '',
    name ? `· ${name}` : '',
  ].filter(Boolean)
  return parts.join(' · ')
}

const buildWhatsAppMessage = (name?: string, jobType?: string) => {
  const greet = name ? `Hoi ${name.split(' ')[0]}` : 'Hoi'
  const topic = jobType ? `over uw aanvraag (${jobType})` : 'over uw aanvraag'
  return `${greet}, u spreekt met VoltFix — ik bel/app u ${topic}. Wanneer schikt het?`
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
  const waHref = waNumber
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent(buildWhatsAppMessage(name, jobType))}`
    : '#'
  const mapsHref = postalCode
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(postalCode + ' Amsterdam')}`
    : '#'

  return (
    <Html lang="nl" dir="ltr">
      <Head>
        <meta name="color-scheme" content="light only" />
        <meta name="supported-color-schemes" content="light only" />
      </Head>
      <Preview>{scannablePreview(jobType, postalCode, name)}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header met logo */}
          <Section
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'center' as const,
              border: `1px solid ${border}`,
            }}
          >
            <Img
              src={LOGO_URL}
              width="150"
              height="50"
              alt="VoltFix"
              style={{ margin: '0 auto', display: 'block' }}
            />
            <Text
              style={{
                margin: '10px 0 0 0',
                fontSize: '13px',
                color: brand,
                fontWeight: 700,
                letterSpacing: '0.5px',
              }}
            >
              ⚡ NIEUWE AANVRAAG · {scannablePreview(jobType, postalCode)}
            </Text>
          </Section>

          {/* Quick actions - direct bovenaan voor 1-tap response */}
          <Section style={{ textAlign: 'center' as const, marginTop: '16px' }}>
            {phone && (
              <Link href={telHref} style={button}>
                📞 Bel klant
              </Link>
            )}
            {waNumber && (
              <Link href={waHref} style={{ ...button, backgroundColor: '#25D366' }}>
                💬 WhatsApp
              </Link>
            )}
          </Section>

          {/* Klantgegevens */}
          <Section style={box}>
            <Text style={label}>Klant</Text>
            <Text style={{ ...row, fontSize: '17px', fontWeight: 700 }}>{name ?? '—'}</Text>

            <Text style={label}>Telefoon</Text>
            <Text style={row}>
              <Link href={telHref} style={{ color: brand, fontWeight: 700 }}>
                {phone ?? '—'}
              </Link>
              {waNumber && (
                <>
                  {' · '}
                  <Link href={waHref} style={{ color: '#25D366', fontWeight: 700 }}>
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
            <Text style={row}>
              {postalCode ?? '—'}
              {postalCode && (
                <>
                  {' · '}
                  <Link href={mapsHref} style={{ color: brand }}>
                    Open in Maps
                  </Link>
                </>
              )}
            </Text>

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

          <Hr style={{ margin: '24px 0 12px', borderColor: border }} />
          <Text style={{ fontSize: '11px', color: '#9CA3AF', textAlign: 'center' as const }}>
            Automatische notificatie via voltfix.nl · {submittedAt ?? new Date().toISOString()}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

// Actiegericht onderwerp: [klus · postcode] Naam — voorkeur
const buildSubject = (data: Record<string, any>) => {
  const job = data.jobType ?? 'aanvraag'
  const postal = data.postalCode ? ` · ${data.postalCode}` : ''
  const name = data.name ? ` — ${data.name}` : ''
  // Extract "Ingeplande voorkeur: ..." line uit message indien aanwezig
  const msg: string = data.message ?? ''
  const prefMatch = msg.match(/Ingeplande voorkeur:\s*([^\n📍]+)/i)
  const pref = prefMatch ? ` · ${prefMatch[1].trim()}` : ''
  return `⚡ [${job}${postal}]${name}${pref}`.slice(0, 140)
}

export const template = {
  component: Email,
  subject: buildSubject,
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
