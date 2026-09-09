# Homepage herzien op basis van de audit

Doel: dezelfde inhoud, andere volgorde, minder herhaling — zodat de pagina verkoopt aan de Amsterdammer met een donkere meterkast, niet alleen aan Google. Aanspreekvorm wordt overal **je/jij**.

## Nieuwe volgorde van de homepage

| # | Sectie | Wat er verandert |
|---|--------|------------------|
| 01 | Hero + sterrenscore | 4,9 ★ uit 59 reviews direct onder de knoppen |
| 02 | Spoed nú / klus plannen | nieuw blok met twee duidelijke ingangen |
| 03 | Wat gebeurt er na je telefoontje | nieuw: drie stappen |
| 04 | Tarieven | van onderaan naar boven |
| 05 | Reviews | direct na de prijs |
| 06 | Diensten (één keer) | chips + kaarten + lijst worden één blok |
| 07 | Werkgebied + kaart | blijft zoals het is |
| 08 | Veiligheid, garantie & certificeringen | samengevoegd, verplaatst naar onder |
| 09 | FAQ + één slot-CTA | in plaats van drie identieke banden |

## De vijf hoofdingrepen

**1. Hero met bewijs.** Bellen wordt de dominante knop, WhatsApp secundair, "Onze diensten" een tekstlink. Onder de knoppen komt de sterrenregel. Van de drie badges blijft er één staan; de andere twee worden de sterrenscore en een controleerbaar feit (aantal jaren actief). Nieuwe kop: "Storing in Amsterdam? Binnen 60 minuten voor de deur."

**2. Twee ingangen.** Direct onder de hero: "Ik heb nu een storing" (bellen/WhatsApp) naast "Ik wil een klus plannen" (tijd aanvragen). Twee bezoekers, twee paden.

**3. Herhaling weg.** Drie CTA-banden worden er één (onderaan). De vier dienstenoverzichten worden één blok. De belofte "binnen 60 minuten" staat nog maximaal twee keer op de pagina.

**4. Boekingswidget repareert zichzelf.** Opent standaard op de eerste dag met minstens drie vrije tijden in plaats van vandaag. Volle dagdelen worden samengevouwen ("ochtend volgeboekt") in plaats van zeven grijze blokken. De knop heet "Vraag een tijd aan". Avondtoeslag krijgt het bedrag erbij.

**5. Echte mensen.** De illustratie in de hero wordt vervangen door een foto van een monteur. Ik gebruik de bestaande teamfoto; als je meer foto's hebt (monteur aan het werk, afgeronde meterkast) lever die dan aan — anders blijft het bij de ene foto die er al is.

## Prijssectie

Uurtarief in één blok met een dag/avond-schakelaar, vaste klussen (groepenkast, perilex) ernaast. Daaronder de belofte die nu in de FAQ verstopt zit: "Duurt het langer of is er materiaal nodig? Dan stopt de monteur en hoor je eerst het bedrag."

## Reviews

- 4,9 ★ hergebruikt in hero, bij de prijzen en in de mobiele balk.
- Nieuwste reviews eerst.
- Op de Nederlandse site staan Nederlandse reviews bovenaan, op /en-gb de Engelse.

## FAQ

De zeven stroomstoring-vragen verhuizen naar /stroomstoring-amsterdam (de Liander-uitleg blijft integraal behouden). Op de homepage komen de vragen die iedereen heeft: kosten eerste bezoek, hoe snel, VvE's en bedrijven, garantie, pinnen bij de monteur.

## Kleine fixes

- Alle "u" wordt "je/jij", ook in de bestaande teksten van de homepage.
- Vier dode wijklinks in de footer (Jordaan, Oud-West, Watergraafsmeer, Bos en Lommer) worden weggehaald.
- "VCA** gecertificeerd" wordt "VCA VOL".
- Alt-teksten op de certificaatlogo's.
- Mobiele balk: bellen groot, WhatsApp als icoon, "Boek" eruit.

## Blijft ongemoeid

De tariefuitleg met het kwartier na het eerste uur, de Liander-vraag, de reviewfilters per klus, de werkgebiedkaart en de WhatsApp-link met voorgevuld bericht. Die worden hooguit verplaatst.

## Technisch

Werk zit in `src/routes/index.tsx` (volgorde en hero), `src/components/schedule-picker.tsx` en `global-booking-section.tsx` (widget), `testimonials.tsx` (sortering en taal), `price-indicator.tsx`/`rates-table.tsx` (prijsblok), `mobile-cta-bar.tsx`, `site-footer.tsx`, `certifications.tsx`, plus verplaatsen van de FAQ-data naar de stroomstoringpagina. Bestaande titels, metadescriptions, canonicals, hreflang en structured data blijven ongewijzigd, zodat de rankings van de homepage niet veranderen.
