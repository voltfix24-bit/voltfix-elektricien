// Tijdelijke end-to-end test: verstuurt één testmail naar het eigen adres.
import { sendTemplateEmail } from '../src/lib/email-templates/send-email'

const result = await sendTemplateEmail('quote-notification', 'info@voltfix.nl', {
  idempotencyKey: `test-email-setup-${Date.now()}`,
  templateData: {
    name: 'Test (e-mailkanaal-controle)',
    phone: '06 12 34 56 78',
    email: 'klant@example.com',
    postalCode: '1053 MV',
    jobType: 'Controle e-mailkanaal',
    message: 'Dit is een testmail om te bevestigen dat de e-mailmeldingen werken. Deze mag je negeren.',
    locale: 'nl',
    sourcePath: '/test',
    submittedAt: new Date().toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' }),
    attachments: [],
  },
})
console.log('RESULT:', JSON.stringify(result))
