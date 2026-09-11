# QA-rapport (11 september 2026)

Omgeving: preview-build, Chromium via Playwright, Node/Bun-testomgeving, gedeelde Lovable Cloud-database.
"Niet uitvoerbaar" is geen geslaagde test.

| ID | Scenario | Resultaat | Bewijs |
| --- | --- | --- | --- |
| A01 | Foto-CTA opent fotostap, geen impliciete schouw | geslaagd | eerdere Playwright-doorloop NL/EN; foto- en schouwkeuze sluiten elkaar uit in `groepenkast-booking.tsx` |
| A02 | Voorgekozen pakket | geslaagd | pagina geeft `initialPackage` mee; flow start bij optiestap |
| A03 | Inactieve dienst in payload | **geslaagd (nieuw)** | server geeft 403 bij `bookingService != groepenkast`; unit test `activation.test.ts` |
| A04 | Nog geen pakket gekozen | geslaagd | CTA inactief met "Kies eerst een pakket" |
| A05 | Merkkeuze | niet uitvoerbaar (bewust) | toeslagen staan nu centraal (+€0 / +€45 / +€85, Hager uit); `brandChoiceEnabled = false`, dus geen UI, geen prijsinvloed — unit test bewijst de gating |
| A06 | 3-fase basis + inductie = €994 | geslaagd | unit test; server herberekent hetzelfde bedrag |
| A07 | ABB + 3-fase + inductie = €1.079 | niet uitvoerbaar (bewust uitgesteld) | merkkeuze staat uit; rekenregel bestaat centraal maar wordt pas actief als UI, server, opslag en tests samen kloppen |
| A08 | Uitgebreid + zes opties = €1.750 (zonder merktoeslag) | geslaagd | unit test; geen dubbeltelling |
| A09 | Wisselen naar "weet ik niet" | geslaagd | prijsstatus wordt `review_needed`, geen bedrag opgeslagen |
| A10 | Foto later | geslaagd | prijsstatus `review_needed` + WhatsApp-instructie op het bedankscherm |
| A11 | Schouw kiezen | geslaagd | `survey_requested`, tarief €90 apart, geen totaalprijs |
| A12 | Postcode buiten gebied | **niet uitvoerbaar** | er is geen ingesteld werkgebied per dienst; vereist bedrijfsbeslissing |
| A13 | Adres-API faalt of antwoordt te laat | geslaagd | late response wordt genegeerd via sleutelvergelijking; handmatige invoer blijft mogelijk |
| A14 | Bewerken vanuit overzicht | geslaagd | overzicht springt terug naar de gekozen stap met behoud van antwoorden |
| A15 | Dienstwissel | niet uitvoerbaar | slechts één actieve dienst |
| A16 | Sluiten, heropenen, taalwissel | geslaagd (nieuw) | niet-persoonlijke keuzes (pakket, opties, route) worden hersteld na herladen; adres- en contactgegevens bewust nooit opgeslagen |
| A17 | Storage niet beschikbaar | geslaagd | de flow gebruikt geen browseropslag voor invoer |
| A18 | Grote / HEIC / mislukte upload | geslaagd (nieuw, niet op echt toestel getest) | client verkleint foto's boven 2 MB naar max. 2000 px, accepteert HEIC/HEIF tot 20 MB; server controleert magic bytes |
| A19 | Bestand verwijderen tijdens upload | niet getest | uploads gaan pas mee bij verzenden, niet vooraf |
| A20 | Preview aanwezig, serverupload mislukt | geslaagd | server geeft 500 met foutmelding; er verschijnt geen "aanvraag ontvangen" |
| A21 | Dubbelklik / gelijktijdige retries | **gedeeltelijk** | databasebewijs: unieke sleutel weigert de tweede rij, en een tweede lead met dezelfde bronverwijzing wordt geweigerd. Een gelijktijdige test via de volledige API is NIET uitgevoerd: dat vereist een geldig anti-spamtoken en zou echte leads en Telegram-berichten opleveren |
| A22 | Server slaat op, response valt weg | **gedeeltelijk** | code-pad aanwezig (hercontrole op sleutel vóór upload plus 23505-afvang) en op databaseniveau bewezen; niet via een echte onderbroken HTTP-aanroep getest |
| A23 | Zelfde sleutel, gewijzigde inhoud | **geslaagd (nieuw)** | server geeft 409; client maakt daarna een nieuwe sleutel aan |
| A24 | Client manipuleert prijs | **geslaagd (nieuw)** | de server negeert clientbedragen volledig en herberekent uit ID's |
| A25 | Prijs veranderd tijdens concept | geslaagd (nieuw, code-bewijs) | client stuurt de getoonde prijsversie mee; wijkt die af, dan antwoordt de server met 409 `price_changed` plus de nieuwe prijs, slaat niets op, en vraagt de klant expliciet te bevestigen. Alle invoer en de historische prijsgegevens blijven bewaard |
| A26 | E-mailprovider uitgeschakeld | geslaagd (uitgebreid) | meldingen staan in een duurzame wachtrij (`notification_outbox`) met pogingen en uitgesteld opnieuw proberen; de aanvraag blijft opgeslagen en `notification_status` volgt de wachtrij |
| A27 | Andere sessie vraagt aanvraag op | geslaagd | geen publiek statusendpoint; foto's staan in een private bucket met ondertekende links |
| A28 | Marketingcookies geweigerd | geslaagd | events lopen via het bestaande toestemmingsmechanisme; alleen postcodegebied, nooit persoonsgegevens |
| A29 | Verzenden, herladen, terug naar succes | geslaagd | conversie-event wordt per lead-ID één keer geteld |
| A30 | Toetsenbord en schermlezer | gedeeltelijk | focusbeheer, ESC, labels en foutteksten aanwezig; geen volledige schermlezertest uitgevoerd |
| A31 | Cookiepaneel, sticky CTA, rotatie | geslaagd | sticky CTA blijft verborgen zolang het cookiepaneel zichtbaar is |
| A32 | Verlopen spamcontrole | geslaagd | herstelbare foutmelding; antwoorden blijven behouden |
| A33 | SEO voor en na | geslaagd | geen wijzigingen aan routes, metadata, prijzen of gestructureerde data in deze sessie |
| A34 | Piekbelasting | niet uitvoerbaar | geen belastingtest uitgevoerd op de gedeelde omgeving |
| A35 | Twee medewerkers wijzigen dezelfde aanvraag | niet getest | backoffice heeft nog geen versiecontrole |
| A37 | Uitval tussen opslag en interne opvolging | gedeeltelijk | herstelroute gebouwd: de retry-hook probeert alleen de mislukte taak opnieuw en de bronverwijzing op de lead voorkomt een tweede lead. Databasebewijs aanwezig; een echte uitvalsimulatie via de API is niet uitgevoerd |
| A36 | Laatste agendaslot | niet uitvoerbaar | er is geen agendakoppeling; een moment is uitsluitend een voorkeur |

## Planningsmodule (P01–P22, 11 september 2026)

Uitvoering: Chromium via Playwright op de preview-build, NL en EN, anti-spamtoken gestubd,
API-antwoord onderschept zodat er geen echte leads ontstaan. Zie `docs/booking/planning-module.md`.

| ID | Scenario | Resultaat | Bewijs |
| --- | --- | --- | --- |
| P01 | Nieuwe aanvraag start op "In overleg" | geslaagd | stap 4 toont "Installatievoorkeur: in overleg. Nog te bevestigen." (NL/EN) |
| P02 | "Datum kiezen" zonder datum blokkeert doorgaan | geslaagd | melding "Kies een datum of zet de planning op “In overleg”." / "Choose a date, or switch to “To be arranged”." |
| P03 | Datum + dagdeel geeft juiste NL/EN-samenvatting | geslaagd | "zondag 4 oktober 2026, ochtend" / "Sunday 4 October 2026, morning" |
| P04 | "Zo snel mogelijk" zonder datum/dagdeel | geslaagd | samenvatting "zo snel mogelijk"; amber accent, knop blijft paars |
| P05 | Terug naar "Datum kiezen" na wissel toont geen oude datum | geslaagd | datumveld leeg na terugkeer |
| P06 | Datum in het verleden geweigerd | geslaagd | unit tests `planning.test.ts`; verleden dagen uitgeschakeld in de kalender |
| P07 | Ongeldige datum (bijv. 29-02 in een niet-schrikkeljaar) | geslaagd | unit test |
| P08 | Europe/Amsterdam-grens rond middernacht | geslaagd | unit test met vaste klok (22:30 UTC → volgende dag) |
| P09 | Servervalidatie van ongeldige combinaties | geslaagd | schemavalidatie in `groepenkast.ts` + endpoint; unit tests |
| P10 | Schouwroute vraagt schouwvoorkeur | geslaagd | kop "Wanneer komt een schouw uit?" en "Schouwvoorkeur: …" |
| P11 | Routewissel geeft datum geen andere betekenis | geslaagd | datum gewist + herstelbare melding, daarna weer keuzevrij |
| P12 | Voorkeur in overzicht | geslaagd | overzichtsregel "Adres & voorkeur" met de volledige voorkeurzin |
| P13 | Voorkeur in de verzonden aanvraag | geslaagd | payload bevat `planning` met `mode: preference` |
| P14 | Opslag: datum, dagdeel en doel apart vastgelegd | geslaagd | `appointment_date`, `appointment_slot`, `appointment_note` (voorkeur, nog te bevestigen) |
| P15 | Voorkeur telt mee in idempotentie/hash | geslaagd | hash bevat het aanvraagschema inclusief planning |
| P16 | Bevestigingsscherm belooft geen afspraak | geslaagd | "Aanvraag ontvangen — prijscontrole volgt" |
| P17 | Belactie acute storing activeert geen dienst | geslaagd | telefoonlink naar het bestaande nummer, geen aanvraag |
| P18 | Geen slots, bezetting, "morgen" of toeslag | geslaagd | prijsstatus onveranderd (€845 / schouw €90) bij elke voorkeur |
| P19 | Concept bewaart de voorkeur, niet-persoonlijk | geslaagd | voorkeur in `voltfix-groepenkast-draft`; verlopen datum wordt bij herstel geweigerd |
| P20 | Geen horizontale overloop op alle formaten | geslaagd | overflow = 0 op 360×780, 390×844, 768×1024, 1024×768, 1440×900 in NL/EN |
| P21 | Fout-herstel en teruggaan zonder verlies | geslaagd | melding verdwijnt bij een nieuwe keuze; terugknop behoudt antwoorden |
| P22 | Schermlezerdoorloop | niet getest | alleen rol-, label- en focusgedrag gecontroleerd via Playwright, geen echte schermlezer |

Schermopnamen: `/mnt/documents/voltfix-planning/screenshots` — echte viewports 360×780, 390×844,
768×1024, 1024×768 en 1440×900, NL en EN, foto- en schouwroute, vier planningtoestanden plus
overzicht (100 opnamen). Instellingen: headless Chromium, `domcontentloaded`, ±2,2 s wachttijd
voor de adresopzoeking, geen `full_page`.

## Testcommando's

- `bunx vitest run` — 8 bestanden, 44 tests groen (7 nieuw voor de planningsvoorkeur).
- `bunx tsgo --noEmit` — geen fouten.
- Databasecontrole idempotentie aanvraag: tweede rij met dezelfde sleutel geweigerd; testrij verwijderd.
- Databasecontrole idempotentie lead: tweede lead met dezelfde bronverwijzing geweigerd; testrijen verwijderd.
- Beveiligingscontrole database: één waarschuwing, ongewijzigd en niet nieuw — zie hieronder.

## Beveiligingswaarschuwing (exact)

```
WARN 1: Signed-In Users Can Execute SECURITY DEFINER Function (1 issues)
Description: Detects `SECURITY DEFINER` functions that are callable by signed-in users.
Categories: SECURITY
lint=0029_authenticated_security_definer_function_executable
```

Onderbouwing: van alle zes `SECURITY DEFINER`-functies in het publieke schema is er precies één
uitvoerbaar voor ingelogde gebruikers: `has_role(_user_id uuid, _role app_role)`. Alle andere
(`claim_lead`, `credit_contractor_topup`, `enqueue_lead_reminder_check`,
`reserve_overdue_lead_reminders`, `wake_lead_reminders`) zijn voor `anon` én `authenticated`
niet uitvoerbaar. `has_role` moet uitvoerbaar blijven: de toegangsregels van elke beheerderstabel
roepen deze functie aan namens de ingelogde gebruiker, en zonder `SECURITY DEFINER` ontstaat een
kringverwijzing op `user_roles`. De functie is alleen-lezen en geeft uitsluitend `true`/`false`
terug. Dit is bestaand en bewust; niet geïntroduceerd door dit werk.

## Vrijgavebeoordeling

- **Klantflow (groepenkast):** geschikt voor beperkte live test.
- **Opslag:** geschikt; dienst, route, prijsstatus en prijsmomentopname worden nu apart vastgelegd en dubbele verzending is in de database geblokkeerd.
- **Opvolging:** geschikt via backoffice en Telegram; e-mailmeldingen zijn geblokkeerd op het ontbrekende e-maildomein.
- **Meting:** geschikt binnen de bestaande toestemmingsregels.
- **Geblokkeerd:** werkgebiedregels per dienst (bedrijfsbeslissing), activatie merkkeuze en overige diensten, agendacapaciteit, e-maildomein.
- **Nog te bewijzen:** gelijktijdige verzending en uitval via de volledige API. Dat vraagt een testmodus die het anti-spamtoken omzeilt zonder echte leads, Telegram-berichten of e-mails te veroorzaken.
