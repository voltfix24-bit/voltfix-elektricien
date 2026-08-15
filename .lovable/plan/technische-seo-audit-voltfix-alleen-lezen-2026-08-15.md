# Technische SEO-audit VoltFix — alleen lezen

Alle uitspraken komen uit git, de projectbestanden of live HTTP-tests op https://www.voltfix.nl (uitgevoerd 16 aug 2026, ~01:50 CEST). Wat niet controleerbaar was staat expliciet als "niet kunnen vaststellen".

## 1. Git en ouderdom

- `/elektricien-amsterdam` aangemaakt: commit **e394480**, 2026-06-07 13:35 UTC, boodschap "Changes" (alle commits van de bot heten "Changes"; er zijn geen beschrijvende boodschappen — inhoud alleen af te leiden uit de diff).
- Laatste ingrijpende inhoudelijke wijziging: **c5a9567**, 2026-08-15 22:48 UTC, +51/−21 regels (unieke H2-secties, lokale cases, eigen FAQ's). Daarvoor d75863a (2026-08-15, +19/−13) en 86a2c26 (2026-08-02, +41/−4).
- Wijzigingen sinds aanmaak: 28 commits. Title staat nu op "Elektricien Amsterdam inhuren | VoltFix" (afwijkend van de homepage), description op de inhuur-intentie, H1 = "Elektricien Amsterdam", canonical self-referential via `pageMeta()`/`absoluteUrl()` in `src/lib/seo.ts`, interne links naar wijkpagina's en dienstenpagina's toegevoegd op 2026-08-02 en 2026-08-15. Per-commit toeschrijving van elke afzonderlijke title/description-wijziging is niet betrouwbaar te maken, omdat alle commits dezelfde boodschap dragen.
- Wijkpagina's: West, Zuid, Oost, Noord, De Pijp, IJburg in commit **10f7087** (2026-07-20); Centrum in **cf14483** (2026-07-20).
- Huidige commit lokaal: **cb6870e** (2026-08-15 23:48 UTC, "Homepage-titel en redirecten").
- Productie draait aantoonbaar **niet** op cb6870e: de live homepage levert nog `<title>Stroomstoring Amsterdam? Elektricien binnen 60 min | VoltFix</title>`, de titel van vóór die commit. Er is dus een gepubliceerde versie van vóór 2026-08-15 23:48 UTC actief. De exacte deploy-commit en deploymenthistorie zijn **niet kunnen vaststellen** (geen deploylog toegankelijk vanuit dit project). Commitdatum ≠ deploymentdatum.

## 2. Routes rond "elektricien Amsterdam" (live getest)

| Route | Bestaat | HTTP | Redirect → | Indexeerbaar | Canonical | Sitemap | Interne links* |
|---|---|---|---|---|---|---|---|
| `/` | ja | 200 | — | ja | https://www.voltfix.nl/ | ja | 11 (logo + footer, elke pagina) |
| `/elektricien` | route-bestand | 301 | /elektricien-amsterdam | n.v.t. | n.v.t. | nee | 0 |
| `/elektricien-amsterdam` | ja | 200 | — | ja | self | ja | **4** (spoed, stroomstoring, groepenkast, perilex) |
| `/spoed-elektricien-amsterdam` | ja | 200 | — | ja | self | ja | 50 |
| `/stroomstoring-amsterdam` | ja | 200 | — | ja | self | ja | 37 |
| `/elektricien-amsterdam-centrum` | ja | 200 | — | ja | self | ja | 8 |
| `/elektricien-amsterdam-west` | ja | 200 | — | ja | self | ja | 8 |
| `/elektricien-amsterdam-zuid` | ja | 200 | — | ja | self | ja | 9 |
| `/elektricien-amsterdam-oost` | ja | 200 | — | ja | self | ja | 9 |
| `/elektricien-amsterdam-noord` | ja | 200 | — | ja | self | ja | 9 |
| `/elektricien-amsterdam-de-pijp` | ja | 200 | — | ja | self | ja | 9 |
| `/elektricien-amsterdam-ijburg` | ja | 200 | — | ja | self | ja | 9 |
| `/elektricien-de-pijp` | **nee** | 404 | — | nee | — | nee | 0 |
| `/elektricien-ijburg` | **nee** | 404 | — | nee | — | nee | 0 |
| `/en-gb` | ja | 200 | — | ja | self | ja | 1 (taalknop) |
| `/en-gb/elektricien-amsterdam` | ja | 200 | — | ja | self | ja | 1 (taalknop) |
| `/en-gb/Electrician-Amsterdam` | nee | 301 | /en-gb/elektricien-amsterdam | n.v.t. | n.v.t. | nee | 0 |

\* geteld op de gerenderde HTML van 11 gecrawlde hoofdpagina's; footer/header tellen mee. Ankerteksten: wijkpagina's krijgen "Elektricien Amsterdam West/Centrum/…" uit `src/components/neighborhood-links.tsx`; `/elektricien-amsterdam` krijgt uitsluitend het anker "elektricien in Amsterdam" (4×, in de slotalinea van vier dienstenpagina's).

**Bevestigd:** noch de header (`src/components/site-header.tsx`), noch de footer (`src/components/site-footer.tsx`), noch de homepage linkt naar `/elektricien-amsterdam`.

## 3. Live redirects en domeinvarianten

- `http://voltfix.nl/` → **302** → `http://www.voltfix.nl/` → 301 → `https://www.voltfix.nl/` → 200 (keten van 3 hops, eerste hop tijdelijk)
- `https://voltfix.nl/` → **302** → `https://www.voltfix.nl/` → 200
- `http://www.voltfix.nl/` → 301 → https → 200 (correct)
- `https://www.voltfix.nl/` → 200
- `/elektricien` → 301 → `/elektricien-amsterdam` → 200
- `/elektricien/` → **307** → `/elektricien` → 301 → `/elektricien-amsterdam` → 200 (3 hops)
- `/elektricien-amsterdam` → 200; `/elektricien-amsterdam/` → **307** → `/elektricien-amsterdam` → 200
- `/en-gb/Electrician-Amsterdam` → 301 → `/en-gb/elektricien-amsterdam` → 200
- `/Elektricien-Amsterdam` → 301 → lowercase → 200

Conclusies: geen loops. **Non-www gaat met een 302, niet 301** — dat is het enige echte redirectdefect; het verklaart mede dat GSC de non-www-homepage nog apart met 42 vertoningen toont. Trailing slash lost op via een **307** (tijdelijk) in plaats van 301 en veroorzaakt zo een extra hop, geen duplicaat (er is maar één 200-URL). Hoofdletters leveren geen aparte 200-pagina op.

## 4. Canonicals

In de eerste HTML-response, één `<link rel="canonical">` per pagina, altijd self-referential en altijd op `https://www.voltfix.nl` (gecontroleerd op home, /elektricien-amsterdam, /spoed-…, /stroomstoring-…, alle 7 wijkpagina's, /en-gb, /en-gb/elektricien-amsterdam). Geen dubbele canonicals, geen cross-canonicals, geen conflict met sitemap of redirects. Bron: `pageMeta()`/`absoluteUrl()` in `src/lib/seo.ts`, per route in `head()`.

Kan Google een andere canonical kiezen? Technisch ja, tussen `/` en `/elektricien-amsterdam`, niet door tegenstrijdige tags maar door **inhoudelijke gelijkenis plus zeer ongelijke interne linkkracht** (zie 6 en 7). Tussen www en non-www kan de 302 dat signaal vertragen.

## 5. Rendering

Server-side rendering met TanStack Start (`src/routes/__root.tsx`, `HeadContent`/`Scripts`; geen prerender-config). In de eerste response staan zonder JavaScript: `<title>`, meta description, canonical, hreflang (`rel="alternate" hrefLang="nl-NL|en-GB|x-default"`), `<html lang>`, H1, volledige hoofdcontent inclusief FAQ-antwoorden (`forceMount` in `src/components/ui/accordion.tsx`) en alle JSON-LD. `robots`-meta ontbreekt op de indexeerbare pagina's — dat is correct (geen tag = index,follow); alleen `/perilex-zelf-aansluiten` heeft in de code `noindex, follow`, maar dat is nog niet live.

Genererende bestanden: `src/lib/seo.ts` (pageMeta, altLinks, alle schema's), per route `head()`, `src/components/location-page.tsx` + `src/data/locations.ts` voor de wijkpagina's.

## 6. SEO-elementen hoofdpagina's (live)

| URL | Title | H1 | Canonical | Robots | Intentie | Overlap met home* |
|---|---|---|---|---|---|---|
| `/` | Stroomstoring Amsterdam? Elektricien binnen 60 min \| VoltFix | Stroomstoring in Amsterdam? Binnen 60 min. een monteur | self | — | storing/spoed + merk | — |
| `/elektricien-amsterdam` | Elektricien Amsterdam inhuren \| VoltFix | Elektricien Amsterdam | self | — | elektricien inhuren, gepland | 27,9% |
| `/spoed-elektricien-amsterdam` | Spoed Elektricien Amsterdam \| 24/7 Storingsdienst \| VoltFix | Spoed elektricien Amsterdam | self | — | spoed | niet gemeten |
| `/stroomstoring-amsterdam` | Stroomstoring Amsterdam \| Kortsluiting Oplossen \| VoltFix | Stroomstoring Amsterdam | self | — | storing | niet gemeten |
| 7 wijkpagina's | Elektricien Amsterdam {Wijk} \| … \| VoltFix | Elektricien Amsterdam {Wijk} | self | — | lokaal | 31,8% (West) |

\* aandeel 6-gram-overlap; methode in 7.

**Conflict:** de live homepage-title mikt op "stroomstoring Amsterdam", dezelfde term als `/stroomstoring-amsterdam`. In de codebase is dat inmiddels gewijzigd naar "Elektricien Amsterdam – 24/7 spoed | VoltFix", maar die versie staat niet in productie. Daarmee mikt de live homepage momenteel op stroomstoring én rankt hij op "elektricien amsterdam" (positie 13), terwijl `/elektricien-amsterdam` op 63,7 staat.

## 7. Overlap homepage vs /elektricien-amsterdam

Methode: gerenderde `<body>`-tekst zonder scripts, genormaliseerd, vergeleken op 6-gram-niveau. Home 1.657 woorden, `/elektricien-amsterdam` 2.567 woorden. **43,2% van de homepage-6-grams komt ook op /elektricien-amsterdam voor; omgekeerd 27,9%.**

- Uniek op home: hero met stroomstoring-belofte, dienstengrid met 6 tegels, kaart met werkgebied (`service-area-map.tsx`), USP-blok.
- Uniek op `/elektricien-amsterdam`: "Waarvoor huurt u een elektricien in Amsterdam in?", "Elektra in Amsterdamse panden", drie weekcases (De Pijp, Centrum, IJburg), VvE/monument-FAQ's, wijkoverzicht met beschrijvingen.
- Gedeelde componenten (identiek op beide): header, footer, `GlobalBookingSection`, `MobileCtaBar`, `WhatsAppFloat`, `Testimonials` (reviews 4,9/56), `RatesTable`/tarieven, `TechnicianByline` (Hassan), garantieblok, CTA-banden, `NeighborhoodLinks`. Die gedeelde blokken zijn ~1.300–1.500 woorden en verklaren vrijwel de volledige gemeten overlap; de eigenlijke bodyteksten verschillen inhoudelijk.

## 8. Interne linkstructuur (live, 11 pagina's gecrawld, gewone `<a href>`)

| Doel | Aantal | Bronnen |
|---|---|---|
| `/spoed-elektricien-amsterdam` | 50 | header, footer, alle pagina's |
| `/groepenkast-amsterdam` | 41 | header, footer, content |
| `/perilex-amsterdam` | 41 | header, footer, content |
| `/stroomstoring-amsterdam` | 37 | header, footer, content |
| `/` | 11 | logo + footer |
| elk wijkpagina | 8–9 | `NeighborhoodLinks` op alle hoofdpagina's |
| **`/elektricien-amsterdam`** | **4** | alleen slotalinea's van spoed, stroomstoring, groepenkast, perilex |

Navigatie, footer en breadcrumbs behandelen de **homepage** (en de dienstenpagina's) als hub; alleen de breadcrumb van de wijkpagina's noemt `/elektricien-amsterdam` als tussenlaag (`src/components/location-page.tsx:59`). Alle links zijn crawlbare `<a href>`. Geen interne links naar redirect-URL's aangetroffen in de gecrawlde HTML.

## 9. Wijkpagina's

Alle zeven bestaan in productie (200), staan in de sitemap, hebben self-canonical, zijn zonder JavaScript zichtbaar en zijn bereikbaar vanaf zowel de homepage als `/elektricien-amsterdam` via `NeighborhoodLinks`. Elk 1.860–1.940 woorden.

Uniciteit (6-gram, live): West deelt **60,8%** met Centrum, **62,0%** met Zuid, 49,6% met `/elektricien-amsterdam`, 31,8% met home. Er is echte lokale tekst (buurtnamen, pandtypes, cases uit `src/data/locations.ts`), maar het gedeelde boilerplate-aandeel (tarieven, monteur, reviews, FAQ-basis, CTA's, wijklinks) is groter dan het unieke deel.

Amsterdam West: positie 4,86 met 144 vertoningen en 0 klikken. Technisch is er niets kapot — 200, indexeerbaar, canonical, in de sitemap. Mogelijke verklaringen die technisch zichtbaar zijn: de title ("Elektricien Amsterdam West | Spoed & Groepenkast | VoltFix") en description bevatten geen reviewscore, prijs of "vandaag/24 uur"-trigger, en positie 4,86 is een gemiddelde dat ook uit veel weergaven onder de vouw of in packs kan komen. Of dit CTR- of SERP-feature-gedreven is, is **niet kunnen vaststellen** zonder GSC-CTR-data per query/positie.

## 10. Sitemap en robots.txt

- `https://www.voltfix.nl/sitemap.xml` — 43 URL's, alle absoluut op `https://www.voltfix.nl`, geen hoofdletters, geen non-www, geen redirect-URL's, geen 404's. Gegenereerd door `src/routes/sitemap[.]xml.ts` uit `src/lib/site-urls.ts`.
- Geen enkele `<lastmod>` aanwezig (0 voorkomens) — bewust, conform de comment in `site-urls.ts`. Dus ook geen foutieve lastmod.
- Alle wijk- en taalpagina's staan erin. Live bevat de sitemap nog `/perilex-zelf-aansluiten`; in de codebase is die inmiddels verwijderd (nog niet gedeployed).
- `robots.txt`: `User-agent: * / Allow: /` + `Sitemap: https://www.voltfix.nl/sitemap.xml`. Blokkeert niets, ook geen assets.

## 11. Meertaligheid

`<html lang="nl-NL">` op NL, `<html lang="en-GB">` op `/en-gb/*`. Wederzijdse hreflang met nl-NL, en-GB en x-default (x-default wijst naar de NL-URL) via `altLinks()` in `src/lib/seo.ts`. Canonicals blijven binnen dezelfde taal. Attribuutschrijfwijze in de SSR-HTML is `hrefLang` (React-notatie); HTML-attributen zijn hoofdletterongevoelig, dus parsers lezen dit als `hreflang`.

Aandachtspunten: EN-URL's gebruiken deels NL-slugs (`/en-gb/elektricien-amsterdam`, `/en-gb/groepenkast-amsterdam`), waardoor een Engelse pagina op een Nederlandse slug staat en in NL-zoekopdrachten kan opduiken. De hoofdlettervariant `/en-gb/Electrician-Amsterdam` uit GSC is een 301 naar de NL-slug-URL; die oude Engelse slug bestaat dus niet meer als 200. Niet elke NL-pagina heeft een EN-tegenhanger (bv. Oost, Noord, De Pijp, IJburg); voor die pagina's wijst hreflang alleen naar zichzelf.

## 12. Structured data

Op elke pagina via `src/lib/seo.ts`: `LocalBusiness`/`Electrician` in een `@graph` op `#business`, `Organization`, `WebSite`, `Service`, `OfferCatalog`, `AggregateRating` + `Review`, `Person` (Hassan), `WarrantyPromise`, `ContactPoint`, `OpeningHoursSpecification`, `GeoCircle`. Extra per type pagina: `BreadcrumbList` op alle subpagina's (niet op home), `FAQPage` overal waar een FAQ staat, `Place`/`AdministrativeArea` op de wijkpagina's, `ImageObject` op de home.

Alle URL's in de schema's staan op `https://www.voltfix.nl` (geen www/non-www-mengeling). Eén bedrijfsentiteit met vast `@id`, dus geen dubbele entiteiten. Adresscheiding: het KvK-adres (Mauritius 17, 1505 VK Zaandam) en de bezoeklocatie (Jacob van Lennepkade 142, 1053 MV Amsterdam) zijn in `src/lib/business.ts` gescheiden velden en worden volgens de comment in `src/lib/seo.ts:410` bewust gescheiden gehouden. Of Google beide adressen als consistent NAP-signaal accepteert is **niet kunnen vaststellen** zonder validatie in Search Console/Rich Results.

## 13. Bedrijfsgegevens en inconsistenties

Naam VoltFix, legalName VoltFix V.O.F, telefoon 06 45 19 35 89 (+31645193589), WhatsApp 06 86 30 21 48 (+31686302148), e-mail info@voltfix.nl, KvK 95572589, BTW NL867186549B01, bezoekadres Jacob van Lennepkade 142 1053 MV Amsterdam (op afspraak), geregistreerd adres Mauritius 17 1505 VK Zaandam, werkgebied Amsterdam + Amstelveen, Diemen, Ouder-Amstel, Zaandam, Haarlem. Openingstijden via `OpeningHoursSpecification` (24/7 spoed).

Inconsistenties: `public/llms.txt` is handmatig onderhouden en kan afwijken van `src/lib/business.ts` (waarschuwing staat bovenin het bestand); werkgebied-opsommingen verschillen licht per pagina (FAQ noemt Zuidoost, `/elektricien-amsterdam` noemt postcodes 1011–1109). Geen tegenstrijdige telefoonnummers of KvK-nummers aangetroffen.

## 14. Technische haalbaarheid consolidatie (niet uitgevoerd)

Als de homepage definitief de pagina voor "elektricien Amsterdam" wordt:
- Te wijzigen: `src/routes/index.tsx` (title/description/H1 + overname unieke secties), `src/routes/elektricien-amsterdam.tsx` (vervangen door redirect-route), `src/routes/__root.tsx` (`LEGACY_PATH_REDIRECTS` regel `"/elektricien-amsterdam": "/"`), `src/lib/site-urls.ts` (entry verwijderen), `src/lib/i18n.ts` (pad staat in de EN-koppelingslijst), `src/components/location-page.tsx:59` (breadcrumb-tussenlaag), `src/routes/elektricien.tsx` (nu 301 naar de te verwijderen URL → moet naar `/`), en de vier slotalinea's in spoed/stroomstoring/groepenkast/perilex.
- Over te zetten unieke inhoud: "Waarvoor huurt u een elektricien in Amsterdam in?", "Elektra in Amsterdamse panden", de drie weekcases, de VvE/monument-FAQ's en het wijkoverzicht met beschrijvingen.
- Hreflang: `/en-gb/elektricien-amsterdam` moet dan koppelen aan `/`, of ook geconsolideerd worden naar `/en-gb`.
- Risico's: `/elektricien-amsterdam` heeft 445 vertoningen en een eigen geschiedenis sinds 7 juni; consolidatie verplaatst signalen maar kan tijdelijk verlies geven. De homepage draagt al de merk- en storingsintentie; een derde intentie erbij kan de storingspagina verzwakken. De breadcrumb-keten van 9 wijkpagina's verandert mee.
- Terugdraaien: één revert van de betreffende commit herstelt route, sitemap-entry en links; de 301 is dan weg. Zolang Google de 301 heeft verwerkt duurt herstel langer dan de code-revert.

---

## A. Executive summary

1. Productie draait op een oudere build dan de huidige code (live homepage-title is nog de stroomstoring-variant).
2. Live concurreren homepage en `/stroomstoring-amsterdam` op dezelfde term; in de code is dat al opgelost, maar niet gepubliceerd.
3. `/elektricien-amsterdam` krijgt slechts 4 interne links en staat niet in header, footer of homepage — de zwakste hub-positie van alle Amsterdam-pagina's.
4. Non-www redirect is een **302**, geen 301.
5. Trailing slash lost op met een **307** en een extra hop.
6. Alle canonicals zijn self-referential, uniek en correct op www.
7. Volledige SSR: titles, meta, hreflang, H1, content, FAQ-antwoorden en JSON-LD staan in de eerste response.
8. Sitemap (43 URL's) bevat alleen canonieke www-URL's, geen lastmod, geen redirects.
9. Wijkpagina's zijn technisch in orde maar delen ~61% van hun tekst met elkaar.
10. Inhoudelijke overlap home ↔ `/elektricien-amsterdam` is 27,9–43,2%, vrijwel volledig verklaard door gedeelde componenten.

## B. Bevestigd / mogelijk / geen probleem

| Bevinding | Oordeel |
|---|---|
| Non-www → www is 302 | Bevestigd probleem |
| Live homepage-title mikt op stroomstoring | Bevestigd probleem (fix staat klaar, niet gedeployed) |
| `/elektricien-amsterdam` bijna geen interne links | Bevestigd probleem |
| Trailing slash via 307 | Mogelijk probleem (extra hop, geen duplicaat) |
| Wijkpagina's ~61% onderling gelijk | Mogelijk probleem |
| West positie 4,86 met 0 klikken | Mogelijk probleem — oorzaak niet vast te stellen |
| Canonicals, hreflang, sitemap, robots.txt, SSR, structured data | Geen probleem |

## C. URL-tabel
Zie sectie 2.

## D. Tijdlijn

| Datum (UTC) | Commit | Gebeurtenis |
|---|---|---|
| 2026-06-07 | e394480 | `/elektricien-amsterdam` aangemaakt |
| 2026-07-20 | 10f7087 / cf14483 | 7 wijkpagina's aangemaakt |
| 2026-08-02 | 86a2c26 e.v. | Contentuitbreiding + interne links |
| 2026-08-15 22:47–22:48 | d75863a, c5a9567 | Grote herschrijving tegen kannibalisatie |
| 2026-08-15 23:48 | cb6870e | Homepage-title + redirects (nog niet live) |
| Deployments | — | Niet kunnen vaststellen |

## E. Conflicterende signalen

1. Live homepage-title vs `/stroomstoring-amsterdam` (zelfde term).
2. Breadcrumbs noemen `/elektricien-amsterdam` als hub, navigatie en footer negeren die pagina volledig.
3. Non-www 302 houdt twee homepage-varianten in GSC in leven.
4. Code-status (nieuwe title, noindex perilex-tool, sitemap zonder `/perilex-zelf-aansluiten`) wijkt af van de gepubliceerde site.
5. EN-pagina's op NL-slugs kunnen in NL-resultaten verschijnen.

## F. Niet vast te stellen

- Deploymenthistorie en de exact draaiende commit.
- Waar de non-www-302 en de 307 vandaan komen (hostinglaag, niet in projectcode).
- CTR-oorzaak van West (0 klikken bij positie 4,86).
- Of Google de Zaandam/Amsterdam-adresscheiding accepteert.
- Of `/elektricien-amsterdam` momenteel als canoniek of als duplicaat wordt behandeld — vereist URL-inspectie in Search Console.

## G. Technisch stappenplan (nog NIET uitgevoerd)

1. Publiceren van de huidige code, zodat de homepage-title en de sitemapwijziging live komen; daarna opnieuw meten.
2. Non-www-redirect op hostingniveau van 302 naar 301 zetten.
3. Trailing-slash-redirect van 307 naar 301 zetten (indien instelbaar).
4. `/elektricien-amsterdam` interne linkkracht geven vanuit header of homepage — óf de consolidatie uit sectie 14 uitvoeren.
5. Wijkpagina's verder ontdubbelen; West als eerste, inclusief CTR-gerichte title/description.
6. Na elke stap URL-inspectie in Search Console uitvoeren voor de betrokken URL's.

Er zijn tijdens deze audit geen bestanden gewijzigd, geen commits gemaakt en geen deployments uitgevoerd.
