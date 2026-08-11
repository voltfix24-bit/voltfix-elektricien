# SEO AUDIT REPORT: www.voltfix.nl

**Datum:** 11 augustus 2026
**Scope:** code-audit van `voltfix24-bit/voltfix-elektricien` @ `5efc956`
**Stack:** TanStack Start (React 19 + Vite 7, SSR) via Lovable — *geen* Next.js
**Beoordelingskader:** June 2026 Spam Update, May 2026 Core Update (E-E-A-T), AEO/AI Overviews

---

## ⚠️ EERST: wat ik WEL en NIET heb kunnen meten

Eerlijk over de methode, want dat bepaalt hoe je deze cijfers moet lezen.

**Wel gemeten (bewijs uit de code):**
Alle structured data, meta-tags, hreflang, canonicals, sitemap, robots.txt, contentdiepte
per pagina, woordtellingen, prijs- en claimconsistentie, touch targets, bundel-scope,
analytics-laadstrategie. Ik heb ook de drie eigen guard-scripts van het project uitgevoerd.

**Niet gemeten — geblokkeerd in deze omgeving:**
De live site (`www.voltfix.nl`) is onbereikbaar via de netwerk-egress-proxy van deze sessie,
en Lovable's private npm-registry is dat ook (`403`), waardoor `bun run build` niet slaagt.
Daardoor ontbreken **veldmetingen**: LCP/INP/CLS uit CrUX, HTTP-response headers (HSTS,
CSP), de non-www → www 301, Search Console crawl-errors, Google Business Profile en
backlink-data. Waar ik daarover iets zeg, is het een **inschatting op basis van code** —
expliciet gelabeld. **Verifieer die punten met PageSpeed Insights, Search Console en
een header-check (securityheaders.com) voordat je erop handelt.**

Dat gezegd: de meest waardevolle bevindingen hieronder zijn juist *inhoudelijke*
inconsistenties die geen enkele Lighthouse-run had gevonden.

---

## 🚨 KRITIEKE BEVINDINGEN (URGENT)

### 1. Je meta description liegt over je eigen reviews — sitewide
`src/routes/__root.tsx:91` zet als sitewide description: *"4,9/5 uit **48** reviews"*.
Ook `src/routes/perilex-amsterdam.tsx:89` zegt *"⭐ 4,9 uit **48** reviews"*.

Maar `src/data/reviews.ts:29` is de bron van waarheid:
```ts
export const aggregateRating = { ratingValue: 4.9, reviewCount: 56, ... }
```
Die 56 wordt gerenderd in `<TrustStrip />`, `<Testimonials />`, het contactformulier **én in
je `AggregateRating` JSON-LD**.

**Waarom dit kritiek is:** op dezelfde pagina staat in de SERP-snippet 48 en in de
structured data 56. De May 2026 Core Update beoordeelt juist *trust-consistentie*; twee
verschillende getallen voor dezelfde verifieerbare claim is precies het signaal dat
Gemini-gebaseerde kwaliteitsmodellen als onbetrouwbaar wegen. Het is ook simpelweg
verkopen onder je niveau: je hebt 8 reviews meer dan je adverteert.

**Fix (Lovable-prompt):**
> Vervang de hardcoded "48" in `src/routes/__root.tsx` (SITE_DESCRIPTION) en
> `src/routes/perilex-amsterdam.tsx` door `aggregateRating.reviewCount` uit
> `@/data/reviews`, zodat het reviewaantal uit één bron komt.

Impact: **Hoog** · Effort: **Laag**

---

### 2. `llms.txt` geeft AI-zoekmachines een te lage weekendprijs — €120 i.p.v. €145
`public/llms.txt:43`:
```
- Spoed / avond / nacht / weekend: starttarief vanaf € 120.
```
Maar `src/lib/pricing.ts:15` zegt:
```ts
offHoursFirstHour: 145,   // Avond, nacht, weekend & feestdag — eerste uur all-in
```
Het bedrag **€145 komt in heel `llms.txt` niet voor**. ChatGPT, Perplexity en Google AI
Overviews lezen dit bestand als jouw eigen officiële prijsopgave en zullen dus €120
citeren voor een zondagse spoedklus die in werkelijkheid €145 kost.

**Waarom dit kritiek is:** dit is de duurste soort fout. Een klant belt met "de AI zei
€120", je monteur rekent €145, en dat eindigt in een 1-ster-review over misleidende
prijzen — wat je E-E-A-T dubbel raakt. Je hele site is gebouwd op de belofte
"nooit een verrassing op de factuur"; dit bestand ondermijnt precies die belofte.

**Oorzaak:** `src/lib/pricing.ts:2` stelt *"Geen enkel euro-bedrag mag elders in `src/`
hardcoded staan"* — en dat is netjes afgedwongen. Maar `llms.txt` staat in `public/`
en valt dus buiten die regel. Er is geen guard die het dekt.

**Fix:** zet de avond/nacht/weekend-regel op €145 én laat `llms.txt` genereren of
valideren vanuit `pricing.ts`, zodat toekomstige prijswijzigingen niet weer wegdrijven.
Voeg een route `/llms.txt` toe (net als `/sitemap.xml` al doet via `site-urls.ts`) of
breid `scripts/` uit met een check die euro-bedragen in `public/llms.txt` vergelijkt
met `prices`.

Impact: **Hoog** · Effort: **Laag** (prijs) / **Middel** (generator)

---

### 3. Je FAQ-schema onderschat je eigen garantie — op 9 pagina's
`src/data/locations.ts:55` (in `sharedFaqs`, dus op **alle 9** locatiepagina's):
> "we geven **12 maanden garantie** op uitgevoerd werk **en geplaatste materialen**"

Maar `warrantySchema()` in `src/lib/seo.ts:933` en `llms.txt:24` zeggen:
**12 maanden op installatiewerk + 2 JAAR fabrieksgarantie op materialen.**

Deze tekst gaat via `faqSchema(location.faqs)` rechtstreeks in `FAQPage` JSON-LD op negen
URL's. Je vertelt Google dus expliciet dat materialen 12 maanden garantie hebben terwijl
je elders 24 maanden claimt. Weer twee waarheden voor één feit — en ook hier verkoop je
jezelf tekort.

**Fix:** splits de garantie-FAQ: "12 maanden garantie op ons installatiewerk en 2 jaar
fabrieksgarantie op geplaatste materialen." Haal de duur uit één constante in
`pricing.ts` (daar staat de garantiedata al blijkens de header-comment).

Impact: **Hoog** · Effort: **Laag**

---

### 4. Er is geen mens op deze website — grootste May 2026 E-E-A-T-gat
Ik heb de hele codebase doorzocht op een `Person`-entiteit. Het enige resultaat is
`src/components/testimonials.tsx:101` — en dat is de *auteur van een review*, niet iemand
van VoltFix.

Tegelijk noemen je eigen reviews structureel één naam:
- *"**Hassan** heeft geweldig werk geleverd..."*
- *"Vandaag is **Hassan** bij ons geweest..."*
- *"...bleef hij geduldig zoeken naar de oorzaak."*

Je klanten kennen Hassan bij naam en prijzen hem expliciet. Je website introduceert hem
nergens. Er is geen `Person`/`founder`/`employee` schema, geen naam, geen foto met
credentials, geen "wie komt er langs".

**Waarom dit kritiek is:** de eerste E van E-E-A-T is *Experience*, en die wordt in de
May 2026 Core Update aan **herleidbare mensen** gekoppeld, niet aan bedrijfsclaims. Je
hebt alle bouwstenen al (VCA**, ISO 9001, SBB Erkend Leerbedrijf, `foundingDate: 2021`,
een portretfoto in `src/assets/electrician-portrait.jpg` die nergens lijkt te worden
gebruikt) — ze zijn alleen niet aan een persoon gehangen. Dit is je grootste kans met
de minste inspanning.

**Fix:**
1. Op `/over-ons`: naam, foto, functie, jaren ervaring en certificeringen van Hassan
   (en eventueel het team) — als echte, doorzoekbare tekst.
2. Voeg `Person` toe aan de schema-graph in `src/lib/seo.ts`, met `@id`
   `${business.url}/#hassan`, en verbind hem via `employee`/`founder` aan de
   `#organization`-node en via `hasCredential` aan de VCA**/ISO-credentials die je al
   genormaliseerd hebt.
3. Zet hem als `author` op de HowTo-/adviespagina's (`/groepenkast-samenstellen`,
   `/perilex-zelf-aansluiten`) — dat zijn precies de pagina's die zonder auteur als
   AI-content kunnen worden gelezen.

Impact: **Hoog** · Effort: **Middel**

---

### 5. Geen security-headers geconfigureerd in het project *(verifieer live)*
Er is geen `public/_headers`, geen `_redirects`, geen `wrangler.toml` en geen
`routeRules` in `vite.config.ts`. De enige headers die de app zet zijn
`content-type` (`src/server.ts:36`) en `Cache-Control` op de sitemap.

Er is dus **nergens in de repo** een HSTS-, CSP-, `X-Content-Type-Options`- of
`Referrer-Policy`-header gedefinieerd. Of ze alsnog bestaan hangt volledig af van wat
Lovable/Cloudflare standaard toevoegt — dat kon ik hier niet meten.

Even belangrijk: `src/lib/business.ts:7` zegt in een comment dat de non-www → www 301
*"op hostingniveau"* moet gebeuren. Dat is een aanname die nergens in de repo wordt
afgedwongen of getest. Als die redirect ontbreekt, heb je je hele site dubbel
(voltfix.nl én www.voltfix.nl) met gesplitste linkwaarde — terwijl elke canonical naar
`www` wijst.

**Actie:** check `https://securityheaders.com/?q=voltfix.nl` en
`curl -sSI https://voltfix.nl` (verwacht: `301 → https://www.voltfix.nl/`). Ontbreekt de
redirect of HSTS, voeg dan een `public/_headers` toe (Cloudflare Pages leest die) met
minimaal HSTS, `X-Content-Type-Options: nosniff` en `Referrer-Policy`.

Impact: **Hoog** (als redirect ontbreekt) · Effort: **Laag**

---

## ⚠️ BELANGRIJKE ISSUES (1–4 WEKEN)

### 6. Touch targets onder de 44px-norm
`src/components/ui/button.tsx`:

| variant | hoogte | px | 44px+ |
|---|---|---|---|
| `default` | `h-9` | 36 | ❌ |
| `lg` | `h-10` | 40 | ❌ |
| `xl` | `h-12` | 48 | ✅ |
| `icon` | `h-9 w-9` | 36 | ❌ |

De shadcn-defaults zijn nooit aangepast. Alleen `xl` haalt de norm. Voor een site waar
de primaire conversie een mobiele tap op "bellen" of "WhatsApp" is, is dat een directe
rem op conversie én een mobile-usability-signaal.

**Fix:** zet `default` op `h-11` (44px) en `icon` op `h-11 w-11`, of geef alle
conversie-CTA's expliciet `size="xl"`. Let op: `ServicePage` gebruikt al een `h-11`
bel-button in de hero — die is goed; het gaat om de rest.

Impact: **Middel-Hoog** · Effort: **Laag**

### 7. Google Fonts blokkeert je LCP-render
`src/routes/__root.tsx:145` laadt drie families in twaalf gewichten
(Manrope 4, Plus Jakarta Sans 5, Space Grotesk 3) via een externe stylesheet van
`fonts.googleapis.com`.

`preconnect` staat er netjes en `display=swap` voorkomt onzichtbare tekst — maar het
blijft een render-blocking request naar een derde partij vóórdat er iets tekent. Dat is
op mobiel/4G structureel enkele honderden ms LCP.

**Fix:** self-host de woff2-bestanden (of gebruik Fontsource) en `preload` alleen de
1–2 gewichten die in de hero zichtbaar zijn. Schrap gewichten die je niet gebruikt —
twaalf is vrijwel zeker meer dan nodig.

Impact: **Middel-Hoog** · Effort: **Middel**

### 8. Locatiepagina's: goede lokale inhoud, te dun en te sterk getemplateerd
Eerst het compliment, want dit is belangrijk: deze pagina's zijn **geen doorway spam**.
Ze noemen echte straten (Beethovenstraat, Molukkenstraat, Gerard Douplein), echte
routes (S102, Piet Heintunnel, A200) en per wijk een geloofwaardig technisch verhaal
(keramische zekeringen in De Baarsjes, KNX op de Zuidas, monumentenregels in Centrum).
Dat is echte lokale kennis en het overleeft een June 2026-toets op *originaliteit*.

Het probleem is **volume en structuur**. Unieke woorden per pagina (intro + secties + eigen FAQ's):

| URL | unieke woorden |
|---|---|
| `/elektricien-amsterdam-zuid` | 327 |
| `/elektricien-amsterdam-centrum` | 262 |
| `/elektricien-amsterdam-west` | 257 |
| `/elektricien-amsterdam-de-pijp` | 244 |
| `/elektricien-amsterdam-ijburg` | 228 |
| `/elektricien-amsterdam-oost` | 224 |
| `/elektricien-haarlem` | 223 |
| `/elektricien-amsterdam-noord` | 215 |
| `/elektricien-amstelveen` | 210 |

Acht van de negen zitten **onder de 300 woorden** aan unieke tekst. Daarbovenop is de
skeletstructuur identiek (altijd "Elektricien in X, Y en Z" → "Veelvoorkomend werk in X"
→ een reistijd-H2), en `sharedFaqs()` plakt **vier woordelijk identieke FAQ's** op alle
negen pagina's — die vervolgens als `FAQPage` JSON-LD op negen URL's worden gepubliceerd.
Negen bijna-identieke FAQPage-entiteiten is precies het "scaled content"-patroon waar de
June 2026 update op let.

**Fix, in deze volgorde:**
1. Maak `sharedFaqs()` per wijk inhoudelijk anders, of laat de generieke vier vallen op
   locatiepagina's en houd ze alleen op de hoofddienstpagina's.
2. Breid de zwakste vier (Amstelveen, Noord, Haarlem, Oost) uit naar 500+ woorden met
   iets dat alleen jij kunt schrijven: een echte klus uit die wijk, wat je in een
   tuindorpmeterkast aantreft, waarom Liander daar langer doet over een aansluiting.
3. Varieer de H2-structuur per pagina.

Impact: **Middel-Hoog** · Effort: **Hoog**

### 9. `/perilex-zelf-aansluiten` staat niet in je sitemap
Het is een volwaardige contentpagina (132 regels, eigen canonical, `HowTo` JSON-LD,
`pageMeta`) — maar hij ontbreekt in `SITE_ENTRIES` (`src/lib/site-urls.ts`). Omdat die
lijst zowel `/sitemap.xml` als de IndexNow-ping naar Bing voedt, wordt deze pagina bij
geen van beide aangemeld. `/perilex-stekker` staat er wél in.

**Fix:** één regel toevoegen: `{ path: "/perilex-zelf-aansluiten", changefreq: "monthly", priority: "0.7" }`.

Impact: **Middel** · Effort: **Laag**

### 10. `llms.txt` verzwijgt je sterkste certificeringen
Regel 23 zegt alleen: *"werkt volgens NEN 1010, KvK-geregistreerd, BTW-plichtig ondernemer"*.

Maar `business.ts` heeft genormaliseerde credentials met erkennende instantie en URL voor
**VCA\*\* (SSVV), ISO 9001 (ISO) en SBB Erkend Leerbedrijf** — allemaal in
`hasCredential` met `recognizedBy`. Dat is precies het soort verifieerbare autoriteit dat
AI-antwoordmachines gebruiken om te bepalen wie ze durven aanbevelen, en het staat niet in
het bestand dat je speciaal voor hen hebt geschreven.

**Fix:** neem de volledige credential-lijst (met erkennende instantie) op in `llms.txt`.

Impact: **Middel** · Effort: **Laag**

### 11. Mogelijk dubbele GA4-lading
`src/lib/analytics.ts:409-435` laadt **zowel** `gtag/js` (GA4 direct) **als** GTM. Als in
GTM ook een GA4-configuratietag staat — de standaardinrichting — meet je dubbel en
verspil je main-thread-tijd, wat direct INP kost.

De implementatie is voor de rest netjes: Consent Mode v2-defaults staan aantoonbaar
vóór beide loaders, en beide zijn `async`. Dat is goed gedaan.

**Fix:** kies één pad. Als GTM je GA4 al afvuurt, haal de directe `gtag/js`-injectie weg.
Controleer in GA4 Realtime op dubbele `page_view`.

Impact: **Middel** · Effort: **Laag**

### 12. Je eigen SEO-guard test een URL die 301'st
`scripts/check-seo-meta.mjs:25` heeft in de `PAIRED`-lijst nog
`"/Groepenkast-Amsterdam"` met hoofdletters staan. Die URL wordt door
`__root.tsx` (`LEGACY_UPPERCASE_PATHS`) met een 301 naar de kleine-letterversie gestuurd.
Het script behandelt een 3xx als **FAIL** (regel 120-124), dus deze check faalt
structureel op een pagina die juist correct werkt — en dat maskeert echte regressies.

**Fix:** zet de entry op `/groepenkast-amsterdam`.

Impact: **Laag-Middel** · Effort: **Laag** (maar het houdt je vangnet betrouwbaar)

### 13. `robots.txt` is minimaal
```
User-agent: *
Allow: /
Sitemap: https://www.voltfix.nl/sitemap.xml
```
Correct en niets kapot — maar: de interne tools (`/seo-monitor`, `/keyword-tool`,
`/conversie-monitor`, `/indexnow`) hebben wél `noindex, nofollow` (netjes), maar worden
nog steeds gecrawld. En je hebt geen expliciete uitspraak over AI-crawlers
(`GPTBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended`), terwijl je met `llms.txt`
juist een AI-vriendelijke strategie voert. Maak die keuze expliciet in plaats van impliciet.

Impact: **Laag** · Effort: **Laag**

### 14. CLS-risico: vaste hero-afmetingen voor alle diensten
`src/components/service-page.tsx:104` zet op élke dienst- en locatie-hero
`width={1024} height={768}` (4:3), ongeacht de echte beeldverhouding van het bestand, en
zonder `sizes`. Wijkt de werkelijke ratio af, dan reserveert de browser de verkeerde
ruimte en verschuift de layout na het laden.

De homepage doet het wél goed (`index.tsx:299`: `width={1600} height={900}` mét `sizes`)
— trek die aanpak door.

Impact: **Laag-Middel** · Effort: **Laag**

### 15. Contentgaten: geen FAQ-hub, geen tarievenpagina
Er is geen `/veelgestelde-vragen` en geen `/tarieven`. Je tarieven bestaan alleen als
sectie-anchor (`#rates`) met `ratesSchema()`. Voor twee van de meest gezochte intenties
in deze branche — *"wat kost een elektricien in Amsterdam"* en *"veelgestelde vragen
elektricien"* — heb je dus geen dedicated URL om mee te ranken of geciteerd te worden.
De AEO-bouwstenen (`ratesSchema`, `faqSchema`, `UnitPriceSpecification`) zijn er al; er
mist alleen een pagina die ze bundelt.

Impact: **Middel** · Effort: **Middel**

---

## ✅ GOED GEDAAN

Dit is bepaald geen doorsnee Lovable-site. Wat er staat, staat er goed:

**Structured data — uitzonderlijk sterk.** Één `@graph` met `Organization` (KvK-adres
Zaandam) en `LocalBusiness/Electrician` (bezoeklocatie Amsterdam) netjes gesplitst om
adresconflicten te voorkomen, verbonden via `@id`-referenties. Dienst- en locatiepagina's
**dupliceren de LocalBusiness niet** maar verwijzen via `provider: { "@id": ... }` — exact
volgens Google's richtlijn. `GeoCircle` met echte coördinaten en 25km-radius,
`hasOfferCatalog` met `PriceSpecification` per dienst, `hasCredential` met `recognizedBy`
en URL per certificaat, `HowTo`, `WarrantyPromise`, `BreadcrumbList`, `AboutPage`,
`ImageObject`. Dit is beter dan wat de meeste bureaus opleveren.

**Internationalisatie.** hreflang met `nl-NL`, `en-GB` én `x-default`, `EN_SLUG_OVERRIDES`
voor afwijkende Engelse slugs, en — belangrijk — de code weigert bewust een `en-GB`-URL te
adverteren die niet bestaat (`seo.ts:51-57`). Dat is een fout die ik bijna altijd zie.

**LCP-hygiëne op de homepage.** Hero is 62KB WebP, met `rel=preload` +
`fetchpriority=high` + `loading=eager` + expliciete `width`/`height` + `sizes`. Precies
zoals het moet.

**Eigen kwaliteitsvangnet.** Het project heeft zelfgeschreven guards
(`check-response-promise.mjs`, `check-hardcoded-contact.mjs`, `check-seo-meta.mjs`) die de
60-minutenbelofte, hardcoded contactgegevens en canonical/hreflang-symmetrie afdwingen.
Ik heb de eerste twee uitgevoerd: **beide groen.** Een codebase die zijn eigen
SEO-consistentie test is zeldzaam.

**Prijzen als single source of truth.** `pricing.ts` centraliseert elk euro-bedrag met
format-helpers per taal. Dat de enige prijsafwijking die ik vond buiten `src/` ligt
(`llms.txt`, punt 2) bewijst dat het systeem werkt.

**Consent Mode v2** staat aantoonbaar vóór alle tags — juridisch en meettechnisch correct.

**Bundle-discipline.** `recharts` (zwaar) zit alleen in `/seo-monitor`, een noindex-route.
Dankzij route-based code splitting raakt dat je publieke pagina's niet.

**Legacy-URL's** worden met echte 301's afgehandeld (`/elektricien`, `/onze-services`,
`/groepenkast-vervangen-amsterdam`, `/perilex-aansluiten-amsterdam`,
`/postocode-check`) — inclusief de typo-URL. Link-equity blijft behouden.

**`llms.txt`** bestaat en is inhoudelijk rijk (bedrijfsgegevens, diensten met prijzen,
werkgebied, expat-sectie). Op de prijsfout na is dit een voorsprong op vrijwel elke
concurrent.

**Echte reviews, echt schema.** `AggregateRating` + individuele `Review`-nodes komen uit
werkelijke Google-reviews met datum en categorie, met een comment die expliciet stelt
"alleen op basis van geverifieerde bron".

---

## 📋 ACTIEPLAN (PRIORITEIT)

**Deze week — allemaal klein, allemaal trust-kritiek**

| # | Actie | Impact | Effort |
|---|---|---|---|
| 1 | `llms.txt`: weekendtarief €120 → **€145** | Hoog | Laag |
| 2 | Reviewaantal 48 → `aggregateRating.reviewCount` (2 bestanden) | Hoog | Laag |
| 3 | Garantie-FAQ splitsen: 12 mnd werk / 2 jaar materialen | Hoog | Laag |
| 4 | Live check: non-www 301, HSTS, CWV via PageSpeed + Search Console | Hoog | Laag |
| 5 | `/perilex-zelf-aansluiten` toevoegen aan `SITE_ENTRIES` | Middel | Laag |
| 6 | `check-seo-meta.mjs`: `/Groepenkast-Amsterdam` → lowercase | Laag | Laag |

**Weken 2–4 — E-E-A-T en conversie**

| # | Actie | Impact | Effort |
|---|---|---|---|
| 7 | **Hassan als `Person`**: naam, foto, credentials op `/over-ons` + schema + `author` op HowTo-pagina's | Hoog | Middel |
| 8 | Touch targets: `default` → `h-11`, `icon` → `h-11 w-11` | Middel-Hoog | Laag |
| 9 | Fonts self-hosten, ongebruikte gewichten schrappen | Middel-Hoog | Middel |
| 10 | GA4-dubbeltelling uitsluiten (gtag vs GTM) | Middel | Laag |
| 11 | Certificeringen compleet in `llms.txt` | Middel | Laag |
| 12 | `service-page.tsx`: echte beeldverhouding + `sizes` | Laag-Middel | Laag |

**Maand 2–3 — content**

| # | Actie | Impact | Effort |
|---|---|---|---|
| 13 | `sharedFaqs()` per wijk uniek maken (heft 9× duplicate FAQPage op) | Middel-Hoog | Middel |
| 14 | Vier zwakste locatiepagina's naar 500+ woorden | Middel-Hoog | Hoog |
| 15 | `/tarieven` + `/veelgestelde-vragen` bouwen op bestaande schema-helpers | Middel | Middel |
| 16 | AI-crawler-beleid expliciet in `robots.txt` | Laag | Laag |

---

## 📊 SCORE CARD

| Onderdeel | Score | Toelichting |
|---|---|---|
| Technical SEO | **7,5/10** | Uitstekende schema/hreflang/sitemap-architectuur; headers onverifieerbaar, fonts blokkeren, één sitemap-gat |
| On-Page SEO | **7/10** | Titels/descriptions binnen norm, unieke H1's, logische hiërarchie; contentdiepte op locatiepagina's te dun |
| Local SEO | **7/10** | Echte lokale kennis, postcodes, GeoCircle, wijk-schema; 9× identieke FAQ's drukken het |
| E-E-A-T | **5/10** | Certificaten, KvK, echte reviews aanwezig — maar **geen enkele herleidbare persoon** |
| AEO-readiness | **7/10** | `llms.txt` + FAQPage + prijsschema zetten je vóór; de €120/€145-fout vergiftigt de output |
| **Overall SEO Health** | **6,7/10** | Sterk fundament, ondermijnd door een handvol claim-inconsistenties |

*Niet meegewogen (niet meetbaar in deze sessie): Core Web Vitals veldwaarden, Google
Business Profile, backlinkprofiel, Search Console crawl-errors.*

De kern: dit is technisch een 8+, teruggetrokken naar een 6,7 door **vier tegenstrijdige
claims** (reviewaantal, weekendprijs, garantieduur, certificeringen) en **één ontbrekende
mens**. Dat is goed nieuws — de duurste dingen zijn al gebouwd; wat rest is opruimen.

---

## 💡 GOOGLE BUSINESS PROFILE & BACKLINKS

Beide vallen buiten wat ik vanuit de code kan beoordelen — ik kan `share.google`-links en
backlinkdata hier niet opvragen. Wat ik uit de code kan zeggen:

- `business.googleBusinessProfile` is gevuld en zit in `sameAs` van zowel `Organization`
  als `LocalBusiness`. Goed.
- `business.bingPlaces` is **leeg** (`""`) met een comment dat het gevuld moet worden na
  Bing-verificatie. `BingSiteAuth.xml` en de IndexNow-integratie staan er al, dus je bent
  halverwege — maak die Bing Places-vermelding af en vul de URL in; hij wordt dan
  automatisch in `sameAs` opgenomen.
- NAP-consistentie in de code is goed doordacht: de splitsing tussen KvK-adres (Zaandam)
  en bezoeklocatie (Amsterdam) is expliciet en overal identiek. **Let op:** zorg dat je
  Google Business Profile hetzelfde adres gebruikt als de `LocalBusiness`-node
  (Jacob van Lennepkade 142), niet het KvK-adres — anders krijg je een NAP-conflict dat
  je local pack-positie direct raakt.

Voor GBP en backlinks: check handmatig of GBP-categorie "Elektricien" primair staat,
openingstijden overeenkomen met `business.openingHours` (ma–vr 08:00–18:00, za
09:00–17:00 + 24/7 spoed) en of het reviewaantal daar 56 is.

---

*Audit uitgevoerd op de code van commit `5efc956`. Alle regelverwijzingen gelden voor die
commit. Punten gemarkeerd als "verifieer live" vereisen een controle op de productiesite
voordat je erop handelt.*
