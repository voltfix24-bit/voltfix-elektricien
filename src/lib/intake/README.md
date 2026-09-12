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

## Aannames die je moet checken

1. **Spoeddiagnose**: de code gebruikt `prices.emergencyFirstHour` (€120). De briefing noemde €95. Kies één waarde.
2. **Eerste vrije dag** ligt twee dagen vooruit, zondag dicht — zie `eersteVrijeDag()`. Koppel je een echte agenda, dan vervang je alleen die functie.
3. **Werkgebied** staat in `service-area.ts` als postcodereeksen. Vijf plaatsen, allemaal zonder voorrijkosten.
4. **Draft-leads mogen geen notificatie afvuren.** `lead-dispatch.server.ts` en `lead-reminders.server.ts` moeten status `draft` expliciet overslaan.

## Migratie

```sql
alter type lead_status add value 'draft';
alter table leads
  add column intake_session_id uuid,
  add column service text,
  add column intent text,
  add column price_status text,
  add column source_page text;
create unique index leads_intake_session_idx on leads (intake_session_id);
```

De unieke index maakt de draft-update idempotent: dezelfde sessie werkt het concept bij in plaats van een tweede lead aan te maken.
