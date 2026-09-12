# Service intake engine

Platte logica, geen UI. Importeer vanuit `src/lib/intake`.

    import { getIntakeContext, buildPath, computePrice, toLeadPayload } from '@/lib/intake';

## Verantwoordelijkheden

| Bestand | Doet |
| --- | --- |
| `types.ts` | Gedeelde typen + `emptyState()` |
| `service-config.ts` | **Het enige bestand voor een nieuwe dienst.** Vragen, prijzen, foto-instructies, trust-tekst, feature flag |
| `routing.ts` | `getIntakeContext(pathname)` en `buildPath()` — vervangt de uitsluitingslijst van `booking-paths.ts` |
| `pricing-engine.ts` | Bedrag **én** status; openingstijdlogica voor het spoedtarief |
| `scheduling.ts` | Eerstvolgende sloten en de weekkalender |
| `service-area.ts` | Postcodecheck werkgebied |
| `validation.ts` | Per stap één foutmelding, of leeg |
| `lead-payload.ts` | Vaste leadstructuur + `draft`-variant zonder contactgegevens |
| `triage-rules.ts` | De vijf vlaggen, het triage-advies en de SLA-klok op werkminuten |
| `tracking.ts` | Trechter-events bovenop het bestaande dataLayer-schema |

## Afhankelijkheid

Alles leest bedragen uit `src/lib/pricing.ts` (`prices`). Hardcode nooit een bedrag in deze map — anders loopt de pagina uit de pas met de structured data.

## Aannames — bevestigd op 12-09-2026

1. **Spoeddiagnose**: €120 blijft gelden (`prices.emergencyFirstHour`). De €95 uit de briefing vervalt.
2. **Eerste vrije dag** ligt drie dagen vooruit en **alle** dagen zijn planbaar, inclusief zondag — zie `VROEGSTE_DAGEN_VOORUIT` en `isWerkdag()` in `scheduling.ts`. In het weekend geldt het kortere tijdvenster (09:00–17:00). Koppel je een echte agenda, dan vervang je alleen die twee.
3. **Werkgebied** in `service-area.ts` klopt: Amsterdam, Diemen, Amstelveen, Zaandam en Haarlem, allemaal zonder voorrijkosten.
4. **Draft-leads mógen wél een notificatie afvuren.** Afwijkend van het oorspronkelijke voorstel: concepten worden gewoon doorgezet. Let op dat een concept per definitie geen contactgegevens draagt (`toLeadPayload` laat naam/telefoon/e-mail leeg bij status `draft`), dus het groepsbericht bevat alleen kluscontext.

## Migratie — uitgevoerd op 12-09-2026

```sql
alter table public.leads
  add column if not exists intake_session_id uuid,
  add column if not exists service text,
  add column if not exists intent text,
  add column if not exists source_page text;

create unique index if not exists leads_intake_session_idx
  on public.leads (intake_session_id)
  where intake_session_id is not null;
```

Afwijkingen t.o.v. het voorstel: `leads.status` is een tekstkolom zonder enum, dus `alter type lead_status add value 'draft'` was niet nodig — `draft` kan direct. `price_status` bestond al. De index is partieel zodat leads zonder sessie niet met elkaar botsen.

De unieke index maakt de draft-update idempotent: dezelfde sessie werkt het concept bij in plaats van een tweede lead aan te maken.

## Nog niet omgezet

`src/lib/booking-paths.ts` staat er nog ongewijzigd; `routing.ts` is de opvolger maar geeft spoedpagina's nu wél een intake mee. Die gedragswijziging verandert wat er op `/spoed-elektricien-amsterdam` en `/stroomstoring-amsterdam` getoond wordt, dus dat is een aparte stap.
