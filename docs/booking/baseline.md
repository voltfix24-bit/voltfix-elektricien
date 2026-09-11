# Nulmeting booking-platform (11 september 2026)

Statussen: `aangetoond`, `gedeeltelijk`, `ontbreekt`, `niet getest`, `bewust uitgesteld`.

| Onderdeel | Status vóór deze sessie | Bewijs | Wijziging in deze sessie |
| --- | --- | --- | --- |
| Centrale motor | aangetoond | `src/lib/booking/{types,registry,analytics}.ts`, `src/components/booking/booking-shell.tsx`; groepenkast is de enige instantie | ongewijzigd |
| Groepenkast als referentiedienst | aangetoond | `src/lib/booking/services/groepenkast.ts`, `src/lib/groepenkast.ts`, 35 unit tests groen | ongewijzigd gedrag; prijs nu ook server-side herberekend |
| Uitgeschakelde diensten (UI) | aangetoond | `placeholders.ts` met `enabled: false`, `enabledBookingServices()` | ongewijzigd |
| Uitgeschakelde diensten (server) | **ontbrak** | server accepteerde elke `bookingService`-waarde in het formulier | **hersteld**: activatiecontrole in `/api/public/quote-request`, 403 bij niet-actieve dienst |
| Server-side prijscontrole | gedeeltelijk | server gebruikte alleen pakket-ID's voor de berichttekst; geen opgeslagen bedrag | **hersteld**: `recalculateGroepenkastPrice()` + `price_status`, `price_total_cents`, `price_snapshot`, `catalog_version` |
| Datacontract aanvraag | gedeeltelijk | dienst, intentie, route en prijs stonden in het vrije tekstveld `message` | **hersteld**: aparte kolommen `booking_service`, `booking_intent`, `booking_route`, `postal_area` |
| Idempotentie | **ontbrak** | alleen een client-side `submitting`-ref en een uitgeschakelde knop | **hersteld**: `idempotency_key` met unieke index, hercontrole vóór upload, 409 bij gewijzigde inhoud |
| Foto-upload | aangetoond | private bucket `quote-attachments`, MIME + magic-byte-controle, max 3 × 20 MB | ongewijzigd |
| Foto later / schouw | aangetoond | wederzijds uitsluitende keuzes in `groepenkast-booking.tsx`; schouwtarief €90 uit centrale prijsbron | ongewijzigd |
| Meldingen (e-mail) | bewust uitgesteld | e-maildomein nog niet ingericht; `email_send_log` registreert wel status | kolom `notification_status` toegevoegd (default `pending`) |
| Interne opvolging | aangetoond | leads gaan via `createAndDispatchLead` naar de beveiligde backoffice + Telegram | ongewijzigd |
| Werkgebiedbeleid per dienst | ontbreekt | geen ingestelde postcodelijst per dienst; alleen redactionele werkgebiedtekst | niet ingevuld — vereist bedrijfsbeslissing (zie openstaande punten) |
| Merkkeuze (AEG/Eaton/ABB/Hager) | niet actief | geen merkveld in `groepenkast.ts` of in de flow | bewust niet stil geactiveerd; toeslagen ontbreken in de centrale prijsbron |
| Meting | aangetoond | `trackBooking()` met dienst, intentie, route, postcodegebied (4 cijfers), geen persoonsgegevens | ongewijzigd |
| SEO NL/EN | aangetoond | `pageMeta()` + `altLinks()`, canonicals op www.voltfix.nl | ongewijzigd |

## CTA-inventaris groepenkastpagina

| CTA | Dienst | Bedoeling | Startstap |
| --- | --- | --- | --- |
| Hero: "Bereken mijn vaste prijs" | groepenkast | `price` | stap 1 pakket |
| Prijskaart per pakket | groepenkast | `price` (met voorgekozen pakket) | stap 2 opties |
| "Check mijn foto" | groepenkast | `photo` | stap 3 foto |
| "Schouw aanvragen" (€90) | groepenkast | `survey` | stap 3 met schouw voorgeselecteerd |
| Sitebrede sticky CTA | groepenkast | `price` | stap 1 |
| Bel / WhatsApp | n.v.t. | direct contact | geen flow |

## Openstaande punten die bedrijfsinformatie vereisen

1. **Werkgebied per dienst**: welke postcodes zijn binnen gebied, buiten gebied of te beoordelen? Niet zelf ingevuld.
2. **Merktoeslagen**: Eaton +€45 en ABB Haf +€85 staan wel in de specificatie, maar niet in de centrale prijsbron. Niet stil toegevoegd.
3. **E-maildomein**: koppeling wacht op configuratie; aanvragen blijven intern zichtbaar via de backoffice en Telegram.
4. **Spoedtarief**: bevestigd op €120 eerste uur all-in. Spoed blijft uitgeschakeld in de flow.
