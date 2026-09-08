# Website-aanvragen automatisch naar Telegram

Elke aanvraag die iemand op de site achterlaat, wordt voortaan automatisch een lead in de backoffice én verschijnt meteen in de Telegram-groep met een claim-knop. Bevestigingsmails naar jou en de klant blijven precies zoals ze nu zijn.

## Wat de bezoeker merkt

- Dezelfde formulieren (offerte/contact en de afspraakplanner), maar met strengere controle: naam, telefoon, plaats/postcode en omschrijving zijn verplicht en het telefoonnummer moet een geldige vorm hebben.
- Na versturen: "Bedankt! Een van onze gecertificeerde monteurs neemt zo snel mogelijk contact met u op."
- Spamachtige berichten (SEO, backlinks, reviews kopen, marketingbureaus, links in de tekst, geblokkeerde landnummers) worden direct geweigerd met een nette melding en komen niet in Telegram.

## Wat er in Telegram gebeurt

- Per nieuwe aanvraag één bericht met klustype, locatie, korte omschrijving en de prijs, plus twee knoppen:
  - `⚡ Accepteer lead (€10)`
  - `⚠️ Markeer als spam`
- Tikt iemand op "Markeer als spam", dan kan de lead niet meer geclaimd worden, het bericht wordt aangepast naar "gemeld als spam" en de lead krijgt in de backoffice de status **spam_review** zodat jij hem kunt nakijken (goedkeuren = opnieuw versturen, of afkeuren).

## Leadprijs

- Introductieprijs **€10** voor alle leads.
- De prijs komt in een instellingenscherm in de backoffice te staan: één standaardprijs plus optioneel een afwijkende prijs voor spoedklussen. Terugzetten naar €20 is straks één veldje wijzigen, geen code-aanpassing.

## Backoffice

- Leadoverzicht toont voortaan ook de herkomst (welk formulier / welke pagina) en de nieuwe status spam_review, met knoppen om zo'n lead alsnog vrij te geven of definitief af te keuren.
- Nieuw tabje voor de leadprijzen.

## Technische uitvoering

1. **Database (migratie)**
   - `leads`: kolommen `source` (tekst, default `website_form`) en `is_urgent` (boolean) toevoegen; statuswaarde `spam_review` toestaan.
   - Nieuwe tabel `lead_settings` (één rij) met `default_price_cents` (1000), `urgent_price_cents`, timestamps; GRANTs + RLS: alleen admins lezen/schrijven, `service_role` volledig.
   - `claim_lead` uitbreiden zodat status `spam_review` en `cancelled` niet claimbaar zijn.
2. **Gedeelde serverhelper** `src/lib/leads-intake.server.ts`: valideert input (Zod), leest de prijs uit `lead_settings`, schrijft de lead met status `new`, verstuurt direct het Telegram-bericht met beide knoppen en slaat `telegram_message_id` op (dezelfde payloadstructuur als de handmatige dispatch in `admin.functions.ts`).
3. **Spamfilter** `src/lib/spam-filter.ts`: trefwoord- en URL-detectie plus de bestaande `isBlockedPhoneRegion`; gebruikt door client (directe feedback) en server (hard block).
4. **Nieuw publiek endpoint** `src/routes/api/public/leads/create.ts` (POST + OPTIONS, Zod-validatie, Turnstile, honeypot, IP-hash) dat de helper aanroept — bedoeld voor externe/eenvoudige JSON-inzendingen.
5. **Bestaande endpoint** `src/routes/api/public/quote-request.ts` blijft de bestaande bijlagen- en e-mailflow doen en roept ná het opslaan van `quote_requests` dezelfde helper aan, zodat contactformulier en afspraakplanner niets dubbels hoeven te posten. Telegram-fouten worden gelogd maar breken de aanvraag niet.
6. **Telegram-webhook** `src/routes/api/public/telegram/webhook.ts`: `spam:<leadId>` callback afhandelen (status naar `spam_review`, bericht bijwerken, bevestiging via `answerCallbackQuery`).
7. **Frontend**: `contact-form.tsx` en `schedule-picker.tsx` krijgen de aangescherpte validatie, spamcheck en de nieuwe bedanktekst (NL + EN-variant).
8. **Admin**: `admin.leads.tsx` uitbreiden met bron/status-filter en spam-acties; nieuwe serverfuncties `getLeadSettings` / `updateLeadSettings` met adminafscherming.

Na afloop: typecheck, `bun run check:contact` en een testaanvraag via het formulier om de Telegram-dispatch te bevestigen.
