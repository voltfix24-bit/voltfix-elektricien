# Perilex fase 5A — interne beoordeling, beveiligde bestanden, Telegram-doorschakeling

**Status:** Perilex blijft `enabled: false`. De publieke Perilexpagina, de CTA's en de groepenkastflow zijn niet gewijzigd.

## 1. Eén aanvraag, één bron van waarheid

Geen kopie van klant-, adres- of aanvraaggegevens. Additief model naast `quote_requests` en `leads`:

- `quote_request_assessments` — `quote_request_id` (UNIQUE, FK CASCADE), `lead_id` (FK SET NULL), `service_id`, `assessment_status`, `decision`, `checklist` (jsonb, stabiele codes), `safety_flags`, `work_items`, `missing_info`, `internal_notes`, `priority_requested`, `availability_confirmed_by/_at`, `price_rule_id`, `amount_ex_vat_cents`, `price_snapshot`, `catalog_version`, `assigned_to`, `decided_by/_at`, `version`, tijdstempels.
- `quote_request_assessment_events` — append-only: `event_type`, `field`, `old_value`, `new_value`, `actor_id`, `reason`, `created_at`. Alleen codes en statussen in de payload, geen volledige persoonsgegevens.
- `attachment_access_log` — `attachment_id`, `quote_request_id`, `actor_id`, `action` (`view`/`download`), `created_at`. De signed URL zelf wordt nooit opgeslagen.

RLS: lezen/schrijven alleen voor `has_role(auth.uid(),'admin')`; events en toegangslog zijn alleen-lezen voor admins en worden server-side geschreven.

## 2. Statussen

`new`, `in_review`, `waiting_customer`, `ready_fixed_price`, `survey_proposed`, `survey_scheduled`, `quote_required`, `safety_contact_required`, `scheduled`, `completed`, `cancelled`. Toegestane overgangen staan in `allowedAssessmentTransitions`; `saveAssessmentDraft`, `setAssessmentStatus` en `decideAssessmentFn` weigeren server-side elke niet-toegestane overgang (`invalid_transition`). Dit is een interne laag naast de bestaande leadstatus — geen tweede statusmachine voor leads.

## 3. Technische checklist

Twaalf stabiele codes met vaste antwoordopties (`existing_perilex_socket`, `socket_condition`, `working_suitable_circuit`, `supply_phase`, `circuit_type`, `protection_suitable`, `cable_suitable`, `appliance_model_known`, `manufacturer_diagram_available`, `install_location_ready`, `kitchen_drawing_available`, `extra_survey_or_measurement_needed`). Negen werkzaamheden, waarvan `new_cable`, `new_circuit`, `consumer_unit_change`, `move_connection_point` en `construction_work` een vaste prijs uitsluiten. Een concept kan altijd tussentijds worden opgeslagen zonder eindbeslissing.

## 4. Veiligheid

Zes markeringen; kritiek zijn stopcontact/stekker warm, brandlucht/vonken/verkleuring, onveilige situatie vermoed en direct telefonisch contact nodig. Een kritieke markering toont een opvallende waarschuwing, blokkeert elke automatische vaste prijs (`safety_flag_blocks_fixed_price`) en biedt een interne belactie. De klantstatus verandert nooit automatisch.

## 5. Beslissingen en prijs

Alle bedragen komen uitsluitend uit de centrale Perilex-catalogus en worden server-side herberekend:

| Beslissing | Prijsregel | Bedrag |
| --- | --- | --- |
| `fixed_existing_standard` | `existing_connection_standard` | € 120 excl. btw |
| `fixed_existing_priority_24h` | `existing_connection_priority_24h` | € 145 excl. btw |
| `site_survey` | `site_survey` | € 90 excl. btw, volledig verrekenbaar |

€ 120 alleen bij bevestigde bestaande bruikbare aansluiting en groep. € 145 alleen als de klant voorrang heeft gevraagd **én** een bevoegde medewerker de beschikbaarheid expliciet heeft bevestigd (bevestiger + tijdstip opgeslagen); een verzoek is geen gegarandeerde afspraak. Zwaar werk of onvoldoende zekerheid → schouw of offerte. Handmatige vrije bedragen zijn niet mogelijk. Overige uitkomsten: `additional_information_required`, `custom_quote_required`, `safety_contact_required`, `outside_service_area`, `declined`.

## 6. Interne UI

Geïntegreerd in de bestaande leaddetailweergave (`lead-sheet.tsx`) als sectie tussen Foto's en Tijdlijn — geen tweede dashboard, geen modal in een modal. Volgorde: status en beslissing, veiligheidswaarschuwing, bijlagen, technische checklist, veiligheid, werkzaamheden, ontbrekende informatie, interne toelichting, voorrang, beslissing, auditgeschiedenis. Mobiel stapelt alles, inputs zijn `text-base`, aanraakdoelen 48px, de opslaanbalk is sticky met spacer zodat niets overlapt, en onopgeslagen wijzigingen staan expliciet in die balk.

## 7. Beveiligd bekijken van bijlagen

`createAttachmentViewUrl` is admin-gated, geeft een signed URL van maximaal 300 seconden, weigert PDF's en logt `view`. PDF's lopen via `POST /api/admin/attachment`: bearer-token, `has_role`-controle, `Content-Disposition: attachment`, `X-Content-Type-Options: nosniff`, `Cache-Control: no-store`, CSP `default-src 'none'; sandbox`, en logt `download`. Verlopen links worden niet stil verlengd; de gebruiker vraagt opnieuw. Geen permanent opslagpad in Telegram of publieke UI.

## 8. EXIF en bewaartermijn

`sanitizeImageBytes` draait nu **server-side in de uploadroute** vóór permanente opslag: JPEG verliest alle APPn-segmenten (GPS, XMP, IPTC) en krijgt alleen `Orientation` terug; PNG verliest `eXIf`/`tEXt`/`zTXt`/`iTXt`/`tIME`; WebP verliest `EXIF`/`XMP` en de vlaggenbyte in `VP8X` wordt gereset. De uitkomst staat per bestand in `sanitization_status`. PDF-inhoud wordt niet gewijzigd (`not_applicable`). `retention_expires_at` bestaat; `attachmentRetentionDryRun` rapporteert alleen — er verwijdert niets automatisch.

**Releaseblokkade:** HEIC is niet betrouwbaar te normaliseren zonder externe decoder. Zulke bestanden krijgen `metadata_retained` en dat wordt in de bijlagenlijst getoond. Zolang dit openstaat mag Perilex geen HEIC-uploads in productie accepteren.

## 9. Telegram

`buildAssessmentNotification` levert uitsluitend dienst, intentie, route, prijsstatus, aangevraagde prioriteit, postcodegebied, aantal en categorieën bijlagen, plus een beveiligde knop naar de bestaande beveiligde leadweergave. Geen foto's, PDF's, storage-URL's, signed URLs, keukentekening, fabrikantschema of interne notities. Verzending loopt over de bestaande meldingenwachtrij; er is geen nieuwe wachtrij en er is in deze fase geen echte melding verstuurd.

## 10. Gelijktijdigheid en autorisatie

Bestaande rollen en RLS; elke serverfunctie doet `assertAdmin` via de `has_role` RPC. Alleen lezen geeft geen schrijfrechten. Optimistic concurrency via `version`: een opslag met een verouderde versie wordt geweigerd met `version_conflict` en de UI toont een begrijpelijke melding met een herlaadknop in plaats van stil te overschrijven. Alle beslissingen worden server-side herberekend; de client stuurt nooit een bedrag.

## Tests

200 tests in 23 bestanden groen, typecheck schoon. Gedekt: statusovergangen (geldig en ongeldig), checklistnormalisatie, veiligheidsmarkering blokkeert vaste prijs, onvoldoende technische zekerheid blokkeert vaste prijs, zwaar werk → offerte, € 145 zonder bevestigde beschikbaarheid geweigerd, € 145 zonder klantverzoek geweigerd, serverherberekening € 120/€ 145/€ 90 uit de catalogus, notificatiepayload zonder bestanden of storagepaden, EXIF-verwijdering met een echt testbestand met GPS-coördinaten (GPS weg, oriëntatie behouden, bestand geldig en idempotent), en de groepenkastregressie.

## Nog open

- Screenshots op 360/390/768/1024/1440 zijn nog niet gemaakt: de beoordeling vereist een echte `quote_requests`-rij met bijlagen en Perilex staat uit, dus die beelden vragen om een gemockte dataset. Ik heb dat niet stilzwijgend met testdata in de database opgelost.

## Bevestiging

Perilex is publiek en server-side uitgeschakeld (`enabled: false`; de uploadroute geeft 403). De groepenkastflow, de publieke Perilexpagina en de CTA's zijn ongewijzigd. Er is geen klantlink gebouwd (fase 5B), geen nieuwe meldingenwachtrij aangemaakt, geen automatische bestandsverwijdering geactiveerd en geen echte klantdata gebruikt.
