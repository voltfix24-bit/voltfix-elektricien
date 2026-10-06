# Read-only diagnose Google Ads-kwaliteit VoltFix

Alleen lezen. Er verandert niets aan code, campagnes, advertenties, biedingen, budgetten, zoekwoorden, assets of conversies.

## Wat wordt opgehaald (laatste 30 dagen, waar nuttig vergeleken met 90 dagen)
1. Het account, de actieve zoekcampagnes en de advertentiegroepen, met status, budget en biedstrategie.
2. Per actief zoekwoord met vertoningen: match type, campagne, advertentiegroep, vertoningen, klikken, CTR, kosten, conversies, CPA, kwaliteitsscore en de drie onderdelen (verwachte CTR, advertentierelevantie en landingspagina-ervaring). Daarnaast de kwaliteitsscore over 90 dagen.
3. Alle zoekwoorden met kwaliteitsscore 6 of lager, gegroepeerd per zwak onderdeel.
4. Een weging van de problemen naar kosten en klikken: welk deel van de uitgaven gaat naar zoekwoorden met een lage score, en welk onderdeel kost het meeste geld.
5. Per advertentie: de landingspagina, de advertentiesterkte, alle koppen en beschrijvingen, de beoordelingsstatus, de afkeuringsredenen en de gekoppelde extensies (sitelinks, highlights en bellen).
6. Zoektermen met kosten, vergeleken met het zoekwoord, de advertentie en de landingspagina. Termen die duur zijn en slecht aansluiten worden gemarkeerd. Ook het aandeel kosten zonder zichtbare zoekterm wordt berekend.
7. Een korte controle van de landingspagina's op www.voltfix.nl: of het zoekwoord in de kop staat, of bellen en WhatsApp direct zichtbaar zijn, en hoe snel de pagina op mobiel laadt.

## Opzet van het rapport
- Tabellen per onderdeel 1 t/m 6.
- 5 tot 10 verbeterkansen op volgorde van prioriteit, elk met de oorzaak uit de data en de verwachte impact. Er wordt niets uitgevoerd.
- Een aparte sectie "Niet op te halen". Daar staan bijvoorbeeld de veilingstatistieken, zoektermen die Google verbergt, kwaliteitsscores op dagniveau en welk nummer er belde bij gesprekken vanuit een advertentie.
- Volgens de voorkeuren: alleen Nederlandse cijfers als betrouwbare basis, Ads en organisch apart, groepenkast buiten beschouwing tenzij er actieve kosten zijn.

## Oplevering
- Het rapport als downloadbaar bestand: `ads/voltfix-kwaliteitsscore-diagnose-6-oktober-2026.md`. Het is ook geschikt om aan ChatGPT te geven.
- In de chat komt een korte samenvatting van de drie grootste oorzaken.

## Technische details
- Alleen leesvragen op het gekoppelde account: campagne, advertentiegroep, keyword_view (met kwaliteitsinformatie), ad_group_ad (responsive search ad, advertentiesterkte, beleidsstatus), extensies op campagne- en accountniveau, en search_term_view.
- Er worden geen wijzigingen aan het account gedaan en geen bestanden in het project aangepast.
