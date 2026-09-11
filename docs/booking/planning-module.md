# Planningsmodule (voorkeur, geen agenda)

Laatste update: 11 september 2026.

## Uitgangspunt

VoltFix heeft geen gekoppelde agenda en geen capaciteitsbron. De planningsmodule verzamelt
daarom uitsluitend een **voorkeur**. Nergens in tekst, opslag of bevestiging staat een
toegezegde afspraak, vrije slots, bezetting, aankomsttijd, "morgen"-belofte of toeslag.
`planningMode` is altijd `preference` (`planningSchemaVersion = 1`).

## Waar het zit

Binnen de bestaande stap 4 "Adres & moment" van de bestaande groepenkastflow en modal.
Er is geen extra hoofdstap en geen tweede bookingflow toegevoegd.

- Domeinmodel + validatie: `src/lib/booking/planning.ts`
- Gedeelde UI: `src/components/booking/planning-preference.tsx`
- Inbouw in de stap: `src/components/booking/steps/address-step.tsx`
- Orchestratie/concept/overzicht: `src/components/groepenkast-booking.tsx`
- Schema van de aanvraag: `src/lib/groepenkast.ts`
- Servervalidatie en opslag: `src/routes/api/public/quote-request.ts`

## Voorkeurtypen

| Type | Betekenis | Datum | Dagdeel |
| --- | --- | --- | --- |
| `flexible` (In overleg) | standaard bij een nieuwe aanvraag | nee | nee |
| `specific_date` (Datum kiezen) | maandkalender + dagdeel | verplicht | verplicht (`morning`/`afternoon`/`any`) |
| `asap` (Zo snel mogelijk) | rustige amber accentuering | nee | nee |

Selectie en de primaire flowknop blijven paars (VoltFix-stijl); amber is alleen accent bij
"Zo snel mogelijk". Er wordt geen prijs of levertijd aan gekoppeld.

## Datumlogica

- Tijdzone `Europe/Amsterdam`, date-only (`YYYY-MM-DD`), geen tijdstippen.
- Vandaag wordt in Amsterdamse tijd bepaald; dagen in het verleden zijn geblokkeerd.
- Alleen echte kalenderdagen (schrikkeljaar meegerekend) zijn geldig.
- Kalender start op maandag, NL/EN-locale, plus een handmatig datumveld.
- Server hervalideert dezelfde regels; een ongeldige combinatie wordt geweigerd.

## Routeafhankelijk doel

Het doel wordt server-side afgeleid uit de fotoroute: `survey` → schouwvoorkeur,
`photo`/`later` → installatievoorkeur. Wisselt de klant van route, dan wordt een gekozen datum
gewist en verschijnt een herstelbare melding ("Je datum gold voor de installatie…"). Een datum
krijgt dus nooit stil een andere betekenis.

## Opslag en opvolging

- `appointment_date`: alleen gevuld bij `specific_date`.
- `appointment_slot`: dagdeellabel of het doel (installatie/schouw).
- `appointment_note`: doel + voorkeurtype + "voorkeur, nog te bevestigen".
- De voorkeur staat ook leesbaar in het berichtveld, dus in backoffice en Telegram-dispatch.
- De voorkeur telt mee in de request-hash, dus idempotentie en de 409-controle bij gewijzigde
  inhoud blijven kloppen.
- Het concept in de browser bewaart de voorkeur (niet-persoonlijk); een verlopen datum uit een
  oud concept wordt bij herstel geweigerd.

## Acute storing

De belactie "Acute storing? Bel VoltFix" is een telefoonlink naar het bestaande nummer. Zij
activeert geen uitgeschakelde dienst en maakt geen spoedaanvraag aan.

## Bewust niet gedaan

Bedrijfsuren, werkgebiedregels, weekendbeleid, voorbereidingstijd, capaciteit en concrete
aankomsttijden zijn niet verzonnen. Er is geen agenda-integratie en geen toeslag.
