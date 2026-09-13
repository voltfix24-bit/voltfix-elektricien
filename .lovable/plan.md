# Perilex SEO-, content- en conversieverbetering

## Doel
De Nederlandse en Engelse Perilex-servicepagina verbeteren, plus de rechtstreeks gekoppelde uitlegpagina corrigeren, zonder de bookingmotor, prijsberekening, aanvragen, uploads, meldingen of activatie te wijzigen.

## Uitvoering

### 1. Aanbod en inhoud uit één bron
- Houd €120, €145 en €90 exclusief btw gekoppeld aan de bestaande centrale Perilexcatalogus.
- Corrigeer zichtbare teksten, paginametadata, Perilex-JSON-LD, het algemene bedrijfsaanbod, `llms.txt` en `/perilex-stekker`.
- Verwijder het automatische €275-aanbod en alle onbevestigde claims over inbegrepen werk, garantie en reactietijd uit deze Perilexcontext.
- Behoud groepenkastbedragen en hun inclusief-btw-betekenis exact.

### 2. Technische fouten
- Herstel de echte bron van mobiele horizontale overflow in het werkgebiedblok met krimpbare grid- en linkinhoud.
- Verwijder `forceMount` uit het gedeelde accordiongedrag, zodat gesloten antwoorden werkelijk verborgen zijn en Radix de toetsenbord- en ARIA-status beheert.
- Houd FAQ-tekst in servergeleverde HTML en laat zichtbaar FAQ en FAQ-schema uit dezelfde Perilexbron komen.
- Verwijder Perilex-onjuiste 60-minuten-/`processingTime`-signalen uit de algemene dienstcatalogus, terwijl de aparte spoeddienst haar eigen belofte behoudt.

### 3. Nederlandse en Engelse klantreis
- Maak de eerste schermen compacter met één H1, duidelijke prijsvoorwaarde, één amber hoofdaanvraag en een rustige twijfelactie.
- Plaats de vier situaties vroeg en behoud hun bestaande contextoverdracht naar de centrale flow.
- Voeg bij de eerste aanvraagactie een compacte link naar de centrale Google-reviewbron toe met het centrale reviewaantal, zonder reviews als Perilex-specifiek te presenteren.
- Vertaal het werkgebiedblok en gebruik bestaande Engelse bestemmingen waar beschikbaar; markeer Nederlandse achtergrondlinks expliciet.
- Verbeter onnatuurlijk Engels en leg de verrekening van de schouw ondubbelzinnig uit.
- Houd het beeld eerlijk als illustratie en voeg geen fictief bewijs toe.

### 4. Veilige gekoppelde uitleg
- Herschrijf `/perilex-stekker` zodat klanten niet zelf onder spanning meten, afdekkingen verwijderen of aansluitingen bepalen.
- Laat het fabrikantschema en controle door een elektricien leidend zijn.
- Vervang verouderde prijzen en vaste-inbegrepen-claims door het centrale Perilexaanbod en offertevoorwaarden.
- Verwijder onjuiste HowTo-stappen en schema die zelfstandig elektrisch werk suggereren.

### 5. SEO en meetcontrole
- Behoud canonicals, hreflang, redirects en bestaande openbare URL’s.
- Controleer metadata, alle samengevoegde structured-data-blokken, sitemap/lastmod, robots, IndexNow en bereikbaarheid van afbeeldingen.
- Leg crawlerbeleid feitelijk vast: robotsregels kunnen worden bewezen; daadwerkelijke toegang door externe crawlers niet met alleen een nagebootste user-agent.
- Controleer CTA-, booking-start-, succesvolle aanvraag- en opvolgevents zonder gegevens of echte aanvragen te versturen. Een klik blijft een interactie, geen ontvangen aanvraag.

### 6. Verificatie en regressiebescherming
- Test NL en EN op 360×780, 390×844, 768×1024, 1024×768 en 1440×900.
- Controleer eerste bezoek/cookiebanner, hero, situaties, tarieven, FAQ open/dicht, werkgebied, footer, sticky actie en echte bookingmodal.
- Controleer 200% tekstvergroting, zoombaarheid, horizontale overflow en overlayconflicten.
- Verifieer expliciet alle Perilexprijzen en schema’s, Engelse links, servergeleverde FAQ-inhoud en ongewijzigde groepenkastprijzen.
- Draai gerichte tests, volledige offline tests, typecontrole en bestaande SEO/kwaliteitschecks; verstuur niets en publiceer niets.

## Oplevering
- Eén downloadbaar ZIP-pakket met gewijzigde bestanden, screenshotmanifest, screenshots, testuitvoer met exitcodes en een rapport per onderdeel: opgelost, behouden, niet getest of informatie nodig.
- Het rapport noemt ook ontbrekende bedrijfsinformatie die alleen VoltFix kan leveren: eigen werkfoto’s, exacte inbegrepen onderdelen, garantie-/certificeringsbewijs en haalbare reactietijd.
- Geen publicatie, IndexNow-melding, echte aanvraag, e-mail of Telegrambericht.

## Technische afbakening
- Wijzig alleen presentatie-, content-, SEO- en meetcontrolecode die voor deze drie pagina’s of hun aantoonbare gedeelde fout nodig is.
- Laat bookingflowlogica, servervalidatie, prijsroutes, uploads, aanvraagverwerking, idempotentie, Telegram, e-mail en featureflags ongewijzigd.
- Bij gedeelde componenten wordt groepenkast als regressiepad getest.
