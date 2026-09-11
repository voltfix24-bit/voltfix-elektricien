# Bookingflow-redesign groepenkast

## Doel
Alleen de bestaande NL/EN-aanvraagflow ombouwen tot een gefocuste modal, zonder wijzigingen aan pagina-inhoud, SEO, prijzen of leadverwerking.

## Uitvoering
- De bestaande flow openen als toegankelijke dialoog: desktop gecentreerd met gedimde/lichte blur-overlay, mobiel schermvullend vanaf de onderzijde.
- Bestaande antwoorden in React-state behouden bij sluiten; focus vastzetten in de dialoog, ESC en sluitknop ondersteunen, en paginascroll blokkeren zolang de flow open is.
- De dialoog opdelen in een vaste kop, scrollbaar stapgedeelte en vaste onderbalk met prijsstatus, terugactie en precies één primaire vervolgactie.
- Compacte NL/EN-staplabels en voortgang toevoegen; bestaande contextuele knopteksten behouden.
- Pakketten, opties, foto-later en schouw als rustige selectiekaarten tonen. De fotostap krijgt een groot camera-first uploadvlak en compacte goede/slechte-fotogids.
- Prijsstatus onderin laten wisselen tussen richtprijs, “Na controle”, “Prijs na foto” en “Schouw €90, verrekend bij akkoord”, met de bestaande centrale prijzen als bron.
- Bedankscherm in dezelfde modal tonen met WhatsApp, bellen en terug naar de pagina.
- Globale mobiele CTA en zwevende WhatsApp-knop tijdens de flow verbergen. De modal boven de cookiebanner plaatsen zodat die de flow nooit bedekt.
- Werkgebiedcontrole niet half toevoegen: alleen uitvoeren als de bestaande postcodegegevens een veilige, eenduidige grens bieden; anders als niet uitgevoerd rapporteren.

## Behoud en veiligheid
- Geen wijziging aan routes, metadata, canonical, structured data, H1, SEO-secties, FAQ’s of interne links.
- Bestaande server-side prijscontrole, foto-upload, Turnstile, spamfilter en leadverwerking blijven intact.
- Geen oude prijzen introduceren.

## Controle
- Gerichte tests en controles op NL en EN.
- Visuele controle en screenshots op 360, 390, 1024 en 1440 px voor de gevraagde stappen, inclusief cookiebanner en bedankscherm via veilige testmock.
- Controleren op sticky-CTA-verberging, overlap, focus/ESC, horizontale scroll, actuele prijzen en behoud van aanvraagdata na sluiten.
