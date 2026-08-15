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
import { business, whatsappNumber } from '@/lib/business'
import type { TemplateEntry } from './registry'

interface Props {
  name?: string
  jobType?: string
  message?: string
  postalCode?: string
  attachmentsCount?: number
  locale?: string
  appointmentDate?: string
  appointmentSlot?: string
  appointmentNote?: string
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
  appointmentTitle: string
  appointmentDateLabel: string
  appointmentSlotLabel: string
  appointmentDisclaimer: string
}

const NL: Strings = {
  preview:
    'We reageren zo snel mogelijk op werkdagen. Bij spoed binnen 60 minuten in heel Amsterdam.',
  hi: (n) => `Hallo ${n || 'daar'},`,
  intro:
    'Bedankt voor uw aanvraag bij VoltFix. We reageren zo snel mogelijk op werkdagen. Is het spoed? Dan staan we binnen 60 minuten bij u voor de deur in heel Amsterdam.',
  stepsTitle: 'Wat gebeurt er nu?',
  steps: [
    { title: '1. We bellen of appen u terug', body: 'Zo snel mogelijk op werkdagen.' },
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
  call: `Bel ${business.phoneDisplay}`,
  whatsapp: 'WhatsApp',
  footer: `VoltFix · ${business.streetAddress}, ${business.postalCode} ${business.city} · KvK ${business.kvk}`,
  subject: 'We hebben uw aanvraag — reactie zsm · VoltFix',
  appointmentTitle: 'Uw gekozen aankomsttijd',
  appointmentDateLabel: 'Datum',
  appointmentSlotLabel: 'Aankomst tussen',
  appointmentDisclaimer:
    'We bevestigen dit tijdslot zsm per WhatsApp of telefoon. Onder voorbehoud van definitieve bevestiging.',
}

const EN: Strings = {
  preview:
    'We respond as soon as possible on business days. Emergency? On-site within 60 minutes anywhere in Amsterdam.',
  hi: (n) => `Hi ${n || 'there'},`,
  intro:
    'Thanks for your request to VoltFix. We respond as soon as possible on business days. Emergency? We are on-site within 60 minutes anywhere in Amsterdam.',
  stepsTitle: 'What happens next?',
  steps: [
    { title: '1. We call or WhatsApp you', body: 'As soon as possible on business days.' },
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
  call: `Call ${business.phoneInternational}`,
  whatsapp: 'WhatsApp',
  footer: `VoltFix · ${business.streetAddress}, ${business.postalCode} ${business.city} · KvK ${business.kvk}`,
  subject: 'We got your request — response asap · VoltFix',
  appointmentTitle: 'Your chosen arrival time',
  appointmentDateLabel: 'Date',
  appointmentSlotLabel: 'Arrival between',
  appointmentDisclaimer:
    'We confirm this slot asap by WhatsApp or phone. Subject to final confirmation.',
}

const Email = ({
  name,
  jobType,
  message,
  postalCode,
  attachmentsCount = 0,
  locale,
  appointmentDate,
  appointmentSlot,
  appointmentNote,
}: Props) => {
  const s = locale === 'en' ? EN : NL
  const hasAppointment = Boolean(appointmentDate || appointmentSlot)
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

          {hasAppointment && (
            <Section
              style={{
                ...box,
                backgroundColor: '#ECFDF5',
                borderColor: '#A7F3D0',
              }}
            >
              <Text
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  margin: 0,
                  color: '#065F46',
                }}
              >
                📅 {s.appointmentTitle}
              </Text>
              {appointmentDate && (
                <Text style={{ fontSize: '15px', margin: '10px 0 0 0', color: '#064E3B' }}>
                  <strong>{s.appointmentDateLabel}:</strong> {appointmentDate}
                </Text>
              )}
              {appointmentSlot && (
                <Text style={{ fontSize: '18px', fontWeight: 700, margin: '4px 0 0 0', color: '#065F46' }}>
                  <strong>{s.appointmentSlotLabel}:</strong> {appointmentSlot}
                </Text>
              )}
              {appointmentNote && (
                <Text style={{ fontSize: '13px', margin: '4px 0 0 0', color: '#047857' }}>
                  {appointmentNote}
                </Text>
              )}
              <Text style={{ fontSize: '12px', margin: '10px 0 0 0', color: '#065F46', fontStyle: 'italic' as const }}>
                {s.appointmentDisclaimer}
              </Text>
            </Section>
          )}


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
            <Link href={`tel:${business.phoneE164}`} style={button}>
              {s.call}
            </Link>
            <Link href={`https://wa.me/${whatsappNumber}`} style={buttonAlt}>
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
  subject: (data: Record<string, any>) => {
    const isEn = data.locale === 'en'
    if (data.appointmentSlot) {
      const dateTxt = data.appointmentDate ? ` ${data.appointmentDate}` : ''
      return isEn
        ? `Appointment received — arrival${dateTxt} · ${data.appointmentSlot} · VoltFix`
        : `Afspraak ontvangen — aankomst${dateTxt} · ${data.appointmentSlot} · VoltFix`
    }
    return isEn
      ? 'We got your request — response asap · VoltFix'
      : 'We hebben uw aanvraag — reactie zsm · VoltFix'
  },
  displayName: 'Offerte-bevestiging (klant)',
  previewData: {
    name: 'Jan',
    jobType: 'Afspraak · perilex',
    postalCode: '1053 MV',
    message: 'Meterkast is oud, graag een offerte voor vervanging.',
    attachmentsCount: 0,
    locale: 'nl',
    appointmentDate: 'Morgen 12 nov (2026-11-12)',
    appointmentSlot: '14:00 – 15:00',
    appointmentNote: 'Aankomst in dit uur',
  },
} satisfies TemplateEntry
