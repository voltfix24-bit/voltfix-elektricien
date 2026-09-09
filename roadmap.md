# Mobiele VoltFix-leadinvoer

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