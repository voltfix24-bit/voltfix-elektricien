# Mobiele VoltFix-leadinvoer

## Groepenkast-bookingflow redesign
- [x] Desktopmodal en mobiele fullscreenflow met vaste boven- en onderbalk, focusbeheer, ESC, scrollvergrendeling en bewaarde invoer.
- [x] Zes contextuele NL/EN-stappen, actuele prijsstatus, rustige keuzekaarten, cameragerichte fotostap en bedankscherm.
- [x] Visuele QA op 360, 390, 1024 en 1440px; sticky CTA’s en WhatsApp verborgen, cookiebanner achter de modal, geen overlap of horizontale overflow.
- [x] Centrale prijzen en aanvraagverwerking behouden; 12 prijs- en privacytests plus typecontrole geslaagd. Turnstile bleef actief; succesvolle lokale schermentest gebruikte een gesimuleerd antwoord en verstuurde geen echte aanvraag.
- [ ] Mobiele footerstatus en route-afhankelijke succesteksten gecontroleerd op de gevraagde NL/EN-schermen.

## Groepenkastpakketten NL en EN
- [x] Centrale vanafprijs €695, pakketten €695/€845/€1.095 en opties consequent doorgevoerd; oude groepenkastprijzen verwijderd uit pagina’s, FAQ’s en llms.txt.
- [x] Beide landingspagina’s gelijkgemaakt: wit/antraciet/paars, prijscontrole, trust en uitsluitend groepenkastvervanging; gedeelde componenten en vertaalde metadata/schema’s.
- [x] Zesstappen BookingFlow met pakketkeuze, live opties/totaal, foto’s, adres/voorkeur, verplichte contactgegevens en overzicht aangesloten op bestaande beveiligde aanvraagverwerking; server berekent bedragen opnieuw uit pakket-ID’s.
- [x] 23 regressietests en 26 SEO-controles geslaagd. NL/EN-browserflow inclusief foto, live totaal, verplichte velden en gesimuleerde verzending gecontroleerd; geen runtimefouten of horizontale overflow op 320/390/1280px. Server weigert ontbrekende e-mail, ongeldig pakket en ontbrekend Turnstile-token. Geen echte aanvraag/e-mail/Telegrambericht verzonden tijdens deze tests; publicatie en live aflevercontrole blijven nodig.

## Engelse homepage
- [x] Engelse homepage gelijkgemaakt aan de Nederlandse indeling, opmaak, tarieven, reviews, diensten en FAQ; Engelse links en SEO behouden. Certificeringsblok en aanvullende tarief-/garantiegegevens in het Engels.
- [x] Browsercontrole: dag-/avondtarief wisselt correct, WhatsApp-bericht Engels, afspraakknop opent bestaande boekingssectie; geen horizontale overflow op 997, 390 en 320px en geen runtimefouten. Publicatie nog nodig.

- [x] Adres- en contactgegevens in Telegram-groepsteksten afschermen, klusdetails en privégegevens behouden; 14 tests geslaagd inclusief het getoonde adreslek, prijsafspraken en statusupdates. Ook aanvullende fotoberichtteksten gefilterd. Bestaande Telegram-berichten en tekst ín foto’s zijn niet gewijzigd; publicatie nodig voor de live versie.

- [x] Statusfilters Open / Doorgezet / Opgepakt / Afgesloten en filterbaar overzicht per monteur.
- [x] Statusindeling en gecombineerd filteren controleren: zeven tests geslaagd; ingelogde browsercontrole van statusfilters, monteuroverzicht en gecombineerde zoekopdracht zonder runtimefouten.

- [x] Telefoonvriendelijke leadinvoer en overzicht, met duidelijke spoedkeuze.
- [x] Foto’s vanuit camera/bibliotheek en toevoegen aan bestaande leads.
- [x] Startscherm-app voor /admin/leads, met behoud van beveiligde toegang.
- [x] Automatische beheerdersmelding voor ongeclaimde leads na 24 uur, storingen na 1 uur.
- [x] Gerichte tests en controle van mobiel gebruik en beveiliging.

Gecontroleerd: vijf termijnentests; ingelogde browser op 390px en 320px zonder horizontale overflow of runtimefouten; fotoselectie, conceptbehoud bij tabwissel en extra-fotodialoog; onbevoegde reminder-aanroep geeft 401.

Publicatie is nog nodig voor het nieuwe reminder-endpoint op www.voltfix.nl; echte e-mailaflevering en installatie op een fysieke telefoon zijn niet getest. De controle draait elke vijf minuten uitsluitend zolang er meldingen te verwerken zijn, en stopt na afhandeling.