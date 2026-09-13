# Perilex fase 5A — Quality Gate rapport

Perilex staat server-side uit (`src/lib/booking/services/perilex.ts` → `enabled: false`,
`enabledBookingServices()` filtert daarop). Groepenkast en de publieke Perilexpagina zijn
niet gewijzigd. Er is geen Telegrambericht verstuurd en geen enkele rij in de database
aangemaakt voor dit bewijsmateriaal.

## 1. Statuseigenaarschap — één hoofdstatus

| Laag | Veld | Eigenaar | Waarden |
| --- | --- | --- | --- |
| Commercieel/operationeel (leidend) | `leads.status` | leadflow (dispatch, claim, annulering) | `new`, `dispatched`, `claimed`, `cancelled`, `spam_review`, `blocked_spam` |
| Interne beoordeling | `quote_request_assessments.assessment_status` | beoordelingspaneel | `not_started`, `in_review`, `waiting_customer`, `ready`, `closed` |
| Technische uitkomst | `decision` | beoordelingspaneel | o.a. `fixed_existing_standard`, `fixed_existing_priority_24h`, `site_survey`, `outside_service_area`, `declined` |

Regels:

- De beoordelingslaag kent géén operationele waarden (geen "ingepland", "uitgevoerd",
  "geclaimd"); planning en uitvoering blijven uitsluitend bij de lead.
- Toegestane overgangen staan in `allowedAssessmentTransitions` /
  `canTransitionAssessment`; de server weigert de rest met `invalid_transition`.
- Tegenstrijdige combinaties worden geweigerd door `findStatusConflicts`
  (`lead_closed_with_open_assessment`, `lead_claimed_with_open_information_request`,
  `assessment_closed_while_lead_active`, `closing_decision_without_closed_assessment`,
  `priced_decision_on_closed_assessment`).
- Sluit de lead (geannuleerd/geblokkeerd), dan volgt de beoordeling automatisch via
  `reconcileAssessmentStatus` — de lead is dus altijd de eigenaar.

Tests: toegestane combinaties én elke conflictcode zijn afgedekt in
`src/lib/booking/perilex-assessment.test.ts`.

## 2. Rollen en bevoegdheden

De database kent alleen `app_role = admin | user`. Er is géén rol toegevoegd en RLS is
niet verbreed. De matrix staat in `src/lib/perilex-permissions.ts`:

| Recht | admin | user | klantlink (fase 5B) |
| --- | --- | --- | --- |
| `assessment.read` | ja | nee | beperkt, later te bepalen |
| `assessment.write` / `.decide` / `.status` / `.confirm_availability` | ja | nee | nooit |
| `assessment.read_internal_notes` | ja | nee | nooit |
| `assessment.read_pricing_decision` | ja | nee | nooit |
| `attachment.view` / `.download` | ja | nee | later, per bijlage |
| `attachment.read_access_log` | ja | nee | nooit |

`customerLinkForbidden` legt nu al vast dat interne notities en prijsbeslissingen
buiten een klantlink vallen. Serverzijde blijft `has_role(auth.uid(),'admin')` de
eerste sluis (RLS), de matrix is de tweede.

## 3. WebP-sanitizer

`sanitizeWebp` in `src/lib/image-sanitize.ts` wijzigt uitsluitend de EXIF- en
XMP-vlaggen (bit 3 en bit 2) in byte 8 van de VP8X-chunk en verwijdert de
bijbehorende chunks. ICC-profiel, alfa-vlag en overige vlaggen blijven onaangeroerd,
zodat het bestand decodeerbaar blijft. `isAnimatedWebp` herkent `ANIM`/`ANMF` en het
animatiebit; `validateAttachment` weigert die bestanden met `animated_image_not_allowed`.

Tests dekken: JPEG met GPS en oriëntatie, PNG met tekst/EXIF en transparantie, WebP met
EXIF, transparante WebP (alfa blijft), geanimeerde WebP (geweigerd) en beschadigde
bestanden (nette fout, geen crash). Na verwerking wordt de header opnieuw gevalideerd
als decodeerbewijs.

## 4. HEIC

- `perilex.allowedMimes` accepteert geen `image/heic`; de server neemt nooit HEIC aan.
- In de browser zet `prepareAttachmentFile` HEIC om naar JPEG via een dynamisch geladen
  decoder (`await import('heic-to')`), met voortgangsmelding; de metadata-reiniging draait
  daarna opnieuw op het JPEG-resultaat.
- Mislukt de omzetting, dan volgt een duidelijke fout (`heic_conversion_failed`) en gaat
  er niets naar de server. Dit is dus een oplossing, geen weigering.

## 5. Visueel bewijs zonder klantdata

- Fixtures: `src/lib/booking/perilex-assessment-fixtures.ts` (5 scenario's: vaste prijs,
  veiligheidsblokkade, ontbrekende informatie, spoed onbevestigd, opname nodig).
- Dev-route: `/dev-preview/beoordeling` — rendert het échte paneel, doet geen database-
  schrijfacties en is niet bereikbaar in productie.
- Screenshots op 360, 390, 768, 1024 en 1440 px staan in
  `/mnt/documents/perilex-5a-qa/` (25 bestanden, één per scenario per breedte).

Geautomatiseerde controle per opname: geen horizontale scroll, geen overlappende
elementen, invoervelden 16px (geen mobiele zoom), aanraakdoelen ≥ 44px, geen
tegenstrijdige status/prijs, geen klantgegevens. Resterende observaties:

- De veldbijschriften (11,5px, hoofdletterlabels) volgen de vastgelegde huisstijl uit
  opdracht F en blijven bewust zo.
- Eén `label` van 15px hoog is een bijschrift, geen aanraakdoel.
- De 400-meldingen in de console komen van een extern Cloudflare-script, niet van de app.

## 6. Integriteit

- Typecontrole: schoon (`tsgo --noEmit`).
- Tests: 261 geslaagd in 25 bestanden, waaronder groepenkast, de centrale prijscatalogus,
  de Telegramwachtrij, privébijlagen en admin-only gedrag.
- Signed URL's: TTL vast op 300 seconden (`SIGNED_URL_TTL_SECONDS`).
- Perilex server-side uit; groepenkast ongewijzigd.

## Openstaande punten

- Klantlink (fase 5B) is bewust niet gebouwd; de rechtenmatrix reserveert er al ruimte voor.
- Een tweede rol (bijvoorbeeld monteur) vraagt een migratie op de enum plus tests; nu
  bewust niet gedaan.
