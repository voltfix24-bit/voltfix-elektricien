# Bronresultaten Elektramat ABB-configurator, build N4CWHP0R74 (alleen onderzoek)

Gemeten op 19 okt 2026, rond 20:45 UTC, in een afgeschermde browser zonder inlog. Cookies geweigerd. Alle bedragen zijn wat de pagina toonde. In VoltFix is niets gewijzigd.

**Over opslaan:** de configurator stuurt na elke wijziging (en één keer bij het laden) zelf een opslagverzoek. Bij de allereerste verkenning kwam één zo'n verzoek bij Elektramat aan, met exact de ongewijzigde startconfiguratie. Het buildnummer bleef hetzelfde. Bij alle tests daarna heb ik die opslagverzoeken in de browser zelf afgevangen. Ze zijn dus nooit bij Elektramat aangekomen. Er is niets besteld en niets in een winkelwagen gezet.

## 1. Geladen startconfiguratie

- Naam: "ABB SN201L (schroefgroepen) groepenkast 390x220 mm (HxB) 1 Fase". Artikelnummer GK-N4CWHP0R74.
- Gekozen: zonder busboard, 1 fase, eenvoudige modus, invoer van boven.
- Kast: ABB-HAF 390x220 mm, 88 mm diep. 2 rijen van 12 = 24 moduleplaatsen, waarvan 12 gebruikt.
- Totaalprijs: **€219,30 excl. btw / €265,35 incl. btw**. Levertijd 10 werkdagen. "Volledig afgemonteerd en voorbedraad".

| Aantal | Onderdeel | ABB-artikelnr. | Modules per stuk | Losse prijs excl. |
|---|---|---|---|---|
| 1 | Kast ABB-HAF 390x220 (startprijs 1-fase) | – | 24 plaatsen | €114,00 |
| 1 | Hoofdschakelaar 2P 40A | 401043991 | 2 | €11,00 |
| 2 | Aardlekschakelaar 2P 40A 30mA type A | 401043421 | 2 | €26,99 |
| 6 | Installatieautomaat 1P+N 16A B (SN201L) | 401052764 | 1 | €6,72 |

Controle: 114,00 + 11,00 + 2×26,99 + 6×6,72 = **€219,30**. Dat is precies de totaalprijs. In deze build zit dus geen aparte assemblagetoeslag bovenop de kast en de onderdelen. Incl. btw: 219,30 × 1,21 = €265,35.

## 2. Moduleplaatsen per onderdeel (volgens Elektramat)

| Onderdeel | Zonder busboard (SN201L) | Met busboard (ABB-HAF) |
|---|---|---|
| Installatieautomaat 1P+N | 1 | 1 (art. 401038476, €12,97) |
| Aardlekschakelaar 2P | 2 | 2 (art. 401012875, €65,05) |
| Hoofdschakelaar 2P / 4P | 2 / 4 | 2 (art. 401014583, €37,68) / – |
| Aardlekautomaat 1P+N (16A, 30mA) | 1 | – |
| Aardlekautomaat 3P+N | 4 | – |
| Fornuisgroep 2P+2N | 2 | – |
| Beltrafo 8V / beltrafo 12-24V | 2 / 4 | – |
| Krachtgroep 3P+N, aardlekschakelaar 4P | 4 | – |
| Dinrail-stopcontact | 3 | – |
| Kilowattuurmeter 1-fase / 3-fase | 1 / 4–5 | – |
| Overspanningsbeveiliging 2P / 4P | 1 / 2 | – |

– = niet uitgelezen. Ik heb voor busboard alleen de drie onderdelen van de startconfiguratie bekeken.

Kasten van dit ABB-merk en hun startprijzen (1-fase / 3-fase, excl. btw):

| Kast | Rijen | Plaatsen | Startprijs 1-fase / 3-fase |
|---|---|---|---|
| 280x220 | 1×12 | 12 | €102 / €114 |
| 390x220 | 2×12 | 24 | €114 / €126 |
| 610x220 | 3×12 | 36 | €186 / €198 |
| 390x440 | 4×12 | 48 | €222 / €234 |
| 390x330 | 12+12+6+6 | 36 | €186 / €192–198 |
| Combinatie 390x220 + 280x220 | 3×12 | 36 | €210 |

## 3. Tests: telkens één wijziging vanaf de startconfiguratie

Na elke test heb ik de pagina opnieuw geladen, zodat de volgende test weer bij het begin startte. Startpunt: €219,30 excl. / €265,35 incl., 12 van 24 plaatsen, kast 390x220.

| Wijziging | Prijs excl. / incl. | Verschil excl. | Plaatsen | Kast |
|---|---|---|---|---|
| 4 groepen (2 automaten minder) | €205,86 / €249,09 | −€13,44 | 10/24 | gelijk |
| 5 groepen | €212,58 / €257,22 | −€6,72 | 11/24 | gelijk |
| 7 groepen | €226,02 / €273,48 | +€6,72 | 13/24 | gelijk |
| 8 groepen | €232,74 / €281,62 | +€13,44 | 14/24 | gelijk |
| 9 groepen | €239,46 / €289,75 | +€20,16 | 15/24 | gelijk |
| 12 groepen | €259,62 / €314,14 | +€40,32 | 18/24 | gelijk |
| 13 groepen | €266,34 / €322,27 | +€47,04 | 19/24 | gelijk; de 13e automaat gaat naar rij 2 |
| 16 groepen (maximum van de knop) | €286,50 / €346,66 | +€67,20 | 22/24 | gelijk |
| +1 aardlekschakelaar | €246,29 / €298,01 | +€26,99 | 14/24 | gelijk |
| Beltrafo aan (1A 8V) | €252,11 / €305,05 | +€32,81 | 14/24 | gelijk |
| +1 fornuisgroep | €268,69 / €325,11 | +€24,96 onderdeel, plus €24,43 "3 componenten verplaatst" | 14/24 | gelijk |
| +1 aardlekautomaat 1P+N 16A 30mA (1 module) | €253,30 / €306,49 | +€34,00 | 13/24 | gelijk |
| Naar 3 fase | €243,65 / €294,82 | +€24,35 | 14/24 | gelijk; hoofdschakelaar wordt 4P |
| Uitbreiden naar 390x440 | €360,03 / €435,64 | +€108,00 kast, plus €32,73 verplaatsingstoeslag | 12/48 | 390x440 |
| Uitbreiden naar 390x220 + 280x220 | €346,83 / €419,66 | +€96,00 kast, plus €31,53 verplaatsingstoeslag | 12/36 | combinatie |
| Wisselen naar met busboard | €302,24 / €365,71 | +€55,46 onderdelen, plus €27,48 "5 componenten verplaatst" | 12/24 | ABB-HAF 390x220 |

Uitleg bij de tests:
- Elke extra gewone groep kost **€6,72 excl. btw**. Dat is precies de losse prijs van één automaat. Er zit geen extra montagebedrag per groep in.
- **3 fase:** de kast kost €12,00 meer (€126 in plaats van €114). De 4P-hoofdschakelaar kost €23,35 in plaats van €11,00 voor de 2P, dus €12,35 meer. Samen is dat precies €24,35.
- **Kracht-aardlekautomaat (3P+N):** die kun je in de eenvoudige 1-fase modus niet kiezen. De losse prijzen in de onderdelenlijst zijn €103,99 (16A B, 30mA) tot €197,44 (16A, 100mA). Plaatsen in een 3-fase build heb ik niet getest.
- **Busboard:** de verwachte som van kast en onderdelen is €311,60. Elektramat berekent zelf €274,76. Dat verschil van −€36,84 kan ik uit de openbare gegevens niet verklaren. Ik heb er daarom geen regel van afgeleid.

## 4. Meer dan 24 modules

- In de kast van 390x220 stopt de configurator bij 24/24. De extra plusklik deed niets: de prijs en het aantal onderdelen bleven gelijk, en er verscheen geen melding.
- Voorbeelden: 16 automaten + 3 aardlekschakelaars = 24/24, €313,49. 16 automaten + 1 fornuisgroep = 24/24; de tweede fornuisgroep werd geweigerd.
- Er komt **niet automatisch** een tweede kast bij. Een grotere kast of combinatie kies je alleen zelf via "Bouw je groepenkast uit". Daar staan 13 keuzes, van +12 tot +48 modules.
- Een aparte regel voor koppelen of extra bedraden tussen twee kastdelen heb ik niet gezien. Bij de combinatie 390x220 + 280x220 bestaat de meerprijs alleen uit de kastprijs (€210 in plaats van €114) plus de verplaatsingstoeslag.
- Wat wel eerder grenzen trekt, staat in de openbare regels van Elektramat:
  - maximaal 16 automaten in deze kast;
  - "zachte" regels, waarvan één ongeveer 4 groepen per aardlekschakelaar noemt;
  - per kastgrootte waar onderdelen standaard komen te zitten.
- Die 4-per-aardlekschakelaar is een zachte regel van Elektramat zelf. Het is geen algemene norm.

## 5. Waar de prijs uit bestaat

- **Losse onderdeelprijs:** de prijs per onderdeel in de lijst. Die komt één op één terug in de totaalprijs.
- **Meerprijs in de configurator:** het verschil in kastprijs, zoals 1 naar 3 fase (+€12) of een grotere kast. Een aparte meerprijs per onderdeel heb ik niet gezien.
- **Kast- en assemblagetoeslag:** zit niet apart in de prijs. "Afgemonteerd en voorbedraad" valt waarschijnlijk binnen de startprijs van de kast, maar dat staat nergens los vermeld.
- **Verplaatsingstoeslag:** wel bewezen. Elektramat rekent een percentage van het totaal zodra onderdelen van hun standaardplek worden verschoven:

| Verschoven onderdelen | Toeslag |
|---|---|
| 1 | 2% |
| 2 | 5% |
| 3 of meer | 10% |

  Dat percentage klopt in alle vier de metingen: €24,43, €32,73, €31,53 en €27,48.

## 6. Niet bekeken of niet toegankelijk

- Hoe de prijs eruitziet na echt opslaan of in de winkelwagen. Dat mocht niet.
- Montage- of bedradingstijd. Het veld voor montagetijd bij een volle kast is leeg.
- Prijzen voor zakelijke klanten of na inloggen.
- De geavanceerde modus en invoer van de zijkant of onderkant.
- Busboard bij andere kastmaten.

## Bronnen

Pagina:
- https://www.elektramat.nl/groepenkast-configurator/index/index/build-id/N4CWHP0R74/

Openbare gegevens die de pagina zelf ophaalt, onder https://generator-backend.elektramat.nl/api/1/:
- `build/N4CWHP0R74` (startconfiguratie)
- `brand/46/brand-components` en `brand/7/brand-components` (artikelnummers, prijzen, moduleplaatsen)
- `brand/46/fuseboxes`, `brand/7/fuseboxes` en `brand-fusebox/522` (kasten, rijen, startprijzen)
- `rules` (plaatsingsregels)
- `additional-costs` (verplaatsingstoeslag)
- `brands/calculate-prices` (prijs per merk)
- `brand-fusebox/522/default-fill` (standaardvulling)

## Vergelijking met de VoltFix-offertecode (alleen gelezen)

- De huidige offertecode rekent met pakketten, opties en "extra groep" met een maximaal aantal.
- Wat ontbreekt:
  - hoeveel moduleplaatsen een onderdeel inneemt;
  - hoeveel rijen of plaatsen een kast heeft;
  - wanneer een kast vol is;
  - een grotere kast of extra kastdeel als meerprijs;
  - verschil tussen 1 en 3 fase per kast;
  - het verschil tussen busboard en conventioneel.
- Het soort regel "component" bestaat al in de offertecode, maar heeft nog geen veld voor moduleplaatsen.
