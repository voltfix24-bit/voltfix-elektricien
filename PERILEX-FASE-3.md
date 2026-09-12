# Perilex / kookaansluiting — fase 3 (dienstconfiguratie, intake, routering, prijsbeslissing)

Status: **niet gepubliceerd, dienst staat uit** (`bookingServices.perilex.enabled === false`,
`isBookingServiceActive('perilex') === false`). Geen pagina's, CTA's of navigatie gewijzigd.
Geen echte aanvraag of Telegrammelding verstuurd; de serverroute weigert Perilex met 403.

## Gewijzigde en nieuwe bestanden

| Bestand | Wijziging |
|---|---|
| `supabase/migrations/*_service_answers.sql` | `quote_requests.service_answers jsonb NOT NULL DEFAULT '{}'` (niet-destructief) |
| `src/lib/booking/perilex-routing.ts` | nieuw: antwoordcodes, `derivePerilexBookingResult`, `recalculatePerilexPrice`, `normalisePerilexAnswers`, copy NL/EN |
| `src/lib/booking/services/perilex.ts` | nieuw: `perilexService` (id `perilex`, stappen intake → photo → address → contact → summary) |
| `src/lib/booking/services/placeholders.ts` | placeholder verwijderd (één registratie) |
| `src/lib/booking/registry.ts` | `perilex: perilexService` |
| `src/components/booking/steps/perilex-intake.tsx` | nieuw: intakestap met vervolgvragen |
| `src/components/perilex-booking.tsx` | nieuw: volledige flow op `BookingShell` met concept, inline bewerken, samenvatting |
| `src/routes/api/public/quote-request.ts` | Perilex-tak: activatiecontrole, serverherberekening, catalogusversie/409, opslag `service_answers` |
| `src/lib/booking/analytics.ts` | velden `priceStatus`, `priceRuleId`, `answers` |
| `src/routes/dev-preview.perilex.tsx` | alleen lokale preview (404 in productie, noindex) |
| `src/lib/booking/perilex-routing.test.ts` | 23 testgroepen over de volledige matrix |

## Routebeslissing

| Intentie | Vervolg | Route | Prijsstatus | Prijsregel | Bedrag |
|---|---|---|---|---|---|
| connect_existing | preparation=yes + standard | fixed_existing_standard | fixed | existing_connection_standard | €120 excl. btw |
| connect_existing | preparation=yes + priority_24h | fixed_existing_priority | fixed | existing_connection_priority_24h | €145 excl. btw (beschikbaarheid) |
| connect_existing | preparation=unsure/no + photo_review | photo_review | review_needed | — | geen |
| connect_existing | preparation=unsure/no + site_survey | site_survey | fixed | site_survey | €90 excl. btw, verrekenbaar |
| new_installation / kitchen_renovation / unsure | photo_review | photo_review | review_needed | — | geen |
| new_installation / kitchen_renovation / unsure | site_survey | site_survey | fixed | site_survey | €90 excl. btw, verrekenbaar |
| fault_or_issue | circuit_trips_or_error / other | fault_review | review_needed | — | geen |
| fault_or_issue | connection_hot / burning_smell_or_sparks | safety_call | none | — | geen, veiligheidsadvies + Bel VoltFix + terugbelverzoek |

Nieuwe groep, kabel, wandcontactdoos, groepenkastaanpassing en bouwkundig werk vallen altijd in
`photo_review`/`site_survey`/`fault_review` — nooit in een automatische prijs. Foto is nergens verplicht.

## Opslag (stabiele codes, geen vertaalde tekst)

`booking_service`, `booking_intent`, `booking_route`, `price_status`, `price_snapshot`
(met `money`: `amount_ex_vat_cents`, `vat_amount_cents`, `amount_inc_vat_cents`,
`display_tax_mode: 'ex_vat'`, `price_rule_id`), `catalog_version`, `service_answers`
(`intent`, `preparation`, `urgency`, `reviewChoice`, `issueType`), `source_path`, `locale`.
Bedragen komen uitsluitend uit `perilexCatalog`; de client kan geen prijs claimen.

## Controle

- `bunx vitest run`: 20 bestanden, 154 tests groen (waarvan 23 nieuw voor Perilex).
- `bunx tsgo --noEmit`: schoon.
- Groepenkast ongewijzigd: `recalculateGroepenkastPrice` en de bestaande flow zijn niet aangeraakt; bestaande tests blijven groen.
- Screenshots op 360×780, 390×844, 1024×768 en 1440×900 (NL en EN) plus routestatussen
  (€120, €145, schouw €90, fotobeoordeling, veiligheidsroute): geen horizontale scroll, geen console errors.
