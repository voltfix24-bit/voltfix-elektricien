import * as React from 'react'
import { Body, Container, Head, Html, Preview, Section, Text } from '@react-email/components'
import { business } from '@/lib/business'
import type { TemplateEntry } from './registry'

interface Props {
  name?: string
  amount?: string
  newBalance?: string
  paymentRef?: string
}

const border = '#E5E7EB'
const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { margin: '0 auto', padding: '24px 20px', maxWidth: '600px' }

const Email = ({ name, amount, newBalance, paymentRef }: Props) => (
  <Html lang="nl" dir="ltr">
    <Head>
      <meta name="color-scheme" content="light only" />
    </Head>
    <Preview>Nieuwe opwaardering leadtegoed</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={{ fontSize: '18px', fontWeight: 700 }}>Nieuwe opwaardering</Text>
        <Section
          style={{
            border: `1px solid ${border}`,
            borderRadius: '8px',
            padding: '16px 20px',
            marginTop: '12px',
          }}
        >
          <Text style={{ fontSize: '14px', margin: 0 }}>
            <strong>ZZP'er:</strong> {name}
          </Text>
          <Text style={{ fontSize: '14px', margin: '6px 0 0 0' }}>
            <strong>Bedrag:</strong> {amount}
          </Text>
          <Text style={{ fontSize: '14px', margin: '6px 0 0 0' }}>
            <strong>Nieuw saldo:</strong> {newBalance}
          </Text>
          {paymentRef && (
            <Text style={{ fontSize: '12px', color: '#6B7280', margin: '10px 0 0 0' }}>
              {paymentRef}
            </Text>
          )}
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) => `Opwaardering ${data.amount} — ${data.name}`,
  displayName: 'Opwaardering melding (VoltFix)',
  to: business.email,
  previewData: {
    name: 'Hassan',
    amount: '€100,00',
    newBalance: '€180,00',
    paymentRef: 'cs_test_123',
  },
} satisfies TemplateEntry
