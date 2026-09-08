import * as React from 'react'
import { Body, Container, Head, Html, Preview, Section, Text } from '@react-email/components'
import { business } from '@/lib/business'
import type { TemplateEntry } from './registry'

interface Props {
  company?: string
  name?: string
  phone?: string
  email?: string
  kvk?: string
  vat?: string
  areas?: string
  radius?: string
  specialties?: string
  availability?: string
  certifications?: string
  insurance?: string
}

const border = '#E5E7EB'
const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { margin: '0 auto', padding: '24px 20px', maxWidth: '600px' }
const row = { fontSize: '14px', margin: '6px 0 0 0' }

const Email = (p: Props) => (
  <Html lang="nl" dir="ltr">
    <Head>
      <meta name="color-scheme" content="light only" />
    </Head>
    <Preview>Nieuwe ZZP-aanmelding</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={{ fontSize: '18px', fontWeight: 700 }}>Nieuwe ZZP-aanmelding</Text>
        <Section
          style={{
            border: `1px solid ${border}`,
            borderRadius: '8px',
            padding: '16px 20px',
            marginTop: '12px',
          }}
        >
          <Text style={{ ...row, marginTop: 0 }}>
            <strong>Bedrijf:</strong> {p.company}
          </Text>
          <Text style={row}>
            <strong>Contactpersoon:</strong> {p.name}
          </Text>
          <Text style={row}>
            <strong>Telefoon:</strong> {p.phone}
          </Text>
          <Text style={row}>
            <strong>E-mail:</strong> {p.email}
          </Text>
          <Text style={row}>
            <strong>KvK:</strong> {p.kvk} · <strong>Btw:</strong> {p.vat}
          </Text>
          <Text style={row}>
            <strong>Werkgebied:</strong> {p.areas} ({p.radius})
          </Text>
          <Text style={row}>
            <strong>Specialismen:</strong> {p.specialties}
          </Text>
          <Text style={row}>
            <strong>Beschikbaarheid:</strong> {p.availability}
          </Text>
          <Text style={row}>
            <strong>Certificeringen:</strong> {p.certifications}
          </Text>
          <Text style={row}>
            <strong>Verzekering:</strong> {p.insurance}
          </Text>
        </Section>
        <Text style={{ fontSize: '12px', color: '#6B7280', marginTop: '12px' }}>
          Beoordeel deze aanmelding in de VoltFix backoffice.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) => `Nieuwe ZZP-aanmelding — ${data.company}`,
  displayName: 'ZZP-aanmelding melding (VoltFix)',
  to: business.email,
  previewData: {
    company: 'Elektro Jansen VOF',
    name: 'Peter Jansen',
    phone: '06 12345678',
    email: 'peter@elektrojansen.nl',
    kvk: '12345678',
    vat: 'NL001234567B01',
    areas: 'Amsterdam, Amstelveen',
    radius: '25 km',
    specialties: 'Groepenkast, laadpaal',
    availability: 'Maandag t/m vrijdag overdag',
    certifications: 'NEN 3140, VCA',
    insurance: 'Interpolis — 998877',
  },
} satisfies TemplateEntry
