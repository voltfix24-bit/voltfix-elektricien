# Fase 1: Groepenkast-catalogus + offertegenerator v1 (plan, nog niets bouwen)

## 1. Huidige architectuur en hergebruik (gecontroleerd)

| Onderdeel | Nu | Hergebruik |
|---|---|---|
| Bedragen | `src/lib/pricing.ts` `prices.*` (hele euro's incl. btw) | Bron voor eenmalige seed; daarna fallback |
| Pakketten/opties | `src/lib/groepenkast.ts`: `groupPackages` (single/three/extended), `groupOptions` (induction, solar, rcbo, socket, bell, surge), extra groep €35 max 12, schouw €90, merken (uitgeschakeld) | ID's blijven exact gelijk (zod-enum + bestaande snapshots) |
| Berekening | `groupTotal()`; server herberekent in `src/routes/api/public/quote-request.ts` en slaat `price_snapshot` + `catalog_version` op, 409 bij versieverschil | Zelfde contract, nieuwe catalogusbron |
| Versie | `groepenkastCatalogVersion` (historische, niet-canonieke string) in `src/lib/booking/pricing-catalog.ts` | Bestaande string blijft geldig als "versie 0" |
| Bedrag-split | `src/lib/booking/money.ts` `breakdownFromIncVat` | Btw-berekening offerte |
| Dossiers | `leads` (incl. `customer_price_cents`, los van `price_cents`), `quote_requests` | Offerte koppelt aan `lead_id`; `customer_price_cents` wordt niet automatisch overschreven |
| Admin | `admin.functions.ts`, `has_role(...,'admin')`, `lead-sheet.tsx`, admin-shell | Nieuwe server functions + schermen in bestaand patroon |
| Branding | `src/lib/business.ts`, `src/assets/logos/*.svg` | Kop/voet PDF |

## 2. Databaseschema (alles additief)

```text
catalog_services        id text pk ('groepenkast'), name, active
catalog_versions        id uuid, service_id, version_no int, status draft|published|archived,
                        version_key text (gelijk aan oude string voor v0), created_by, published_by,
                        published_at, note; uniek: max 1 draft + 1 published per dienst
catalog_items           id uuid, version_id, item_key text ('single','induction',...),
                        kind package|option|extra_unit|survey|brand|component|labour,
                        label_nl, label_en, description_nl/en, price_inc_vat_cents,
                        vat_rate_bps (2100), unit, min_qty, max_qty, sort,
                        active, show_on_website, show_in_quotes, meta jsonb
catalog_package_components  version_id, package_key, component_key, qty  (standaard technische config)
catalog_audit           id, version_id, actor_id, action, diff jsonb, created_at
quotes                  id uuid, quote_number text uniek, lead_id fk, quote_request_id null,
                        service_id, catalog_version_id, status, revision int, parent_quote_id,
                        language, customer_snapshot jsonb, business_snapshot jsonb,
                        subtotal_ex_vat_cents, vat_cents, total_inc_vat_cents, valid_until,
                        internal_note, created_by, finalized_at, finalized_by, sent_at, accepted_at,
                        declined_at, pdf_path, created/updated_at
quote_items             id, quote_id, sort, catalog_item_key null, kind, label, description,
                        qty numeric, unit, catalog_unit_price_cents, unit_price_inc_vat_cents,
                        vat_rate_bps, line_total_inc_vat_cents, override_reason text,
                        is_internal bool (technisch onderdeel niet op klant-PDF)
quote_events            id, quote_id, actor_id, event, data jsonb, created_at
quote_number_counters   year int pk, last_no int  (atomaire nummering)
```

- Items worden nooit verwijderd: publiceren kopieert naar een nieuwe versie; `active=false` verbergt.
- Prijsafwijking per regel vereist `override_reason` (trigger-validatie, geen CHECK op tijd).
- `quotes` na `final` onveranderbaar (trigger); wijzigen = nieuwe revisie.
- Grants: authenticated + service_role; RLS alleen `has_role(admin)`. Website leest gepubliceerde catalogus via server function met beperkte publieke selectie (geen anon-toegang tot drafts).
- Storage: privé bucket `quotes` voor PDF's.

## 3. Admin UX en flow

1. **Catalogus** (`/admin/catalogus`): tabel gepubliceerd vs concept, bewerken in concept, verschil-overzicht, knop "Publiceren" met bevestiging, versiegeschiedenis + audit.
2. **Lead-sheet**: knop "Offerte maken" (voorgevuld uit lead/quote_request-snapshot: pakket, opties, extra groepen, adres).
3. **Configurator** (`/admin/offertes/$id`): pakket kiezen → standaardcomponenten tonen (intern) → opties/aantallen → vrije regels → prijsafwijking met verplichte reden → totalen ex/incl btw live.
4. **Preview** (klantversie, NL/EN) → **Definitief** (nummer toegekend, snapshot bevroren) → PDF downloaden.
5. Verzenden v1: PDF-download + "Kopieer WhatsApp-tekst"; statusknoppen verzonden/geaccepteerd/afgewezen handmatig. E-mail later (buiten scope).
6. Overzicht `/admin/offertes` met filters op status.

## 4. Website-integratie zonder downtime

- Stap A: tabellen + seed-script dat waarden letterlijk uit `prices`/`groupPackages`/`groupOptions` leest en versie 1 publiceert met `version_key = groepenkastCatalogVersion` (zelfde string ⇒ geen 409 voor lopende aanvragen).
- Stap B: `getPublishedCatalog('groepenkast')` (server, gecachet), met fallback naar de huidige constanten als de database faalt.
- Stap C: website (prijzen, FAQ, booking-stappen, JSON-LD) en `quote-request.ts` lezen via één adapter die dezelfde vorm teruggeeft als `groupPackages`/`groupOptions`. Server accepteert de versie die de client toonde óf de huidige; anders 409 zoals nu.
- Stap D: pas na stabiele periode worden de constanten in `pricing.ts` als "seed/fallback" gemarkeerd, niet verwijderd.
- Zod-enum voor pakket/optie blijft voorlopig hard; nieuwe catalogus-keys op de website vereisen bewust een codewijziging (veilig).
- SSR/prerender: catalogus in route-loader via publieke server function, zodat SEO-tekst gelijk blijft.

## 5. Offerte- en PDF-model

- Nummering: `VF-2026-0001` per jaar, toegekend bij definitief (concepten tonen "CONCEPT").
- Statussen: `draft → final → sent → accepted | declined | expired`; `superseded` bij nieuwe revisie.
- Geldigheid standaard 30 dagen (open beslissing).
- PDF server-side gegenereerd, worker-compatibele bibliotheek (bv. `pdf-lib`), opgeslagen in privé storage, download via ondertekende URL. Bevat: logo, NAW/KvK/btw uit `business.ts`, klant, adres, regels (zonder interne componenten), ex btw / btw 21% / incl btw, garantie uit `warranties`, voorwaarden, geldigheid.

## 6. Permissies, audit, validatie

- Alle server functions `requireSupabaseAuth` + admin-check via `has_role`.
- Bedragen integer centen; server herberekent totalen, client-totalen nooit vertrouwd.
- Audit: `catalog_audit` (elke concept-wijziging + publicatie), `quote_events` (aanmaak, afwijking, definitief, PDF, status).
- Concurrency: publiceren met versienummer-controle; offerte bewerken met `revision`.
- Test-dossiers (`is_test`) krijgen testnummering of markering.

## 7. Fasen, tests, rollback

| Fase | Inhoud | Tests | Rollback |
|---|---|---|---|
| 1a | Schema + seed v1 | seed-waarden == `prices`; version_key == oude string | Tabellen ongebruikt laten |
| 1b | Catalogusbeheer admin | concept/publiceren, geen hard delete, audit | Scherm uitzetten |
| 1c | Website leest catalogus achter vlag `CATALOG_SOURCE=db` | bestaande booking/activation/pricing-catalog tests ongewijzigd groen; fallback-test | Vlag terug naar code |
| 1d | Offerte-engine (generiek `service_id`) | totalen/btw, override vereist reden, final onveranderbaar, nummering uniek | Feature verbergen |
| 1e | PDF + WhatsApp-tekst + statussen | PDF bevat geen interne regels; snapshot ongewijzigd na catalogus-publicatie | Alleen preview |

Bestanden geraakt: nieuw `src/lib/catalog/*` (adapter, server, types), `src/lib/quotes/*` (engine, pdf, nummering), `src/lib/catalog.functions.ts`, `src/lib/quotes.functions.ts`, routes `src/routes/_authenticated/admin.catalogus.tsx`, `admin.offertes.tsx`, `admin.offertes.$id.tsx`; aangepast `src/lib/groepenkast.ts`, `src/lib/booking/pricing-catalog.ts`, `src/lib/booking/activation.ts`, `src/routes/api/public/quote-request.ts`, `src/components/admin/lead-sheet.tsx`, admin-shell (menu), `AGENTS.md`, `docs/booking/architecture.md`.

## 8. Open beslissingen met Hassan

1. Prijzen in catalogus incl. btw (zoals nu) of ex btw opslaan?
2. Welke technische componenten per pakket (aantal groepen, ALA's, hoofdschakelaar, merk)?
3. Merkkeuze (Eaton/ABB) in offerte nu al aan, op website nog uit?
4. Offertenummer-formaat en geldigheidsduur (30 dagen?).
5. Mag een offerte onder catalogusprijs zonder tweede goedkeuring? Maximum korting?
6. Aanbetaling/betaalvoorwaarden en algemene voorwaarden op PDF?
7. Klantakkoord v1 handmatig, of later online akkoordlink?
8. Wordt `customer_price_cents` van de lead automatisch gevuld bij geaccepteerde offerte?
9. Wie mag publiceren: alleen eigenaar of elke admin?
10. Schouwkosten €90 als verrekenregel op offerte tonen?
