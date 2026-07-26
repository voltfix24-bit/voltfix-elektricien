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
  jobType?: string
  message?: string
  postalCode?: string
  attachmentsCount?: number
  locale?: string
}

const brand = '#3A0CA3'
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

type Step = { title: string; body: string }
type Strings = {
  preview: string
  hi: (name: string) => string
  intro: string
  stepsTitle: string
  steps: Step[]
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
  preview:
    'We reageren binnen 15 minuten op werkdagen. Bij spoed binnen 60 minuten in heel Amsterdam.',
  hi: (n) => `Hallo ${n || 'daar'},`,
  intro:
    'Bedankt voor uw aanvraag bij VoltFix. We reageren binnen 15 minuten op werkdagen. Is het spoed? Dan staan we binnen 60 minuten bij u voor de deur in heel Amsterdam.',
  stepsTitle: 'Wat gebeurt er nu?',
  steps: [
    { title: '1. We bellen of appen u terug', body: 'Binnen 15 minuten op werkdagen.' },
    { title: '2. We plannen samen een moment', body: 'U kiest dag én tijd die u uitkomt.' },
    {
      title: '3. Vaste prijs vooraf',
      body: 'Nooit een verrassing op de factuur. Loopt het uit? U hoort het eerst.',
    },
  ],
  summaryTitle: 'Overzicht van uw aanvraag',
  jobLabel: 'Soort klus',
  postalLabel: 'Postcode',
  messageLabel: 'Bericht',
  attachLabel: (n) => `${n} foto${n === 1 ? '' : "'s"} meegestuurd`,
  ctaTitle: 'Kan niet wachten?',
  ctaText: 'Bel of app ons direct — bij spoed binnen 60 minuten in heel Amsterdam.',
  call: 'Bel 06 45 19 35 89',
  whatsapp: 'WhatsApp',
  footer: 'VoltFix Elektrotechniek · Jacob van Lennepkade 142, 1053 MV Amsterdam · KvK 91447127',
  subject: 'We hebben uw aanvraag — reactie binnen 15 min · VoltFix',
}

const EN: Strings = {
  preview:
    'We respond within 15 minutes on business days. Emergency? On-site within 60 minutes anywhere in Amsterdam.',
  hi: (n) => `Hi ${n || 'there'},`,
  intro:
    'Thanks for your request to VoltFix. We respond within 15 minutes on business days. Emergency? We are on-site within 60 minutes anywhere in Amsterdam.',
  stepsTitle: 'What happens next?',
  steps: [
    { title: '1. We call or WhatsApp you', body: 'Within 15 minutes on business days.' },
    { title: '2. We plan a time together', body: 'You pick the day and time that works for you.' },
    {
      title: '3. Fixed price up front',
      body: 'No surprises on the invoice. If it takes longer, you hear first.',
    },
  ],
  summaryTitle: 'Summary of your request',
  jobLabel: 'Job type',
  postalLabel: 'Postal code',
  messageLabel: 'Message',
  attachLabel: (n) => `${n} photo${n === 1 ? '' : 's'} attached`,
  ctaTitle: 'Can’t wait?',
  ctaText: 'Call or WhatsApp us directly — on-site within 60 minutes for emergencies.',
  call: 'Call +31 6 45 19 35 89',
  whatsapp: 'WhatsApp',
  footer: 'VoltFix Elektrotechniek · Jacob van Lennepkade 142, 1053 MV Amsterdam · KvK 91447127',
  subject: 'We got your request — response within 15 min · VoltFix',
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
      <Head>
        <meta name="color-scheme" content="light only" />
        <meta name="supported-color-schemes" content="light only" />
      </Head>
      <Preview>{s.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              padding: '20px 16px',
              textAlign: 'center' as const,
              border: `1px solid ${border}`,
            }}
          >
            <Img
              src={LOGO_URL}
              width="180"
              height="60"
              alt="VoltFix"
              style={{ margin: '0 auto', display: 'block' }}
            />
          </Section>

          <Section style={{ padding: '20px 4px' }}>
            <Text style={{ fontSize: '16px', color: '#111827' }}>{s.hi(name ?? '')}</Text>
            <Text style={{ fontSize: '15px', color: '#374151', lineHeight: '1.55' }}>
              {s.intro}
            </Text>
          </Section>

          <Section
            style={{
              ...box,
              backgroundColor: '#F5F3FF',
              borderColor: '#DDD6FE',
            }}
          >
            <Text
              style={{
                fontSize: '15px',
                fontWeight: 700,
                margin: '0 0 8px 0',
                color: brand,
              }}
            >
              {s.stepsTitle}
            </Text>
            {s.steps.map((st, i) => (
              <div key={i} style={{ marginTop: i === 0 ? 0 : '10px' }}>
                <Text
                  style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    margin: 0,
                    color: '#111827',
                  }}
                >
                  {st.title}
                </Text>
                <Text style={{ fontSize: '13px', margin: '2px 0 0 0', color: '#4B5563' }}>
                  {st.body}
                </Text>
              </div>
            ))}
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
      ? 'We got your request — response asap · VoltFix'
      : 'We hebben uw aanvraag — reactie zsm · VoltFix',
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
