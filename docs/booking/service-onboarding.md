# Checklist: een nieuwe dienst activeren

Een dienst gaat pas op `enabled: true` als élk punt hieronder afgevinkt is. Een regel toevoegen aan de registry is geen bewijs dat een dienst operationeel klaar is.

## 1. Bedrijfsinformatie (komt van VoltFix, niet van de ontwikkelaar)
- [ ] Vaste prijzen of expliciet prijsbeleid ("prijs na controle") staan in `src/lib/pricing.ts`.
- [ ] Werkgebied: welke postcodes binnen gebied, buiten gebied of te beoordelen.
- [ ] Doorlooptijd/planning: hoeveel tijd kost de klus en wie voert hem uit.
- [ ] Interne eigenaar: wie volgt deze aanvragen op.

## 2. Configuratie
- [ ] `ServiceConfig` in `src/lib/booking/services/` met NL- en EN-teksten voor stappen, CTA's, status en bedankscherm.
- [ ] Toegestane intenties en startstap per CTA vastgelegd.
- [ ] Fotoinstructies: veilig (geen afdekplaten losschroeven, geen zegels verbreken).
- [ ] Prijslogica retourneert `null` zodra beoordeling nodig is; nooit 0 als "onbekend".

## 3. Server
- [ ] Validatieschema voor de dienstspecifieke antwoorden.
- [ ] Server-side prijsherberekening voor deze dienst (analoog aan `recalculateGroepenkastPrice`).
- [ ] `enabled: true` in de registry; de activatiecontrole in `/api/public/quote-request` weigert daarvóór elke aanvraag met 403.

## 4. Tests en QA
- [ ] Unit tests voor prijscombinaties en routekeuzes.
- [ ] NL/EN doorloop op 360, 390, 768, 1024 en 1440 zonder horizontale scroll of overlap met de sticky CTA.
- [ ] Verzendtest met idempotentie (dubbelklik levert één aanvraag).
- [ ] Aanvraag zichtbaar in de backoffice met de juiste dienst, route en prijsstatus.

## 5. Pagina en SEO
- [ ] Dienstenpagina blijft zelfstandig leesbaar; de flow vult aan, vervangt niet.
- [ ] Metadata, canonical en hreflang gecontroleerd.
- [ ] Gestructureerde data volgt uitsluitend zichtbare, kloppende inhoud.

## Status per dienst (11 september 2026)

| Dienst | Status | Ontbreekt |
| --- | --- | --- |
| Groepenkast | actief | — |
| Laadpaal | uit | prijsbeleid, werkgebied, intakevragen |
| Perilex | uit | prijsbeleid per situatie, intakevragen |
| Spoed | uit | bevestigd beschikbaarheidsbeleid; tarief is €120 eerste uur all-in |
| Stopcontact | uit | prijsbeleid, intakevragen |
| Algemene klus | uit | offerte-intake, interne eigenaar |
