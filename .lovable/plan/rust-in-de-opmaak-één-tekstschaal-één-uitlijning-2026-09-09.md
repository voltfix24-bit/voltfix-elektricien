# Rust in de opmaak: één tekstschaal, één uitlijning

Dit tweede auditrapport is gemeten op de oude homepage. Een deel is gisteren al opgelost (mobiele balk, herhaalde diensten- en CTA-blokken, dubbele belofteregel op de homepage). Wat overblijft gaat vooral over opmaak: te veel verschillende tekstgroottes, alles gecentreerd, en te lange regels.

## Wat er verandert

**1. Eén tekstschaal voor de hele site**
Nu worden elf verschillende groottes gebruikt. Die breng ik terug naar zeven vaste rollen:

| Rol | Mobiel / desktop | Waarvoor |
|---|---|---|
| Titel | 34 / 56 | alleen de kop bovenaan de homepage |
| Sectiekop | 26 / 32 | elke sectiekop, zonder uitzondering |
| Kaartkop | 19 / 20 | kaartjes en vragen in de FAQ |
| Leestekst | 17 | alle lopende tekst, ook in kaartjes |
| Label | 14 | data, filters, knoplabels, voettekst — dit wordt de ondergrens |
| Bedrag | 30 / 34 | alleen prijzen en de 4,9 |
| Kleine letter | 12 | alleen de tariefvoetnoot en de KvK-regel |

Concreet verdwijnt alle tekst van 10 en 11 pixels: de belofte onder de knoppen, review-data, prijsondertitels en de voettekst gaan naar 14. Het telefoonnummer bovenin wordt kleiner dan de sectiekoppen.

**2. Koppen links uitlijnen**
Sectiekoppen en intro's staan nu gecentreerd terwijl alles eronder links staat. Alles gaat links uitlijnen, zodat er één leeslijn door de pagina loopt. Alleen de afsluitende oproep onderaan blijft gecentreerd.

**3. Kortere regels**
Intro's lopen nu tot 95 tekens per regel. Die krijgen een leesbreedte van ongeveer 75 tekens.

**4. Vaste witruimte tussen secties**
De ruimte tussen secties varieert nu van 150 tot 225 pixels. Dat wordt twee vaste waarden: 72 op mobiel, 112 op desktop.

**5. Losse ampersands repareren**
Op vier plekken breekt de regel vlak vóór het "&"-teken ("Gecertificeerd / & betrouwbaar"). Die teken-combinaties worden aan elkaar geplakt of herschreven zonder "&".

**6. Losse apostrof**
"pagina's" en "24 uur 's avonds" breken nu op het apostrof-teken. Dat teken wordt vervangen door de variant die niet afbreekt.

**7. Prijzen krijgen een eigen gewicht**
Bedragen en sectiekoppen hebben nu dezelfde grootte, waardoor een bedrag als kop leest. Bedragen worden groter en zwaarder.

## Wat ik bewust nu niet doe

- **Tijdenwidget vooraf tonen aan Google**: de audit vraagt om de eerste dag en tijden meteen mee te sturen. Dat raakt de bestelstroom en verdient een eigen ronde; de rest van deze lijst is opmaak en risicoloos.
- **Structured data**: gecontroleerd — bedrijfsgegevens, 24/7-openingstijden, 4,9 uit 59 reviews, losse klantquotes, FAQ's en tarieven staan er al in. Ik controleer alleen of de nieuwe homepage-indeling dit nog klopt meesturen.
- Kleurcontrast en snelheid: niet beoordeeld in dit rapport, dus geen wijziging.

## Technisch

Ik voeg de schaal toe als vaste tekstklassen in `src/styles.css` (bijvoorbeeld `.t-display`, `.t-h2`, `.t-body`, `.t-meta`, `.t-amount`, `.t-fine`) plus een sectie-hulpklasse voor padding en leesbreedte, en pas die toe in de homepage, de dienstenpagina's en de gedeelde onderdelen (kaarten, FAQ, reviews, tarieven, voettekst, topbalk). Bestaande teksten, links en metagegevens blijven ongewijzigd.
