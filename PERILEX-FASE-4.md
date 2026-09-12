# Perilex fase 4 — bijlagen en documentverwerking

## Status
- Perilex blijft **uitgeschakeld** (`enabled: false`); de upload-endpoint weigert met 403 zolang de dienst niet actief is.
- Groepenkast is **ongewijzigd**: limieten (3 bestanden, 20 MB per foto, 60 MB totaal, geen PDF), prijzen, flow en Telegram-meldingen zijn niet aangeraakt.
- `derivePerilexBookingResult` blijft de enige inhoudelijke beslisbron; de server herberekent iedere Perilexprijs.

## Gewijzigde en nieuwe bestanden
- migratie: tabel `quote_request_attachments` (categorie, originele naam, opslagpad, MIME, grootte, hash, status, `retention_expires_at`), alleen leesbaar voor beheerders, volledige toegang voor serverlogica.
- `src/lib/booking/attachments.ts` — categorieën, limieten per dienst, magic-byte-detectie, veilige bestandsnamen, UUID-opslagpaden, `requiredFollowUpItems`, bewaartermijn.
- `src/lib/booking/attachments.test.ts` — validatie- en limiettests.
- `src/lib/booking/attachment-upload.ts` — client-precheck, verkleinen, upload met status per bestand.
- `src/routes/api/public/perilex-attachment.ts` — gecontroleerde upload naar de private bucket `quote-attachments`.
- `src/components/booking/steps/perilex-attachments.tsx` en `src/components/perilex-booking.tsx` — bijlagestap NL/EN.
- `src/routes/api/public/quote-request.ts` — koppelt opgeslagen bijlagen aan de aanvraag en schrijft `required_follow_up_items`.

## Limieten (werkelijk afgedwongen)
Perilex: max 8 bestanden, afbeelding 12 MB, PDF 15 MB, totaal 40 MB, afbeeldingen client-side verkleind richting ~1,5 MB. PDF wordt nooit gecomprimeerd.

## Beveiliging
Private bucket, opslagpad `perilex/<draft-uuid>/<attachment-uuid>.<ext>` zonder klantgegevens of originele bestandsnaam. Gecontroleerd worden: extensie, opgegeven MIME **en** bestandssignature (PDF `%PDF-`, JPEG, PNG, WebP, HEIC). Geblokkeerd: SVG, HTML, scripts, uitvoerbare bestanden, dubbele extensies, padmanipulatie. Geen publieke URL's; geen bestand of link naar Telegram.

## Betrouwbaarheid
Dubbele opslag wordt voorkomen via concept-id + bijlage-id en een inhoudshash. Een mislukte upload wist de aanvraag nooit; per bestand tonen we bezig / opgeslagen / mislukt met opnieuw proberen, of "later aanleveren". Mislukt opslaan van metadata verwijdert het geüploade bestand weer.

## Eerlijk voorbehoud over EXIF
EXIF verdwijnt alleen wanneer een afbeelding daadwerkelijk verkleind wordt (hertekenen via canvas). Kleine JPEG's, HEIC en PDF's gaan ongewijzigd naar de opslag. Volledige metadataverwijdering is werk voor fase 5.

## Bewaartermijn
`retention_expires_at` wordt gevuld op 365 dagen. Er wordt **niets** automatisch verwijderd; dat gebeurt pas na expliciete goedkeuring.

## Controles
Typecheck schoon, 174 tests in 21 bestanden groen.

## Schermafbeeldingen
70 beelden in `/mnt/documents/perilex-bijlagen/`, NL en EN op 360, 390, 768, 1024 en 1440 px: leeg, upload bezig, geslaagd, mislukt, PDF, later aanleveren en keukenrenovatie. Gemaakt via een tijdelijke previewpagina die daarna weer is verwijderd (bewaard buiten het project, in `/tmp/browser/perilex/`).

## Nodig voor fase 5
Beveiligde interne bekijklink voor beheerders, opruimtaak voor verweesde bestanden, volledige metadataverwijdering, en pas daarna eventueel activeren van Perilex.
