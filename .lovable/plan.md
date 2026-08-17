# Check: LocalBusiness structured data (read-only)

Gecontroleerd op de live SSR-HTML van 7 pagina's (`/`, `/contact`, `/spoed-elektricien-amsterdam`, `/elektricien-amsterdam-zuid`, `/en-gb`, `/over-ons`, `/groepenkast-amsterdam`). Alle JSON-LD-blokken parsen zonder fouten en staan in de server-HTML (dus zichtbaar voor Google en AI-crawlers).

## Wat goed staat

- **Eén samenhangende `@graph`** op elke pagina: `Organization` + `LocalBusiness/Electrician` + `WebSite` + `Person`, gekoppeld via `@id` (`#organization`, `#business`, `#website`, `#hassan`).
- **NAP klopt en komt overeen met Google**: Jacob van Lennepkade 142, 1053 MV Amsterdam, telefoon +31645193589.
- **Twee LocalBusiness-blokken per pagina is geen fout**: beide gebruiken `@id` `.../#business`, dus Google voegt ze samen tot één entiteit. Het tweede blok levert `aggregateRating` (4,9 / 57) plus losse `Review`-nodes.
- **Juridische scheiding is correct**: `Organization` draagt het KvK-adres in Zaandam, `LocalBusiness` het bezoekadres in Amsterdam. Zo ontstaat er geen adresconflict.
- Volledige `areaServed` (GeoCircle 25 km + 16 steden/wijken), `hasOfferCatalog` met prijzen, `hasCredential` (VCA, ISO 9001, SBB), `Person`-node met LinkedIn en opleidingen — sterke E-E-A-T-signalen.
- KvK en BTW als `identifier` (`PropertyValue`) plus `vatID` / `taxID`.

## Bevindingen (geen blokkerende fouten)

| # | Bevinding | Impact |
|---|---|---|
| 1 | `Organization`-node heeft geen `logo` en geen `image`. Google's Organization-logo-feature vereist `logo`. | Middel |
| 2 | `LocalBusiness.logo` wijst naar `/favicon.png` (klein icoon), niet naar het echte VoltFix-logo. | Middel |
| 3 | `geo` = 52.3625 / 4.8636 → valt ~200 m naast het pand (Kanaalstraat). | Laag (bewust niet aangepast) |
| 4 | Conflicterende `openingHoursSpecification`: ma-vr 08:00-18:00 én 24/7. Google Bedrijfsprofiel zegt "24 uur geopend". | Laag/Middel |
| 5 | WhatsApp-`ContactPoint` heeft `contactOption: "TollFree"` — dat betekent gratis nummer, niet van toepassing. | Laag |
| 6 | `sameAs` gebruikt de korte `share.google/...`-link i.p.v. de volledige Maps-place-URL. | Laag |
| 7 | Op `/en-gb/*` is de graph-inhoud (description, slogan) Nederlandstalig. | Laag |
| 8 | Losse `WarrantyPromise`-nodes op topniveau zijn niet aan een product/dienst gekoppeld. | Zeer laag |
| 9 | `bingPlaces` staat leeg en valt uit `sameAs`. | Informatief |

## Voorgestelde vervolgstappen (alleen na akkoord)

1. `logo` toevoegen aan de `Organization`-node en beide `logo`-velden laten wijzen naar het echte logo-bestand i.p.v. de favicon.
2. Openingstijden gelijktrekken met Google: één 24/7-specificatie, met de kantoortijden alleen als toelichting in `description`.
3. `contactOption: "TollFree"` van het WhatsApp-contactpunt verwijderen.
4. `sameAs` de volledige Google Maps place-URL laten gebruiken.
5. Optioneel: Engelse `description` / `slogan` in de graph op `/en-gb/*`.

Punt 3 uit de bevindingen (geo-coördinaten) blijft bewust ongewijzigd, zoals afgesproken.
