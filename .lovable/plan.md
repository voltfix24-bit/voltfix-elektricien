# Planningstool — testvariant op /perilex-amsterdam

Doel: bezoeker kiest binnen 30 seconden een dagdeel binnen 48 uur voor installatie. Deze eerste versie is een **UI-mock**: geen opslag, geen mails, geen kalender-sync. Bedoeld om te reviewen of het concept werkt en past bij de pagina. Zodra jij akkoord bent, hangen we er echte opslag + bevestigingsmail achter.

## Wat je ziet in de preview

Nieuw blok op `/perilex-amsterdam` (tussen de callback-form en de MeasureCard), titel bv. *"Kies je installatie-moment — binnen 48 uur"*.

- **Stap 1 — Datum**: 3 dag-kaartjes: *Vandaag*, *Morgen*, *Overmorgen* (dagnaam + datum). "Vandaag" wordt na 15:00 automatisch verborgen.
- **Stap 2 — Dagdeel**: 3 tijdblokken per gekozen dag:
  - Ochtend (08:00–12:00)
  - Middag (12:00–17:00)
  - Avond (17:00–20:00) — met toeslag-badge
  Sommige slots tonen "vol" (grijs, niet klikbaar) zodat het levend voelt.
- **Stap 3 — Contact**: naam, telefoon, postcode + adres, optioneel opmerking.
- **Bevestigingsknop**: "Reserveer dit moment" (groen, WhatsApp-kleur).
- **Na klik**: inline succesbericht "We bevestigen binnen 15 min per WhatsApp/telefoon" + samenvatting van de keuze. Geen echte verzending in deze testversie.
- **GTM-event** `schedule_request` met dag + dagdeel als parameters, zodat je in Analytics ziet of bezoekers de flow afmaken.
- Mobiel-first: alles klikbaar, grote tap-targets, geen dropdowns.

## Wat er onder de motorkap gebeurt (technisch)

- Nieuw component `src/components/schedule-picker.tsx` — pure client-side React, geen backend-calls.
- Slot-logica in `src/lib/schedule.ts`: functie die op basis van `new Date()` de eerstvolgende 3 dagen + dagdelen genereert, inclusief cutoff-regels (na 15:00 geen "vandaag", weekend heeft alleen ochtend/middag).
- Één import in `src/routes/perilex-amsterdam.tsx` + plaatsing in de bestaande layout-volgorde. Geen wijziging aan andere pagina's.
- Bilinguaal-ready gebouwd, maar in deze testronde alleen op de NL-route zichtbaar.
- Geen wijzigingen aan Cloud, migraties, e-mailtemplates of `src/lib/business.ts`.

## Wat expliciet **niet** in deze test zit

- Geen opslag in de database.
- Geen bevestigingsmail naar klant of jou.
- Geen kalender-integratie.
- Nog niet uitgerold op EN-route, laadpaal-, groepenkast- of spoedpagina.

## Vervolg als de test bevalt

Fase 2 (aparte goedkeuring): opslag naar Lovable Cloud tabel `schedule_requests`, dubbele bevestigingsmail via bestaande e-mail-infrastructuur (klant + `info@voltfix.nl`), uitrol naar EN + andere servicepagina's, en optioneel admin-view om slots te blokkeren.
