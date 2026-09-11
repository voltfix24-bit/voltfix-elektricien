# Architectuur booking-engine

## Verantwoordelijkheden

| Laag | Bestand(en) | Verantwoordelijkheid |
| --- | --- | --- |
| Dienstcatalogus | `src/lib/booking/registry.ts`, `services/*` | één plek met alle diensten en hun activatiestatus |
| Contract | `src/lib/booking/types.ts` | `ServiceConfig`, stap-ID's, intenties, state-vorm |
| Activatie + prijs | `src/lib/booking/activation.ts` | activatiecontrole, prijsherberekening, prijsversie, postcodegebied |
| Dienstlogica groepenkast | `src/lib/groepenkast.ts` | pakketten, opties, validatieschema, berichttekst |
| Prijsbron | `src/lib/pricing.ts` | alle euro-bedragen (single source of truth) |
| Weergave | `src/components/booking/booking-shell.tsx` + `steps/*` | modal/fullscreen, voortgang, sticky footer, focus, scroll |
| Orchestratie | `src/components/groepenkast-booking.tsx` | state, validatie, verzenden, tracking |
| Meting | `src/lib/booking/analytics.ts` | uniforme events met dienstcontext, zonder persoonsgegevens |
| Server | `src/routes/api/public/quote-request.ts` | validatie, activatie, prijsherberekening, uploads, opslag, idempotentie, meldingen |

## Datacontract `quote_requests`

Naast de bestaande velden (naam, telefoon, e-mail, adres, bericht, bijlagen, taal, bronpad):

| Kolom | Betekenis |
| --- | --- |
| `booking_service` | dienst-ID uit de registry; alleen actieve diensten worden geaccepteerd |
| `booking_intent` | `price`, `survey`, `photo`, `emergency` of `quote` |
| `booking_route` | `photo`, `later` of `survey` |
| `price_status` | `indication`, `review_needed` of `survey_requested` |
| `price_total_cents` | server-berekend bedrag in eurocenten; leeg zolang controle nodig is |
| `price_snapshot` | momentopname: pakket, opties, schouwtarief, catalogusversie |
| `catalog_version` | versie van de prijscatalogus op het moment van aanvragen |
| `postal_area` | alleen de vier cijfers van de postcode (voor analyse) |
| `idempotency_key` | unieke sleutel per verzendpoging (unieke index) |
| `request_hash` | hash van de zakelijke inhoud, los van spamtoken en transportgegevens |
| `notification_status` | `pending` zolang het e-maildomein niet is ingericht |

## Prijsregels

- Bedragen komen uitsluitend uit `src/lib/pricing.ts`; de server herberekent altijd uit pakket- en optie-ID's.
- Onbekend pakket of foto-later ⇒ `review_needed`, geen bedrag opgeslagen.
- Schouw ⇒ `survey_requested`, schouwtarief apart benoemd, geen totaalprijs.
- Clientbedragen worden nooit opgeslagen of vertrouwd.

## Idempotentie

1. De client maakt één sleutel per verzendpoging en hergebruikt die bij een retry.
2. De server zoekt de sleutel op vóór uploads. Bestaat de aanvraag al met dezelfde inhoudshash ⇒ dezelfde aanvraag-ID terug.
3. Andere inhoud met dezelfde sleutel ⇒ HTTP 409; de client maakt daarna een nieuwe sleutel aan.
4. Bij gelijktijdige pogingen vangt de unieke index (`23505`) het duplicaat op.

## Wat nog niet in deze architectuur zit

- Werkgebiedregels per dienst (vereist bedrijfsbeslissing).
- Merkkeuze en merktoeslagen.
- Echte agendacapaciteit: een gekozen moment is uitsluitend een voorkeur.
- Meldingen-outbox met retries: nu alleen statusveld + `email_send_log`.
