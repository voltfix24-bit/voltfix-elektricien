# Technische SEO-audit — bevindingen en voorgestelde fixes

De audit is uitgevoerd (read-only, niets gewijzigd). Het volledige rapport per punt staat in de chat. Hieronder alleen de punten die actie verdienen, in volgorde van impact.

## 1. Contactgegevens kloppen niet overal (hoog)
- `src/lib/business.ts:30` heeft KvK **95572589**, maar eerder is **91447127** doorgegeven. Dit nummer staat ook hardgecodeerd in `src/components/trust-strip.tsx:14,26`, `src/data/locations.ts:55`, vier EN-wijkpagina's, `src/lib/email-templates/quote-confirmation.tsx:104,137` en `public/llms.txt:15`.
- Actie: één juist nummer bevestigen, `business.kvk` als enige bron gebruiken en alle hardgecodeerde varianten vervangen.

## 2. Belangrijke pagina's ontbreken in de sitemap (hoog)
Niet opgenomen: `/onze-services`, `/groepenkast-vervangen-amsterdam`, `/en-gb/groepenkast-vervangen-amsterdam`, `/en-gb/` (root van de EN-site staat als `/en-gb`), `/perilex-aansluiten-amsterdam`, `/elektricien`, `/perilex`, `/postocode-check`, `/review`.
- Actie: per URL bepalen of hij indexeerbaar hoort te zijn → toevoegen aan `SITE_ENTRIES` in `src/lib/site-urls.ts`, óf 301'en naar de canonieke pagina, óf `noindex` geven.

## 3. Negen routes zonder `head()` (hoog)
`elektricien.tsx`, `perilex.tsx`, `perilex-aansluiten-amsterdam.tsx`, `groepenkast-vervangen-amsterdam.tsx`, `en-gb.groepenkast-vervangen-amsterdam.tsx`, `onze-services.tsx`, `postocode-check.tsx`, `review.tsx`, `en-gb.tsx` (layout, terecht).
- Actie: redirect-only routes zo laten; échte pagina's (`onze-services`, `groepenkast-vervangen-amsterdam`, `postocode-check`, `review`) krijgen eigen title, description, canonical, `altLinks()` en Service/Breadcrumb JSON-LD.

## 4. Wijkpagina's zijn te sterk gelijk (midden)
Alleen de unieke body: 315–444 woorden, 141–194 unieke woorden, 23,4% gemiddelde 6-gram-overlap. Inclusief de gedeelde blokken (tarieven, monteur, reviews, FAQ, CTA's, wijklinks) loopt de overlap op tot **67,9% gemiddeld, max 69,9%**.
- Actie: per wijk 200–300 woorden echt lokale inhoud toevoegen (straten, pandtypes, netbeheerder-situatie, concrete klussen) en de FAQ per wijk gedeeltelijk uniek maken, zodat de verhouding uniek/gedeeld kantelt.

## 5. Zware PNG's in `src/assets` (midden)
`voltfix-hero-reference.png` en `voltfix-hero-amsterdam.png` 2,2 MB, `voltfix-meterkast.png` 1,4 MB, `voltfix-vw-idbuzz.png` 1,4 MB, `voltfix-monteur.png` 1,2 MB, `voltfix-hero-transparent.png` 1,1 MB, `voltfix-perilex-scene.png` 1,0 MB, `voltfix-hero-scene.png` 1,0 MB.
- Actie: uitzoeken welke nog gebruikt worden, die naar WebP converteren en de ongebruikte varianten verwijderen.

## 6. Kleine meta-correcties (laag)
- `/perilex-zelf-aansluiten`: description 170 tekens (te lang, wordt afgekapt).
- `/en-gb/elektricien-amsterdam`: title slechts 21 tekens ("Electrician Amsterdam") — geen merk of USP.
- `/en-gb/groepenkast-amsterdam` en `/en-gb/elektricien-amsterdam` gebruiken NL-slugs in een EN-pad; alleen wijzigen mét 301, omdat ze geïndexeerd zijn.

## Technische details
Alle metadata loopt via `pageMeta()` / `altLinks()` in `src/lib/seo.ts`; wijkpagina's via `locationHead()` in `src/components/location-page.tsx:26`. URL-lijst voor sitemap én IndexNow: `src/lib/site-urls.ts`. Wijzigingen aan URL's altijd samen met de bestaande 301-map in `src/routes/__root.tsx`.
