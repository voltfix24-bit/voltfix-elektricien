# Opdracht Q — bewijslast, eerlijke bonus en betere intake

## Doel
Drie gerichte uitbreidingen zonder de bestaande bonusberekening, claimflow, prijzen of dienstactivatie te wijzigen:

1. Eerlijke informatie over uitgevoerde klussen en ontvangen reviews.
2. Een verplichte, privé afgeronde bewijsflow vóór een klus als uitgevoerd telt.
3. Een optionele meterkastfoto in het algemene aanvraagformulier voor groepenkast, verzwaring en laadpunt.

## Uitvoering

### 1. Klussen en reviews neutraal naast elkaar
- Bereken per ZZP’er:
  - **Klussen gedaan**: alle klussen die eindigen als Afgerond met review of Afgerond zonder review.
  - **Reviews binnen**: alleen afgeronde klussen met een ontvangen review.
- Toon in het uitgeklapte backoffice-detail van de ZZP’er: `9 van 12 · 75%`.
- Gebruik gewone tekst zonder rode status, norm, doel, waarschuwing, ranking of invloed op saldo/bonus.
- Houd de bestaande reviewbonusberekening en 5-sterrenvoorwaarde volledig ongewijzigd.
- Toon bij automatisch gesloten klussen in de Review-cel **Niet gegeven door klant**; behoud de bestaande tijdlijnregel **Automatisch afgesloten · geen review na 7 dagen**.

### 2. Privé afrondingsflow via Telegram
- Vervang de directe werking van **Klus gedaan** door een privégesprek met de toegewezen monteur:
  1. Vraag een foto vóór het werk. Alleen overslaan via **Niet van toepassing**, gevolgd door een verplichte reden van één regel.
  2. Vraag een verplichte resultaatfoto; overslaan is onmogelijk.
  3. Stuur een eenmalige beveiligde link naar een mobiele ondertekenpagina met klantnaam, adres, tekenvlak en één knop **Ondertekenen**.
- Verwerk inkomende Telegram-foto’s alleen in privéchat, controleer bij iedere stap dat de afzender de toegewezen actieve monteur is en sla bestanden direct op bij de lead.
- Download Telegram-bestanden server-side en valideer bestandstype, inhoud en maximale grootte voordat ze in een nieuwe private bewijsopslag komen.
- Bewaar één voortgangsrecord per lead met unieke stappen, tijdstippen, optionele reden, fotoverwijzingen en handtekening. Databasebeperkingen en atomaire verwerking maken herhaalde Telegram-updates idempotent.
- Maak de ondertekenlink een willekeurig, eenmalig token waarvan alleen de hash wordt bewaard; controleer vervaldatum, lead/monteurkoppeling en hergebruik server-side.
- Pas pas na zowel resultaatfoto als handtekening de bestaande `outcome=done`-overgang toe, zet dan het reviewverzoek klaar en stuur de bestaande beheerder-handoff. Zonder één van beide gebeurt geen van deze acties.
- Laat de klant geen Telegrambericht ontvangen en plaats bewijs nooit in de monteursgroep.

### 3. Onvolledige afronding in Nu doen
- Leid de status af uit de bewijsvoortgang; voeg geen concurrerende leadstatus toe.
- Zodra de afrondingsflow is gestart maar nog niet compleet is, toon de lead in **Nu doen** als `Afronding niet compleet · X min`.
- Gebruik een oranje rand en een knop **Monteur bellen**, gekoppeld aan het telefoonnummer van de toegewezen monteur.
- Laat deze melding verdwijnen zodra de verplichte resultaatfoto en handtekening zijn vastgelegd.

### 4. Bewijs in het klusdetail
- Vervang de generieke fotoweergave voor deze bestanden door een strook **Bewijs**:
  - optionele tegel **Meterkast · door klant** als die foto bestaat;
  - foto vóór, of de vastgelegde niet-van-toepassingreden;
  - verplichte resultaatfoto;
  - handtekening met datum en tijd.
- Toon alleen aanwezige onderdelen; geen lege tegels of teksten over ontbrekende klantfoto’s.
- Maak foto’s en handtekening klikbaar naar een beveiligde grote weergave voor beheerders, zonder openbare opslaglinks.
- Bewaar bewijs minimaal één maand; configureer geen opruiming vóór die grens en leg de bewaartermijn expliciet vast.

### 5. Optionele meterkastfoto in het algemene aanvraagformulier
- Toon één optioneel fotoveld alleen wanneer de gekozen klussoort overeenkomt met groepenkast, verzwaring of laadpunt/laadpaal.
- Gebruik exact:
  - **Foto van je meterkast**
  - **Handig voor ons — dan weten we vooraf of er ruimte is en welke onderdelen we meenemen.**
- Laat verwijderen/vervangen toe en valideer afbeeldingen veilig, maar laat een ontbrekende of mislukte optionele upload het formulier nooit blokkeren.
- Koppel de foto als categorie `meter_cabinet_customer` aan de aanvraag en aan de aangemaakte lead.
- Stuur de foto via de bestaande veilige Telegram-bijlageketen mee met het groepsbericht; voeg geen badge toe aan de lijstregel.
- Laat laadpaal en verzwaring uitgeschakeld als online boekingsdienst; alleen hun bestaande keuze in het algemene formulier krijgt dit optionele veld.

## Technische wijzigingen
- Nieuwe private bewijsopslag en databasetabel voor bewijsstappen, met beheerdersbeleid, unieke stapbeperkingen, auditgegevens en bewaartermijn.
- Uitbreiding van de Telegram-webhook voor privéfoto’s, redeninvoer en veilige stapovergangen; bestaande webhookcontrole blijft leidend.
- Nieuwe publieke mobiele ondertekenpagina en beveiligde serverroutes voor tokencontrole en eenmalige ondertekening.
- Uitbreiding van de bestaande aanvraagbijlagen met een expliciete meterkastcategorie en doorvoer naar lead en Telegram.
- Uitbreiding van backoffice-queries en schermen voor neutrale reviewratio, bewijsstrook en onvolledige afronding.
- Geen wijziging aan bonus-RPC, centrale prijzen, claimkosten, klantmail, dienstactivatie of bestaande Perilex-/groepenkastboekingsregels.

## Verificatie
- Automatische tests voor:
  - `9 van 12 · 75%`, nul-deler en automatisch gesloten zonder review;
  - geen `done`/reviewverzoek zonder resultaatfoto én handtekening;
  - toegestane overslag van alleen de vóórfoto met verplichte reden;
  - dubbele Telegram-updates zonder dubbele bestanden, statusovergangen of reviewverzoeken;
  - onvolledige flow zichtbaar in Nu doen met monteurtelefoon;
  - algemene aanvraag slaagt zonder foto en met foto;
  - meterkastfoto verschijnt in bewijs en Telegram, maar niet als lijstbadge;
  - beheerderstoegang tot bestanden na minimaal 31 dagen.
- Browsercontrole op mobiel voor Telegram-link/ondertekenen en op mobiel/desktop voor ZZP-detail, Nu doen, klusdetail en algemeen aanvraagformulier.
- Geen echte aanvraag, review, e-mail of Telegrambericht versturen tijdens tests.
