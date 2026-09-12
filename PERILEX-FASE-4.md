# Perilex fase 4 — tussencontrole (bijlagen + mobiele upload-UX)

Datum: 13-09-2026. Perilex blijft `enabled: false`; groepenkast ongewijzigd.

## 1. Waren de eerdere beelden echt of een testharnas?

**Testharnas.** De eerdere beelden kwamen uit een losse previewpagina die alleen
het stapcomponent binnen de gewone websitelayout rendert. Daardoor stonden de
websiteheader, de footer, de cookieknoppen, de bel-/WhatsAppbalk en de oude
kaart "Vraag een tijd aan" in beeld.

De echte flow (`src/components/perilex-booking.tsx`) staat al volledig in de
gedeelde `BookingShell`, net als groepenkast: overlay-modal op desktop,
schermvullend op mobiel, vaste bovenbalk (titel, stapnaam, voortgang, sluiten),
vaste onderbalk (prijs/status, terug, één primaire knop) en de site eromheen
afgeschermd. In de nieuwe beelden is dat zichtbaar. Er is dus **geen**
productiecode aangepast voor punt 1; oude afspraakcomponenten komen niet in de
flow voor (de stap rendert uitsluitend `PerilexAttachmentsStep`).

## 2. Welke zichtbare problemen bestonden werkelijk?

Deze zaten wél in de echte flow en zijn opgelost:

- de bestandskaart zette naam, status én categorieveld in één smalle kolom
  naast de actieknoppen, waardoor het categorieveld werd samengedrukt;
- de bestandsnaam werd afgekapt;
- de teller toonde `2/8` en maakte geen onderscheid tussen opgeslagen en
  mislukt;
- de tekst "later aanleveren" was altijd hetzelfde, ook als er al bestanden
  opgeslagen waren;
- bij een fout stond de status dubbel ("Uploaden mislukt · Uploaden mislukt…").

## 3. Gewijzigde bestanden

- `src/components/booking/steps/perilex-attachments.tsx` — enige gewijzigde
  bestand. Nieuwe kaartindeling (rij 1: miniatuur/pictogram + volledige naam +
  actieknoppen; rij 2: grootte; rij 3: status; rij 4: label + categorieveld op
  volle kaartbreedte), ondubbelzinnige teller, situatie-afhankelijke
  later-tekst, en één foutregel in plaats van dubbele tekst.
- Geen migratie, geen serverwijziging, geen wijziging aan groepenkast, aan de
  publieke Perilexpagina of aan de CTA's.

## 4. Tellerlogica

- **opgeslagen** = bestanden met status `uploaded`, dus alleen door de server
  bevestigde opslag.
- **mislukt** = bestanden met status `failed`; deze worden apart getoond en
  nooit als opgeslagen meegeteld.
- **slotreservering:** een mislukt bestand houdt zijn slot bezet zolang het in
  de lijst staat. Opnieuw proberen gebruikt hetzelfde slot (zelfde
  `attachmentId`, dus geen dubbele bijlage); verwijderen geeft het slot direct
  vrij en de teller klopt meteen.
- Weergave: `1 opgeslagen · 1 mislukt · maximaal 8`; zonder fouten alleen
  `1 opgeslagen · maximaal 8`.
- Overzicht en aanvraagdata tellen eveneens uitsluitend `uploaded`; de server
  koppelt alleen rijen met `status: stored` aan de aanvraag.

## 5. Later aanleveren

- Zonder opgeslagen bestanden: "Ik lever de gevraagde bestanden later aan" /
  "I will send the requested files later".
- Met opgeslagen bestanden: "Ik lever eventuele ontbrekende bestanden later
  aan", met de toevoeging "Wat je al hebt geüpload blijft bewaard."
- Een uploadfout vinkt dit nooit automatisch aan; de klant kiest zelf.
- Wat nog ontbreekt blijft machineleesbaar in `required_follow_up_items` in
  `service_answers`.

## 6. Controlepunten fase 4

| Punt | Status |
| --- | --- |
| Private opslag, geen publieke bestands-URL | Ja — bucket `quote-attachments` is privaat; de uploadroute maakt geen publieke URL. |
| MIME- én magic-bytecontrole | Ja — `detectAttachmentSignature` naast het gedeclareerde MIME-type. |
| PDF/HEIC-limieten | Ja — PDF max. 15 MB, afbeelding max. 12 MB, totaal 40 MB, 8 bestanden. |
| Geen bestanden of links in Telegram | Ja voor Perilex — bijlagen staan in `quote_request_attachments`, niet in `attachment_paths`; de Telegramcode leest alleen `attachment_paths` (bestaand groepenkastgedrag, ongewijzigd). |
| Retry geeft geen dubbele bijlage | Ja — zelfde `attachmentId`, plus hashcontrole op serverzijde. |
| Groepenkast ongewijzigd | Ja — geen bestand van die flow aangeraakt; limieten blijven 3 bestanden / 20 MB / 60 MB. |
| Perilex niet aanvraagbaar | Ja — `enabled: false`, de uploadroute weigert met 403 en de server blijft de dienst afwijzen. |

## 7. Tests en beelden

- Typecheck schoon; `174 tests` in 21 bestanden geslaagd.
- Nieuwe beelden uit de **echte** flow (`/dev-preview/perilex`, dev-only route,
  noindex, 404 in productie), NL en EN, op 360×780, 390×844, 1024×768 en
  1440×900: `/mnt/documents/perilex-fase4/`
  - `ok-…` upload geslaagd met JPG-miniatuur
  - `fail-…` upload mislukt
  - `mixed-…` teller na fout (`1 opgeslagen · 1 mislukt · maximaal 8`), PDF met
    documentpictogram en volledig zichtbare lange categorienaam
  - `later-leeg-…` en `later-met-bestand-…` beide varianten van de tekst
- Geen horizontale scroll op 360 of 390 px; aanraakvlakken blijven 48 px.
- Upload is in deze beelden onderschept op netwerkniveau (de dienst staat
  server-side uit); er is geen echte aanvraag verstuurd en geen Telegrambericht
  verzonden.

## Eerlijk voorbehoud

EXIF verdwijnt alleen wanneer een afbeelding daadwerkelijk wordt verkleind
(canvas hertekent de pixels). Kleine JPEG's, HEIC en PDF gaan ongewijzigd naar
de server.
