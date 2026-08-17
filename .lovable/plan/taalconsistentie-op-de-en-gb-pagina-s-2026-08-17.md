# Taalconsistentie op de /en-gb-pagina's

## Wat ik heb gecontroleerd

Alle 18 live /en-gb-pagina's zijn opgehaald en hun HTML + JSON-LD is geïnspecteerd.

Goed nieuws op paginaniveau: elke EN-pagina heeft correct `<html lang="en-GB">`, `og:locale = en_GB`, `og:locale:alternate = nl_NL` en een `hreflang`-set (en-GB, nl-NL, x-default). De pagina-eigen nodes (WebPage, ContactPage, FAQPage, Service, HowTo) hebben `inLanguage: en-GB`.

Het probleem zit in de **gedeelde entiteiten** die vanuit `__root.tsx` op élke pagina worden meegestuurd. Die worden zonder taal opgebouwd en zijn dus Nederlands, ook op de Engelse pagina's. Daardoor "lopen" en-GB en nl-NL door elkaar heen.

## Pagina's met gemengde taalsignalen (allemaal)

Alle onderstaande pagina's bevatten dezelfde Nederlandstalige gedeelde entiteit:

| Pagina | nl-NL-signalen | en-GB-signalen |
|---|---|---|
| /en-gb | 8 | 10 |
| /en-gb/contact | 8 | 10 |
| /en-gb/faq | 8 | 10 |
| /en-gb/over-ons | 8 | 10 |
| /en-gb/privacy-policy | 8 | 10 |
| /en-gb/cookie-policy | 8 | 12 |
| /en-gb/how-to-assemble-a-fuse-box | 8 | 10 |
| /en-gb/perilex-amsterdam | 9 | 12 |
| /en-gb/groepenkast-amsterdam | 9 | 12 |
| /en-gb/spoed-elektricien-amsterdam | 9 | 12 |
| /en-gb/stroomstoring-amsterdam | 9 | 12 |
| /en-gb/elektricien-amsterdam | 9 | 12 |
| /en-gb/electrical-inspection-amsterdam | 9 | 12 |
| /en-gb/ev-charger-installation-amsterdam | 9 | 12 |
| /en-gb/electrician-amsterdam-zuid | 9 | 11 |
| /en-gb/electrician-amsterdam-west | 9 | 11 |
| /en-gb/electrician-amsterdam-centre | 9 | 11 |
| /en-gb/electrician-amstelveen | 9 | 11 |

(/en-gb/groepenkast-vervangen-amsterdam is enkel een 301-redirect — geen inhoud, geen actie nodig.)

## Wat precies Nederlands is op EN-pagina's

1. `#business` (LocalBusiness + Electrician): `description` en `slogan` volledig in het Nederlands ("VoltFix is een gecertificeerde elektricien…", "Bij spoed binnen 60 minuten in heel Amsterdam").
2. `#business` → `offerCatalog`: alle diensten met Nederlandse namen én Nederlandse URL's (`/groepenkast-amsterdam`, `/perilex-amsterdam`, …), ook wanneer er een Engelse tegenhanger bestaat.
3. `#hassan` (Person): Nederlandse `description`, terwijl `src/data` al een Engelse bio bevat.
4. `termsOfService` op Service-nodes: NL- en EN-zin achter elkaar geplakt in één veld.
5. Review-nodes: Nederlandse reviewteksten zonder `inLanguage`, waardoor Google ze als Engels leest.

## Bewust ongemoeid laten

Dit zijn géén fouten en blijven staan:
- `hreflang="nl-NL"` naar de Nederlandse tegenhanger (verplicht voor tweetalige sites).
- `og:locale:alternate = nl_NL`.
- `knowsLanguage: ["nl","en"]` en `availableLanguage: ["nl-NL","en-GB"]` — het bedrijf spreekt écht beide talen.
- `WebSite.inLanguage: ["nl-NL","en-GB"]` — één site-entiteit voor een tweetalige site.

## Aanpassingsplan

1. **`src/lib/seo.ts` — `localBusinessSchema(locale)`**: optionele locale-parameter. Bij `en` Engelse `description` en `slogan` gebruiken.
2. **`src/routes/__root.tsx`**: de al aanwezige pathname-detectie (`/en-gb`) hergebruiken om die locale door te geven aan `localBusinessSchema()`.
3. **offerCatalog taalbewust maken**: bij `en` de Engelse dienstnamen en `/en-gb/*`-URL's gebruiken waar die bestaan; diensten zonder EN-pagina vallen terug op de NL-URL.
4. **Person-node**: `personSchema` krijgt de paginalocale mee vanuit de graph, zodat de Engelse bio en jobTitle verschijnen op EN-pagina's.
5. **`termsOfService`**: één zin in de taal van de pagina in plaats van NL+EN samengevoegd.
6. **Review-nodes**: per review `inLanguage: "nl-NL"` toevoegen, zodat Google Nederlandse citaten niet als Engelse tekst interpreteert.
7. **Verificatie**: alle 18 EN-pagina's opnieuw ophalen en de JSON-LD nalopen; op een EN-pagina mag `nl-NL` alleen nog voorkomen in hreflang, og:locale:alternate, availableLanguage, WebSite.inLanguage en de review-taalmarkering.

## Technische notities

- Wijzigingen beperken zich tot `src/lib/seo.ts` en `src/routes/__root.tsx`; de 18 routebestanden geven al correct `locale: "en"` door en hoeven niet aangepast.
- De `@id`'s van `#business`, `#organization`, `#website` en `#hassan` blijven identiek — er komt géén tweede bedrijfsentiteit bij, alleen taalvarianten van tekstvelden.
