# Centrale booking-engine (groepenkast als eerste module)

Doel: één herbruikbare boekingswizard voor alle VoltFix-diensten, waarbij de huidige
groepenkastflow functioneel exact hetzelfde blijft (prijzen, foto, schouw, adres, planning,
contact, overzicht, leadopslag, bedanktekst, tracking).

## Wat er komt

**1. Gedeelde booking shell**
Eén modal/fullscreen wizard met: voortgangsbalk, vaste kop en voettekst, terug/verder,
validatie per stap, foutmeldingen, statusprijs in de voettekst, bedankscherm met
WhatsApp/bel-knoppen. De shell weet niets van een specifieke dienst; hij rendert de stappen
die de dienst opgeeft.

**2. Gedeelde stappen (dienstonafhankelijk)**
Foto-upload (incl. fotogids, "foto later via WhatsApp", schouwroute), adres met
postcodecheck en automatische straat/woonplaats, planning (datum + dagdeel),
contactgegevens, overzicht met wijzig-knoppen en toestemming, bedankscherm.

**3. Dienstspecifieke stappen**
Alleen de technische intakevragen. Voor groepenkast: pakketkeuze en opties — exact de
huidige pakketten (€695 / €845 / €1.095) en opties (+€149 / +€129 / +€120 / +€39 / +€49 /
+€169) uit de bestaande centrale prijsbron. Geen enkel bedrag wordt overgetypt of gewijzigd.

**4. ServiceConfig**
Per dienst één configuratieobject met: naam, slug, flowtype (gepland / spoed / offerte /
vaste prijs), welke stappen in welke volgorde, dienstspecifieke vragen, prijslogica,
optieprijzen, foto-instructies, schouw/foto-later-opties, teksten voor overzicht en
bedankscherm, en de vertaling naar de aanvraag die naar de server gaat.
Groepenkast wordt volledig ingevuld. Laadpaal, perilex, storing/spoed, stopcontact/lichtpunt
en algemene klus krijgen alvast een skelet dat nog niet zichtbaar is op de site.

**5. Preselectie per pagina**
De flow opent met context: dienst, intentie, bronpagina en eventueel voorgeselecteerd pakket.
Is de dienst al bekend (zoals op de groepenkastpagina), dan verschijnt er geen extra
dienstkeuze — wel een subtiele "dienst wijzigen"-optie voor later gebruik.

**6. Spoed apart**
Spoed krijgt een korte route: soort storing, prominente belknop, locatie/contact,
diagnoseprijs uit de centrale prijsbron. Geen pakketvragen. Nu alleen als configuratie
voorbereid, nog niet live.

**7. Tracking**
Uniforme events: booking_started, service_selected, intent_selected, booking_step_completed,
photo_added, lead_submitted, booking_abandoned. Elk event stuurt dienst, intentie, bronpagina,
prijs/status, route en postcodegebied mee. De bestaande lead-conversie-tracking blijft
ongewijzigd naast de nieuwe events.

## Technisch

- Nieuw: `src/lib/booking/types.ts`, `registry.ts`, `context.ts` (open-state uitgebreid met
  service/intent/sourcePage/package), `analytics.ts`, `services/groepenkast.ts` +
  placeholderconfigs.
- Nieuw: `src/components/booking/booking-shell.tsx` en `steps/*` (photo, address, planning,
  contact, summary, success) plus `steps/groepenkast-package.tsx` / `-options.tsx`.
- `src/components/groepenkast-booking.tsx` wordt een dunne wrapper die de shell opent met
  `initialService="groepenkast"`, zodat de groepenkastpagina, sticky CTA en
  `booking-active`-koppeling onveranderd blijven werken.
- Ongewijzigd: `src/lib/pricing.ts`, `src/lib/groepenkast.ts` (schema, bericht, SEO-content),
  `src/routes/api/public/quote-request.ts`, leadopslag, Turnstile, foto-upload, routes,
  SEO-content en structured data.

## Nieuwe dienst later toevoegen

Eén configuratiebestand onder `services/` aanmaken, registreren in de registry, en de knop op
die servicepagina de flow laten openen met de juiste dienst. Geen wijziging aan de shell.

## QA

- Unit tests op prijslogica, stapvolgorde en payload-mapping.
- Typecheck en bestaande testsuite.
- Browsercontrole NL en EN op 360, 390, 1024 en 1440: volledige groepenkastflow inclusief
  foto, foto-later, schouw, adres-autofill, datum, overzicht en verzenden; geen overlap met
  de sticky knop, geen horizontale scroll.
- Screenshots van alle stappen als bewijs.
