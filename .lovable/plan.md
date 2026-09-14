# Perilexpagina’s afronden met definitieve bedrijfsafspraken

## Doel
De Nederlandse en Engelse Perilexpagina en de gekoppelde uitleg afronden met de bevestigde prijsvoorwaarden, zonder aanvraagverwerking, Telegram, uploads, klantaanvullingslinks, activatievlaggen, historische aanvragen of groepenkastgedrag te wijzigen. Er wordt niets gepubliceerd en er worden geen echte aanvragen of berichten verstuurd.

## Uitvoering

### 1. Eén consistente prijs- en voorwaardentekst
- Behoud de centrale catalogusbedragen: €120 excl. btw standaard, €145 excl. btw totaal voor dezelfde eenvoudige klus met voorrang binnen 24 uur na bevestigde beschikbaarheid, en €90 excl. btw voor een volledig verrekenbare schouw bij uitvoering.
- Voeg gedeelde NL/EN-tekst toe voor het vaste aansluittarief: voorrijkosten inbegrepen; Perilex-stekker en aansluitkabel niet inbegrepen; alleen bij een bestaande geschikte wandcontactdoos en werkende geschikte groep.
- Verwerk dit gericht in hero, situaties, tarieven, FAQ, `/perilex-stekker`, prijskeuze en aanvraagoverzicht, interne beoordelingslabels, metadata, Perilex-aanbiedingen in structured data en `llms.txt`.
- Houd nieuwe kabel, groep, wandcontactdoos, groepenkastaanpassing, verplaatsing en bouwkundig werk op beoordeling/offerte. Voeg geen materiaalprijzen, verplichte materiaalvragen of toeslagen toe.

### 2. Afspraakingang corrigeren
- Laat de CTA op `/perilex-stekker` naar `/perilex-amsterdam` gaan en daar de bestaande centrale Perilexflow met dienstcontext openen, in plaats van de algemene planningflow onderaan de uitlegpagina.
- Verwijder op deze uitlegpagina de onbevestigde 48-uursclaim en toon: “We stemmen het beschikbare moment met je af.”
- Behoud het onderscheid tussen voorkeursmoment en bevestigde afspraak.

### 3. Vertrouwensclaims controleren
- Inventariseer bedrijfsclaims en lokaal bewijs voor ISO 9001, VCA**, VCA VOL, InstallQ/Sterkin en Erkend Leerbedrijf.
- Scheid aantoonbare persoonlijke kwalificaties van bedrijfsbrede certificeringen.
- Pas binnen Perilex alleen aantoonbaar onjuiste of onbewezen presentatie aan; algemene websitebrede claims worden niet stilzwijgend goedgekeurd of uitgebreid.
- Neem alle onvoldoende onderbouwde claims als expliciete beslispunten in het rapport op.

### 4. Betrouwbare FAQ- en afbeeldingscontrole
- Vervang de foutieve FAQ-metingsselector door een controle die vraagknoppen apart telt, gesloten antwoordpanelen op verborgen/hoogte nul controleert, openen en sluiten test, en tekst plus volgorde exact met FAQ structured data vergelijkt.
- Corrigeer de React-head-attributen naar `imageSrcSet`, `imageSizes` en `fetchPriority` als bron van de gemelde waarschuwingen.
- Herhaal netwerkcontrole voor de HTTP-400-meldingen en leg per verzoek bron, status en waargenomen impact vast.

### 5. Regressie- en schermcontrole
- Controleer NL en EN op 360, 390, 768, 1024 en 1440 pixels, plus 200% tekstvergroting, met behoud van gebruikerszoom.
- Controleer hero, tarieven, FAQ, cookievenster, sticky actie en het echte aanvraagoverzicht op afkapping, overlap en horizontale overflow.
- Open en doorloop de centrale Perilexflow met gesimuleerde lokale invoer, maar verstuur niets.
- Draai gerichte Perilextests, bestaande relevante regressietests en typecontrole; rapporteer geslaagd, mislukt en overgeslagen afzonderlijk.

## Oplevering
- Eén ZIP-bestand met een beknopt rapport, open beslispunten, meetresultaten, relevante testuitvoer en screenshots van hero, tarieven en aanvraagoverzicht.
- Voeg routebewijs voor de afspraakingang en consistente FAQ-resultaten voor NL, EN en de uitlegpagina toe.
- Maak expliciet onderscheid tussen wat op de gecontroleerde build is bewezen en wat niet op productie is getest.
- Claim geen verbeterde conversie, indexering of volledige backendvrijgave.
