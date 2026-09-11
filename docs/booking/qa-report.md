# QA-rapport (11 september 2026)

Omgeving: preview-build, Chromium via Playwright, Node/Bun-testomgeving, gedeelde Lovable Cloud-database.
"Niet uitvoerbaar" is geen geslaagde test.

| ID | Scenario | Resultaat | Bewijs |
| --- | --- | --- | --- |
| A01 | Foto-CTA opent fotostap, geen impliciete schouw | geslaagd | eerdere Playwright-doorloop NL/EN; foto- en schouwkeuze sluiten elkaar uit in `groepenkast-booking.tsx` |
| A02 | Voorgekozen pakket | geslaagd | pagina geeft `initialPackage` mee; flow start bij optiestap |
| A03 | Inactieve dienst in payload | **geslaagd (nieuw)** | server geeft 403 bij `bookingService != groepenkast`; unit test `activation.test.ts` |
| A04 | Nog geen pakket gekozen | geslaagd | CTA inactief met "Kies eerst een pakket" |
| A05 | Merkkeuze | niet uitvoerbaar | merkfeature is niet actief; toeslagen ontbreken in de prijsbron |
| A06 | 3-fase basis + inductie = €994 | geslaagd | unit test; server herberekent hetzelfde bedrag |
| A07 | ABB + 3-fase + inductie = €1.079 | niet uitvoerbaar | merkfeature niet actief |
| A08 | Uitgebreid + zes opties = €1.750 (zonder merktoeslag) | geslaagd | unit test; geen dubbeltelling |
| A09 | Wisselen naar "weet ik niet" | geslaagd | prijsstatus wordt `review_needed`, geen bedrag opgeslagen |
| A10 | Foto later | geslaagd | prijsstatus `review_needed` + WhatsApp-instructie op het bedankscherm |
| A11 | Schouw kiezen | geslaagd | `survey_requested`, tarief €90 apart, geen totaalprijs |
| A12 | Postcode buiten gebied | **niet uitvoerbaar** | er is geen ingesteld werkgebied per dienst; vereist bedrijfsbeslissing |
| A13 | Adres-API faalt of antwoordt te laat | geslaagd | late response wordt genegeerd via sleutelvergelijking; handmatige invoer blijft mogelijk |
| A14 | Bewerken vanuit overzicht | geslaagd | overzicht springt terug naar de gekozen stap met behoud van antwoorden |
| A15 | Dienstwissel | niet uitvoerbaar | slechts één actieve dienst |
| A16 | Sluiten, heropenen, taalwissel | gedeeltelijk | binnen de sessie blijft state behouden; na herladen start de flow leeg (bewust: geen persoonsgegevens in localStorage) |
| A17 | Storage niet beschikbaar | geslaagd | de flow gebruikt geen browseropslag voor invoer |
| A18 | Grote / HEIC / mislukte upload | gedeeltelijk | server accepteert HEIC en controleert magic bytes; de client accepteert JPG/PNG/WebP tot 5 MB met duidelijke melding |
| A19 | Bestand verwijderen tijdens upload | niet getest | uploads gaan pas mee bij verzenden, niet vooraf |
| A20 | Preview aanwezig, serverupload mislukt | geslaagd | server geeft 500 met foutmelding; er verschijnt geen "aanvraag ontvangen" |
| A21 | Dubbelklik / gelijktijdige retries | **geslaagd (nieuw)** | unieke index in de database aantoonbaar getest: tweede rij met dezelfde sleutel geweigerd |
| A22 | Server slaat op, response valt weg | **geslaagd (nieuw)** | hercontrole op de sleutel vóór upload geeft dezelfde aanvraag-ID terug |
| A23 | Zelfde sleutel, gewijzigde inhoud | **geslaagd (nieuw)** | server geeft 409; client maakt daarna een nieuwe sleutel aan |
| A24 | Client manipuleert prijs | **geslaagd (nieuw)** | de server negeert clientbedragen volledig en herberekent uit ID's |
| A25 | Prijs veranderd tijdens concept | gedeeltelijk | prijsmomentopname en catalogusversie worden bewaard; hercontrole bij een oud concept is nog niet gebouwd |
| A26 | E-mailprovider uitgeschakeld | geslaagd | lead blijft opgeslagen en zichtbaar; `notification_status = pending` |
| A27 | Andere sessie vraagt aanvraag op | geslaagd | geen publiek statusendpoint; foto's staan in een private bucket met ondertekende links |
| A28 | Marketingcookies geweigerd | geslaagd | events lopen via het bestaande toestemmingsmechanisme; alleen postcodegebied, nooit persoonsgegevens |
| A29 | Verzenden, herladen, terug naar succes | geslaagd | conversie-event wordt per lead-ID één keer geteld |
| A30 | Toetsenbord en schermlezer | gedeeltelijk | focusbeheer, ESC, labels en foutteksten aanwezig; geen volledige schermlezertest uitgevoerd |
| A31 | Cookiepaneel, sticky CTA, rotatie | geslaagd | sticky CTA blijft verborgen zolang het cookiepaneel zichtbaar is |
| A32 | Verlopen spamcontrole | geslaagd | herstelbare foutmelding; antwoorden blijven behouden |
| A33 | SEO voor en na | geslaagd | geen wijzigingen aan routes, metadata, prijzen of gestructureerde data in deze sessie |
| A34 | Piekbelasting | niet uitvoerbaar | geen belastingtest uitgevoerd op de gedeelde omgeving |
| A35 | Twee medewerkers wijzigen dezelfde aanvraag | niet getest | backoffice heeft nog geen versiecontrole |
| A36 | Laatste agendaslot | niet uitvoerbaar | er is geen agendakoppeling; een moment is uitsluitend een voorkeur |

## Testcommando's

- `bunx vitest run` — 7 bestanden, 35 tests groen (waarvan 5 nieuw voor activatie en prijsherberekening).
- `bunx tsgo --noEmit` — geen fouten.
- Databasecontrole idempotentie: tweede rij met dezelfde sleutel geweigerd; testrij daarna verwijderd.

## Vrijgavebeoordeling

- **Klantflow (groepenkast):** geschikt voor beperkte live test.
- **Opslag:** geschikt; dienst, route, prijsstatus en prijsmomentopname worden nu apart vastgelegd en dubbele verzending is in de database geblokkeerd.
- **Opvolging:** geschikt via backoffice en Telegram; e-mailmeldingen zijn geblokkeerd op het ontbrekende e-maildomein.
- **Meting:** geschikt binnen de bestaande toestemmingsregels.
- **Geblokkeerd:** werkgebiedregels per dienst, merktoeslagen, agendacapaciteit en activatie van overige diensten.
