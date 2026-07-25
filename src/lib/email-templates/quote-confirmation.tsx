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
  jobType?: string
  message?: string
  postalCode?: string
  attachmentsCount?: number
  locale?: string
}

const brand = '#3A0CA3'
const border = '#E5E7EB'

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { margin: '0 auto', padding: '24px 20px', maxWidth: '600px' }
const box = {
  border: `1px solid ${border}`,
  borderRadius: '8px',
  padding: '16px 20px',
  marginTop: '16px',
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
  marginTop: '8px',
}
const buttonAlt = { ...button, backgroundColor: '#25D366' }

type Strings = {
  preview: string
  hi: (name: string) => string
  intro: string
  summaryTitle: string
  jobLabel: string
  postalLabel: string
  messageLabel: string
  attachLabel: (n: number) => string
  ctaTitle: string
  ctaText: string
  call: string
  whatsapp: string
  footer: string
  subject: string
}

const NL: Strings = {
  preview: 'Bedankt voor uw aanvraag bij VoltFix — we nemen zo snel mogelijk contact op.',
  hi: (n) => `Hallo ${n || 'daar'},`,
  intro:
    'Bedankt voor uw aanvraag bij VoltFix. We hebben uw bericht ontvangen en nemen zo snel mogelijk contact met u op — meestal binnen enkele uren op werkdagen.',
  summaryTitle: 'Overzicht van uw aanvraag',
  jobLabel: 'Soort klus',
  postalLabel: 'Postcode',
  messageLabel: 'Bericht',
  attachLabel: (n) => `${n} foto${n === 1 ? '' : "'s"} meegestuurd`,
  ctaTitle: 'Spoed?',
  ctaText: 'Bel of app ons direct — 24/7 bereikbaar voor spoedstoringen.',
  call: 'Bel 06 45 19 35 89',
  whatsapp: 'WhatsApp',
  footer: 'VoltFix Elektrotechniek · Jacob van Lennepkade 142, 1053 MV Amsterdam · KvK 91447127',
  subject: 'Bedankt voor uw aanvraag — VoltFix',
}

const EN: Strings = {
  preview: 'Thanks for your request to VoltFix — we will contact you as soon as possible.',
  hi: (n) => `Hi ${n || 'there'},`,
  intro:
    'Thanks for your request to VoltFix. We received your message and will get back to you as soon as possible — usually within a few hours on business days.',
  summaryTitle: 'Summary of your request',
  jobLabel: 'Job type',
  postalLabel: 'Postal code',
  messageLabel: 'Message',
  attachLabel: (n) => `${n} photo${n === 1 ? '' : 's'} attached`,
  ctaTitle: 'Emergency?',
  ctaText: 'Call or WhatsApp us directly — available 24/7 for emergencies.',
  call: 'Call +31 6 86 30 21 48',
  whatsapp: 'WhatsApp',
  footer: 'VoltFix Elektrotechniek · Jacob van Lennepkade 142, 1053 MV Amsterdam · KvK 91447127',
  subject: 'Thanks for your request — VoltFix',
}

const Email = ({
  name,
  jobType,
  message,
  postalCode,
  attachmentsCount = 0,
  locale,
}: Props) => {
  const s = locale === 'en' ? EN : NL
  return (
    <Html lang={locale === 'en' ? 'en' : 'nl'} dir="ltr">
      <Head />
      <Preview>{s.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section
            style={{
              backgroundColor: brand,
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center' as const,
            }}
          >
            <Heading style={{ color: '#ffffff', margin: 0, fontSize: '24px' }}>
              VoltFix ⚡
            </Heading>
          </Section>

          <Section style={{ padding: '20px 4px' }}>
            <Text style={{ fontSize: '16px', color: '#111827' }}>{s.hi(name ?? '')}</Text>
            <Text style={{ fontSize: '15px', color: '#374151', lineHeight: '1.55' }}>
              {s.intro}
            </Text>
          </Section>

          <Section style={box}>
            <Text style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>{s.summaryTitle}</Text>
            {jobType && (
              <Text style={{ fontSize: '14px', margin: '10px 0 0 0' }}>
                <strong>{s.jobLabel}:</strong> {jobType}
              </Text>
            )}
            {postalCode && (
              <Text style={{ fontSize: '14px', margin: '6px 0 0 0' }}>
                <strong>{s.postalLabel}:</strong> {postalCode}
              </Text>
            )}
            {message && (
              <Text style={{ fontSize: '14px', margin: '6px 0 0 0', whiteSpace: 'pre-wrap' as const }}>
                <strong>{s.messageLabel}:</strong> {message}
              </Text>
            )}
            {attachmentsCount > 0 && (
              <Text style={{ fontSize: '13px', color: '#6B7280', margin: '10px 0 0 0' }}>
                📎 {s.attachLabel(attachmentsCount)}
              </Text>
            )}
          </Section>

          <Section
            style={{
              ...box,
              backgroundColor: '#FFF7ED',
              borderColor: '#FED7AA',
              textAlign: 'center' as const,
            }}
          >
            <Text style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#9A3412' }}>
              {s.ctaTitle}
            </Text>
            <Text style={{ fontSize: '14px', margin: '6px 0 10px 0', color: '#7C2D12' }}>
              {s.ctaText}
            </Text>
            <Link href="tel:+31645193589" style={button}>
              {s.call}
            </Link>
            <Link href="https://wa.me/31686302148" style={buttonAlt}>
              {s.whatsapp}
            </Link>
          </Section>

          <Hr style={{ margin: '28px 0 12px', borderColor: border }} />
          <Text style={{ fontSize: '11px', color: '#9CA3AF', textAlign: 'center' as const }}>
            {s.footer}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    data.locale === 'en'
      ? 'Thanks for your request — VoltFix'
      : 'Bedankt voor uw aanvraag — VoltFix',
  displayName: 'Offerte-bevestiging (klant)',
  previewData: {
    name: 'Jan',
    jobType: 'Groepenkast vervangen',
    postalCode: '1053 MV',
    message: 'Meterkast is oud, graag een offerte voor vervanging.',
    attachmentsCount: 2,
    locale: 'nl',
  },
} satisfies TemplateEntry
