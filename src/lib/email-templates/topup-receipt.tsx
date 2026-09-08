import * as React from 'react'
import { Body, Container, Head, Hr, Html, Preview, Section, Text } from '@react-email/components'
import { business } from '@/lib/business'
import type { TemplateEntry } from './registry'

interface Props {
  name?: string
  amount?: string
  newBalance?: string
  paymentRef?: string
  date?: string
}

const border = '#E5E7EB'
const brand = '#3A0CA3'
const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { margin: '0 auto', padding: '24px 20px', maxWidth: '600px' }
const box = {
  border: `1px solid ${border}`,
  borderRadius: '8px',
  padding: '16px 20px',
  marginTop: '16px',
}

const Email = ({ name, amount, newBalance, paymentRef, date }: Props) => (
  <Html lang="nl" dir="ltr">
    <Head>
      <meta name="color-scheme" content="light only" />
    </Head>
    <Preview>Betaling ontvangen — je VoltFix leadtegoed is bijgewerkt.</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={{ fontSize: '18px', fontWeight: 700, color: brand }}>
          Betaling ontvangen
        </Text>
        <Text style={{ fontSize: '15px', color: '#374151' }}>
          Hallo {name || 'daar'}, we hebben je opwaardering ontvangen en je leadtegoed is direct
          bijgewerkt.
        </Text>
        <Section style={box}>
          <Text style={{ fontSize: '14px', margin: 0 }}>
            <strong>Bedrag:</strong> {amount}
          </Text>
          <Text style={{ fontSize: '14px', margin: '6px 0 0 0' }}>
            <strong>Nieuw saldo:</strong> {newBalance}
          </Text>
          {date && (
            <Text style={{ fontSize: '14px', margin: '6px 0 0 0' }}>
              <strong>Datum:</strong> {date}
            </Text>
          )}
          {paymentRef && (
            <Text style={{ fontSize: '12px', color: '#6B7280', margin: '10px 0 0 0' }}>
              Betalingsreferentie: {paymentRef}
            </Text>
          )}
        </Section>
        <Text style={{ fontSize: '13px', color: '#6B7280', marginTop: '16px' }}>
          Dit overzicht dient als betaalbevestiging. Vraag je een btw-factuur? Antwoord op deze
          e-mail.
        </Text>
        <Hr style={{ margin: '28px 0 12px', borderColor: border }} />
        <Text style={{ fontSize: '11px', color: '#9CA3AF', textAlign: 'center' as const }}>
          VoltFix · {business.streetAddress}, {business.postalCode} {business.city} · KvK{' '}
          {business.kvk}
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) => `Betaling ontvangen — ${data.amount} leadtegoed · VoltFix`,
  displayName: 'Opwaardering bevestiging (ZZP)',
  previewData: {
    name: 'Hassan',
    amount: '€100,00',
    newBalance: '€180,00',
    paymentRef: 'cs_test_123',
    date: '8 september 2026',
  },
} satisfies TemplateEntry
