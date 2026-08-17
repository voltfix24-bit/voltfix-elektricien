# Schema-status in Search Console + vervolgacties

## Wat de inspectie liet zien

Eigendom: `sc-domain:voltfix.nl` (siteOwner). Per pagina de status van de versie die Google in de index heeft:

| Pagina | Index | Rich results herkend | Laatste crawl |
|---|---|---|---|
| `/` (homepage) | Geïndexeerd | Review snippets (VoltFix) | 16 aug 2026 |
| `/perilex-amsterdam` | Geïndexeerd | Review snippets + Breadcrumbs | 16 aug 2026 |
| `/en-gb/perilex-amsterdam` | Geïndexeerd | Review snippets + Breadcrumbs | 14 aug 2026 |
| `/elektricien-amsterdam` | Geïndexeerd | Geen | 18 jul 2026 |
| `/groepenkast-amsterdam` | Ontdekt, niet geïndexeerd | n.v.t. | nooit gecrawld |
| `/spoed-elektricien-amsterdam` | Ontdekt, niet geïndexeerd | n.v.t. | nooit gecrawld |

Conclusie: de schema-entiteit is door Google geaccepteerd — geen fouten, verdict PASS op elke gecrawlde pagina. Waar niets herkend is, komt dat doordat de crawl ouder is dan de schema-wijzigingen of doordat de pagina nog niet is opgehaald.

Twee aandachtspunten die opvielen en nog niet zijn onderzocht:
- FAQ-rich-results worden op geen enkele gecontroleerde pagina gerapporteerd, terwijl er FAQPage-schema aanwezig is.
- Google noemt een vreemde interne verwijzende URL: `/en-gb/onze-services546012d6`.

## Voorgestelde vervolgstappen

1. **Interne links naar de niet-geïndexeerde pagina's versterken.** `/groepenkast-amsterdam` en `/spoed-elektricien-amsterdam` zijn alleen "ontdekt". Ze prominenter linken vanaf de homepage, `/elektricien-amsterdam` en de wijkpagina's, zodat Google ze prioriteert.
2. **De rare URL uitzoeken en opruimen.** Controleren waar `/en-gb/onze-services546012d6` vandaan komt en die link corrigeren of 301'en naar de juiste EN-servicepagina.
3. **FAQ-schema natrekken.** Verifiëren of het FAQPage-blok op de betreffende pagina's aan de huidige Google-eisen voldoet en of het niet als losse node buiten de paginacontext staat; zo nodig koppelen aan de pagina-entiteit.
4. **Sitemap-datums.** Controleren dat `lastmod` in de sitemap de recente schema-wijzigingen weerspiegelt, zodat Google eerder hercrawlt.

## Wat jij zelf moet doen

Deze API kan geen live test of hercrawl aanvragen. Voor `/elektricien-amsterdam`, `/groepenkast-amsterdam` en `/spoed-elektricien-amsterdam`: open URL-inspectie in Search Console, klik "Live URL testen" en daarna "Indexering aanvragen".

## Technische scope

Wijzigingen betreffen `src/routes/*` (interne links), mogelijk `src/lib/seo.ts` (FAQ-schema) en de sitemap-generatie. Geen wijzigingen aan de LocalBusiness-entiteit — die werkt aantoonbaar.
