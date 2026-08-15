# Kannibalisatie-analyse en voorstel

Alles hieronder is gemeten op de draaiende site (HTTP-status per URL, gerenderde tekst). Woordaantallen zijn de volledige gerenderde pagina inclusief header, footer, boekingsblok en reviews; dat gedeelde deel is ~1.300–1.500 woorden, dus trek dat eraf voor "eigen inhoud".

## Groep Perilex

| URL | Status nu | Woorden (gerenderd) | Sitemap | head()/canonical | Interne links |
|---|---|---|---|---|---|
| /perilex-amsterdam | echte pagina | 3.905 | ja | ja | veel: index, elektricien-amsterdam, groepenkast-*, perilex-stekker, perilex-zelf-aansluiten, header/footer |
| /perilex-stekker | echte pagina | 3.065 | ja | ja | vanaf /perilex-amsterdam en footer |
| /perilex-zelf-aansluiten | echte pagina | 856 (≈ 0 eigen tekst; is de DIY-wizard) | ja | ja | vanaf /perilex-amsterdam en /perilex-stekker |
| /perilex-aansluiten-amsterdam | 301 → /perilex-amsterdam | — | nee | n.v.t. | geen |
| /perilex | 301 → /perilex-amsterdam | — | nee | n.v.t. | geen |

Er is geen echte kannibalisatie meer binnen perilex: de twee oude URL's zijn al 301. Wel overlap in intentie tussen /perilex-amsterdam (dienst) en /perilex-stekker (informatief). Die houden we gescheiden, maar scherper:

- Canoniek voor "perilex aansluiten Amsterdam": **/perilex-amsterdam** (blijft).
- /perilex-stekker richt zich puur op productinformatie (types, 16A/25A, verschil met krachtstroom) en verwijst voor de dienst door naar /perilex-amsterdam. Geen "Amsterdam" in title/H1.
- /perilex-zelf-aansluiten heeft nauwelijks eigen tekst: **noindex** houden of samenvoegen. Voorstel: noindex + uit de sitemap, tool blijft bereikbaar via /perilex-amsterdam.
- EN: alleen /en-gb/perilex-amsterdam bestaat — geen actie.

## Groep Groepenkast

| URL | Status nu | Woorden | Sitemap | head() | Interne links |
|---|---|---|---|---|---|
| /groepenkast-amsterdam | echte pagina | 4.752 | ja | ja | index, elektricien-amsterdam, perilex-*, stroomstoring, groepenkast-samenstellen, header/footer |
| /groepenkast-vervangen-amsterdam | 301 → /groepenkast-amsterdam | — | nee | n.v.t. | geen |
| /en-gb/groepenkast-vervangen-amsterdam | 301 → /en-gb/groepenkast-amsterdam | — | nee | n.v.t. | geen |
| /groepenkast-samenstellen | echte pagina (informatief) | — | ja | ja | vanaf groepenkast-amsterdam |

Geen kannibalisatie: al opgelost. Canoniek blijft **/groepenkast-amsterdam** (NL) en **/en-gb/groepenkast-amsterdam** (EN). Geen wijziging nodig.

## Groep Elektricien

| URL | Status nu | Woorden | Sitemap | head() | Interne links |
|---|---|---|---|---|---|
| /elektricien-amsterdam | echte pagina | 4.121 | ja | ja | alle wijkpagina's, groepenkast, perilex, stroomstoring, footer |
| /elektricien | 301 → /elektricien-amsterdam | — | nee | n.v.t. | geen |
| / (homepage) | echte pagina | 3.166 | ja | ja | overal |

Canoniek **/elektricien-amsterdam**; geen actie in de routes. Het resterende risico zit tussen homepage en /elektricien-amsterdam (zie hieronder).

## Homepage vs /stroomstoring-amsterdam — ja, die concurreren

- Homepage-title nu: "Stroomstoring Amsterdam? Elektricien binnen 60 min | VoltFix"
- /stroomstoring-amsterdam-title: "Stroomstoring Amsterdam | Kortsluiting Oplossen | VoltFix"

Beide mikken op dezelfde zoekterm, met de homepage als sterkere URL — precies het patroon dat Google laat wisselen tussen twee URL's en beide laat zakken.

Voorstel: homepage herpositioneren op merk + brede dienst, niet op stroomstoring.
- Nieuwe homepage-title: "Elektricien Amsterdam – 24/7 spoed | VoltFix"
- Nieuwe homepage-description: nadruk op vaste prijs, 60 minuten, 4,9/5, alle diensten — zonder "stroomstoring" in de title.
- H1 homepage blijft breed ("Elektricien in Amsterdam"), met een duidelijke link naar /stroomstoring-amsterdam voor de storingsintentie.
- /stroomstoring-amsterdam blijft ongewijzigd de enige pagina met "stroomstoring" in de title.

Let op: /elektricien-amsterdam mikt óók op "elektricien Amsterdam". Om die twee te scheiden houden we de homepage op merk/breed ("VoltFix — elektricien in Amsterdam, 24/7") en /elektricien-amsterdam op de inhuur-intentie, zoals eerder al doorgevoerd in de tekst van die pagina.

## /postocode-check → /postcode-check

Nu: /postocode-check bestaat als 301 naar /contact#offerte; /postcode-check bestaat niet (404).

Voorstel:
- Nieuwe route /postcode-check aanmaken die 301'ed naar /contact#offerte (zelfde gedrag, juiste spelling).
- /postocode-check als typefout-route laten bestaan met 301 naar /postcode-check (niet verwijderen — externe links en oude vermeldingen blijven werken).
- Beide blijven uit de sitemap.

## Indexeer-advies

| URL | Advies | Reden |
|---|---|---|
| /onze-services | **niet indexeren** — laten als 301 naar / | Geen eigen inhoud; de dienstenoverzicht-functie zit al op de homepage. Alternatief alleen zinvol als je er een echte diensten-hub met eigen tekst van maakt; dat is geen kleine wijziging. |
| /postcode-check | **niet indexeren** — 301 naar /contact#offerte | Is een shortlink, geen pagina. |
| /review | **niet indexeren** — blijft 302 naar Google-reviewformulier | Externe shortlink voor facturen/QR; een 302 hoort hier, want de bestemming kan wijzigen. |
| /perilex-zelf-aansluiten | **noindex** + uit sitemap | Tool zonder eigen tekstinhoud; concurreert met /perilex-amsterdam. |

Geen van deze drie hoort in de sitemap; dat klopt nu al.

## Technische wijzigingen

1. `src/routes/postcode-check.tsx` (nieuw): `beforeLoad` → 301 naar `/contact` met hash `offerte`.
2. `src/routes/postocode-check.tsx`: doel wijzigen naar `/postcode-check` (301).
3. `src/routes/index.tsx`: `pageMeta()` title/description/ogTitle/ogDescription herschrijven weg van "stroomstoring"; ook `SITE_TITLE`/`SITE_DESCRIPTION` in `src/routes/__root.tsx` gelijktrekken.
4. `src/routes/perilex-zelf-aansluiten.tsx`: `{ name: "robots", content: "noindex, follow" }` toevoegen aan de meta; entry verwijderen uit `SITE_ENTRIES` in `src/lib/site-urls.ts`.
5. `src/routes/perilex-stekker.tsx`: title/H1 ontdoen van "Amsterdam" zodat de dienstintentie bij /perilex-amsterdam blijft.
6. `src/routes/__root.tsx` `LEGACY_PATH_REDIRECTS`: `"/postocode-check": "/postcode-check"` toevoegen; de twee no-op regels (`/groepenkast-amsterdam` en `/en-gb/groepenkast-amsterdam` die naar zichzelf verwijzen) opruimen.
7. Sitemap ongewijzigd behalve het verwijderen van `/perilex-zelf-aansluiten`; alle 301-doelen staan er al in.

Geen bestaande, scorende URL verandert van adres: /perilex-amsterdam, /groepenkast-amsterdam en /elektricien-amsterdam blijven exact zoals ze zijn.
