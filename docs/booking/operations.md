# Operations: aanvragen vinden en opvolgen

## Waar komt een aanvraag binnen?

1. **Database** `quote_requests` — de duurzame opslag. De klant ziet pas "Aanvraag ontvangen" nadat deze rij bestaat en een ID heeft.
2. **Leads + Telegram** — `createAndDispatchLead()` maakt de lead aan en stuurt hem naar de Telegram-groep, inclusief foto's.
3. **Backoffice** — de beveiligde beheerlijst met filters op dienst, status en datum.

Een mislukte melding wist nooit een opgeslagen aanvraag. Alle e-mailpogingen staan in `email_send_log` met status `sent`, `suppressed` of `failed`.

## Meldingen herstellen

- Het e-maildomein is nog niet ingericht. Nieuwe aanvragen krijgen `notification_status = 'pending'`.
- Zolang dat zo is, is Telegram plus de backoffice de werkende opvolgroute. Vertel klanten niet dat ze een e-mail krijgen.
- Zodra het domein live is: stuur geen stapel oude berichten alsnog uit; verstuur alleen vanaf dat moment.

## Dubbele aanvragen

- Elke verzendpoging draagt een idempotentiesleutel. Een tweede poging met dezelfde inhoud geeft dezelfde aanvraag terug (`duplicate: true`).
- Dezelfde sleutel met andere gegevens geeft HTTP 409; de klant kan daarna gecontroleerd opnieuw versturen.
- Twee aanvragen van hetzelfde telefoonnummer kunnen legitiem zijn. Beoordeel ze handmatig; voeg niets automatisch samen.

## Foto's

- Foto's staan in de private bucket `quote-attachments`; links in meldingen zijn ondertekend en 7 dagen geldig.
- Een lokale preview in de browser is geen bewijs dat VoltFix de foto heeft. Bij twijfel: controleer `attachment_paths` op de aanvraag.

## Storingen

| Situatie | Wat te doen |
| --- | --- |
| Aanvraag zonder foto terwijl "fotocontrole" gekozen is | server weigert dit; bij twijfel klant om foto vragen via WhatsApp |
| Adresopzoeker (PDOK) uit de lucht | de klant kan straat en plaats handmatig invullen; de flow blokkeert niet |
| Turnstile-fout | klant ziet een herstelbare melding; antwoorden blijven staan |
| Telegram-dispatch faalt | de aanvraag blijft in `quote_requests` en in de backoffice staan |

## Wat nog niet automatisch is

- Geen agendareservering: een gekozen moment is uitsluitend een voorkeur.
- Geen automatische herinnering bij ontbrekende foto's.
- Geen automatische e-mailverzending: het e-maildomein is nog niet ingericht (bewust uitgesteld).

## Meldingenwachtrij en herstel

Elke opgeslagen aanvraag krijgt drie taken in `notification_outbox`: interne lead,
eigenaarsmail en (als er een e-mailadres is) klantbevestiging. Direct na opslag worden ze
uitgevoerd. Mislukt er één, dan blijft die taak staan met een oplopend aantal pogingen
(1, 5, 15, 60, 240 minuten, daarna definitief mislukt) terwijl de geslaagde taken niet
opnieuw worden uitgevoerd.

Automatisch herstel: zodra er een openstaande taak in `notification_outbox` staat, wordt via
een databasetrigger elke 5 minuten `public.enqueue_notification_retry()` gepland. Die roept
`/api/public/hooks/notification-retry` aan met de header `X-Reminder-Token` (dezelfde private
token als de leadherinneringen). Is de wachtrij leeg, dan stopt de geplande controle zichzelf.
Maximale vertraging bij herstel: 5 minuten. Handmatig aanroepen van dezelfde hook blijft mogelijk.

Definitief mislukt: na 5 pogingen krijgt de taak status `failed`; die rijen blijven staan in
`notification_outbox` (zichtbaar voor beheerders) en worden niet opnieuw geprobeerd. E-mailtaken
blijven bewust openstaan zolang het e-maildomein niet is ingericht en lopen dezelfde begrenzing in,
dus er wordt later geen oude mail ongecontroleerd alsnog verstuurd.

Dubbele leads zijn uitgesloten: elke lead krijgt de bronverwijzing `quote:<aanvraag-id>` in
`leads.external_ref`, met een unieke index. Opnieuw proberen levert dezelfde lead op en vult
alleen de ontbrekende Telegram-verzending aan.
