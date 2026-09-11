# Stap 4 Locatie verfijnen

## Doel
Stap 4 van de NL/EN-groepenkastaanvraag compacter en duidelijker maken, met één gesynchroniseerde datumkeuze en automatische adresaanvulling. De overige stappen, prijzen, SEO en leadflow blijven ongewijzigd.

## Uitvoering
- Voeg bovenaan een datumveld toe dat `dd-mm-jjjj` toont, exact dezelfde datum markeert in de kalender en direct sluit na selectie.
- Veranker de kalender onder het veld op tablet/desktop. Toon hem op mobiel als compacte onderste laag, zodat eerdere velden niet worden afgedekt.
- Behoud de bestaande dagdeelkeuzes onder de datum en verstuur datum plus dagdeel samen met de aanvraag.
- Laat een geldige combinatie van postcode en huisnummer automatisch straat en plaats invullen.
- Toon Straat en Plaats als afzonderlijke velden met een groen vinkje en groene statusrand wanneer ze door de adrescontrole zijn ingevuld; handmatig corrigeren blijft mogelijk.
- Neem straat veilig op in validatie, aanvraagoverzicht, aanvraagtekst en opgeslagen leadgegevens, zonder prijs- of leadrouteringslogica te wijzigen.
- Maak de stap consequent compact met `gap-3` en verwijder overbodige verticale ruimte.
- Beperk mobiel intern scrollen door stap 4 korter te maken en de kalender buiten het formulieroppervlak te openen; de vaste kop en onderbalk blijven behouden.

## Technische details
- Gebruik de bestaande kalender, popover/dialog-bouwstenen en datumfuncties; geen nieuwe pakketafhankelijkheid.
- Datum wordt intern als eenduidige `YYYY-MM-DD`-waarde gevalideerd en lokaal als `dd-mm-yyyy` getoond.
- De adresstatus wordt alleen als bevestigd getoond als het antwoord nog hoort bij de actuele postcode en het actuele huisnummer.
- Bestaande server-side pakket- en prijscontrole, Turnstile, foto-upload en aanvraagverwerking blijven intact.

## Controle
- Test NL en EN op 1440, 1024, 390 en 360 px.
- Controleer datumselectie, auto-sluiten, juiste datumweergave, adresaanvulling, handmatige correctie en overzicht/verzending.
- Controleer geen horizontale overflow, geen afsnijding door de vaste onderbalk en zo min mogelijk interne scroll in stap 4.
