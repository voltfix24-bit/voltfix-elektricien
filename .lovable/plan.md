## Doel
Bij de overzetting van voltfix.nl naar deze site:
1. Geen enkele scorende URL verliezen (perilex + elektricien + Engels).
2. De site volledig in twee talen aanbieden: Nederlands (hoofd) en Engels (`/en-gb`) voor expats.

## ⚠️ Belangrijkste probleem nu
Je huidige scorende pagina's op voltfix.nl zijn:

| URL die nu scoort | Positie | Volume | Status op deze site |
|---|---|---|---|
| `/perilex-amsterdam` | #6 "perilex aansluiten" | 4.400/mnd | ❌ redirect wég naar `/perilex-aansluiten-amsterdam` |
| `/elektricien-amsterdam` | #4 "nood elektricien" | 140/mnd | ❌ redirect naar home |
| `/en-gb/elektricien-amsterdam` | #3 "electrician close to me" | 880/mnd | ❌ bestaat niet |
| `/en-gb` | #20 "electrician" | 3.600/mnd | ❌ bestaat niet |

Zodra je het domein overzet, serveert deze site dus precies díe URL's verkeerd. Dat fixen we.

## Aanpak

### 1. Perilex-URL terugzetten als content (grootste asset)
- Echte perilex-content laten leven op `/perilex-amsterdam` (de URL die scoort), met self-canonical.
- `/perilex-aansluiten-amsterdam` wordt een 301 → `/perilex-amsterdam` (omgekeerd van nu), zodat interne links blijven werken.
- Navigatie + sitemap bijwerken naar `/perilex-amsterdam`.

### 2. Elektricien-pagina echt maken
- `/elektricien-amsterdam` wordt een echte NL-landingspagina (elektricien/nood-elektricien) i.p.v. redirect naar home.

### 3. Engelstalige sectie onder `/en-gb`
Nieuwe Engelse route-bestanden die exact je oude paden matchen:
- `/en-gb` — English homepage ("Electrician Amsterdam")
- `/en-gb/elektricien-amsterdam` — English electrician page (matcht de scorende URL met #3)
- `/en-gb/perilex-amsterdam` — perilex in het Engels (waardevol voor expats met nieuwe keukens)
- Plus Engelse versies van de kern-servicepagina's (spoed, groepenkast, stroomstoring, contact) zodat de hele site tweetalig is.

Engelse teksten worden natuurlijk geschreven (geen machinevertaling-gevoel), gericht op expats in Amsterdam.

### 4. Taalwissel + internationale SEO
- Taalschakelaar (NL ⇄ EN) in de header en footer, die naar de equivalente pagina in de andere taal linkt.
- `hreflang`-tags op elke pagina: elke NL-pagina verwijst naar zijn EN-tegenhanger en andersom, plus `x-default`. Zo begrijpt Google dat het taalvarianten zijn (geen duplicate content) en toont het de juiste taal per bezoeker.
- `<html lang>` correct per taal (`nl` resp. `en-GB`).

### 5. Sitemap & robots
- Sitemap uitbreiden met `/perilex-amsterdam`, `/elektricien-amsterdam` en alle `/en-gb/*` paden.

### 6. Overzet-checklist (hosting)
- Na publicatie: DNS van voltfix.nl naar deze site, non-www → www 301 op hostingniveau (zoals al genoteerd in `business.ts`).
- Verifiëren in Google Search Console + sitemap opnieuw indienen.

## Technische details
- Stack: TanStack Start, file-based routing. Engelse routes als aparte bestanden (`en-gb.tsx`, `en-gb.elektricien-amsterdam.tsx`, etc.) → maximale controle over Engelse copy + per-pagina `head()`/hreflang, en SSR/SEO-vriendelijk.
- Herbruik bestaande presentatiecomponenten (`ServicePage`, `Prose`) met Engelse content-props; geen logica-duplicatie.
- hreflang via `links` in elke route's `head()`; canonical blijft per leaf (nooit in `__root.tsx`).
- Taalschakelaar bepaalt de tegenhanger-URL via een centrale mapping NL↔EN.

## Volgorde
1. Perilex-URL omdraaien + elektricien-pagina (zero ranking-risk eerst).
2. Engelse sectie + taalschakelaar + hreflang.
3. Sitemap/robots bijwerken.
4. Publiceren + Search Console.

Wil je dat ik álle servicepagina's ook in het Engels meeneem (volledig tweetalig), of starten we met de pagina's die nu al scoren + homepage en breiden we daarna uit?