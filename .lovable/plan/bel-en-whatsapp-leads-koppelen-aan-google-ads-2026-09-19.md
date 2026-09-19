# Bel- en WhatsApp-leads koppelen aan Google Ads

Doel: een klant die via een advertentie belt of appt, en die jij daarna met de hand in de backoffice zet, alsnog als conversie bij de juiste campagne laten landen.

## Hoe het straks werkt

1. **Bij de klik**: klikt iemand op "Bel" of "WhatsApp", dan bewaren we naast de klik zelf ook het advertentie-klik-id dat Google aan het bezoek hing (dat bewaren we al 90 dagen in de browser), plus een korte code van 4 tekens, bijvoorbeeld `K7QP`.
2. **In het WhatsApp-bericht**: die code komt onderaan de voorgevulde tekst mee ("Ref: K7QP"), zodat het gesprek zelf al aanwijst uit welke advertentie het komt. Bij bellen kan dat niet — daar werkt de tijdkoppeling hieronder.
3. **Bij het invoeren van de lead**: op de invoerpagina verschijnt een klein blok "Kwam dit uit een advertentie?" met de advertentieklikken van de afgelopen 3 uur (tijdstip, pagina, apparaat, code). Eén klik koppelt het klik-id aan de lead. Plak of typ je de code uit het WhatsApp-bericht in, dan koppelt hij direct de juiste. Kwam er in de laatste 10 minuten precies één advertentieklik binnen, dan staat die alvast voorgeselecteerd — jij bevestigt.
4. **Bij afronden**: zet je de klus op "Klus gedaan", dan melden we die klus met het bewaarde klik-id terug aan Google, met het bedrag als dat bekend is. Google telt hem dan bij de campagne waar de klik vandaan kwam. Eén melding per dossier; opnieuw afronden stuurt niets dubbel.
5. **Zichtbaar in het dossier**: per lead staat of hij uit een advertentie kwam, of de terugmelding gelukt is, en een knop om het handmatig opnieuw te proberen.

Alleen echte dossiers worden gemeld; testdossiers nooit.

## Wat er technisch gebeurt

**Opslag**
- `conversion_events` krijgt `gclid`, `gbraid`, `wbraid` en `click_ref` (de 4-tekencode).
- `leads` krijgt `ads_upload_status`, `ads_uploaded_at`, `ads_upload_error` en `ads_conversion_value_cents`.

**Meetkant (browser)**
- `src/lib/ad-click.ts`: functie die een stabiele code per bezoek afleidt en teruggeeft.
- `src/lib/analytics.ts` / `contact-click-fallback.ts`: klik-id en code meesturen in het bestaande beacon; het beacon blijft niet-blokkerend.
- `src/routes/api/public/track/conversion.ts`: schema en insert uitbreiden met de vier velden.
- WhatsApp-CTA's: "Ref: <code>" aan de voorgevulde tekst plakken.

**Backoffice**
- Nieuwe serverfunctie (admin-auth) die advertentieklikken van de laatste 3 uur teruggeeft, plus opzoeken op code.
- `unified-lead-form.tsx` / `admin.leads_.plakken.tsx`: het koppelblok, dat `gclid`/`gbraid`/`wbraid` in de lead schrijft.
- `lead-sheet.tsx`: status van de terugmelding tonen, met "Opnieuw proberen".

**Terugmelding naar Google**
- Nieuwe conversieactie in het account: "VoltFix - Klus bevestigd (offline)", type upload-kliks, categorie lead. Die maak ik pas na jouw akkoord op de bevestigingskaart aan; bestaande acties blijven ongemoeid.
- `src/lib/ads-offline.server.ts`: uploadt via de Data Manager-koppeling met het klik-id, het echte tijdstip van de klus en het bedrag; `adUserData` staat op geweigerd omdat we geen klantgegevens meesturen. Faalt de upload, dan blijft het dossier gewoon staan en is de fout zichtbaar.
- Aanroep vanuit het afrondpunt van een klus; testdossiers en dossiers zonder klik-id slaan we over.

**Controles**
- Tests voor de code-afleiding, de tijdkoppeling en het overslaan van tests/dubbele uploads.
- Live test met een eigen klik met `?gclid=...`, koppelen, afronden en de melding in Google terugzien (Google verwerkt met vertraging).

## Wat niet verandert

Prijzen, campagnes, biedingen, de bestaande conversieacties, de bookingflow en de SEO-pagina's blijven ongemoeid.
