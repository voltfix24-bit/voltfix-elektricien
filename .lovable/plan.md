# Beoordeling van je SEO-briefing + uitvoeringsplan

## Kort: mijn oordeel

De briefing is grotendeels goed en sluit aan op wat de audit liet zien. Sterke punten:
homepage breed maken voor "elektricien Amsterdam", `/elektricien-amsterdam` een echt eigen
zoekintentie geven (gepland werk) in plaats van hem weg te redirecten, en interne links
versterken. Dat is precies de juiste oplossing voor de kannibalisatie.

Drie kanttekeningen:

1. **Homepage-H1 "Elektricien in Amsterdam — bij spoed binnen 60 minuten" is zwakker qua
   conversie dan de huidige H1** ("Stroomstoring in Amsterdam? Binnen 60 min. een monteur").
   Die huidige H1 is juist scherp voor de spoedbezoeker. Voorstel: neem jouw H1 over (SEO-breedte
   wint hier), maar zet de spoedhaak direct eronder in de subkop, zodat de urgentie boven de vouw
   blijft. Als je liever conversie voorrang geeft, kunnen we de oude H1 houden — zeg het.
2. **De www-redirect (punt 5) kan niet vanuit dit project.** De 302 van `voltfix.nl` naar
   `www.voltfix.nl` komt van de Lovable-domeinlaag, niet uit de code. Ik maak geen JS- of
   meta-refresh-workaround; ik rapporteer alleen waar het aangepast moet worden.
3. **Punt 7 (commit-hash, deploytijd) kan ik niet volledig leveren.** Publiceren doe jij via de
   Publish-knop; ik kan daarna wel de live status, canonicals en redirectketens meten en
   rapporteren.

Verder: geen verzonnen cases. Voor `/elektricien-amsterdam` gebruik ik de drie bestaande cases
(De Pijp, grachtenpand Centrum, IJburg) die al op de pagina staan, en herschrijf ze naar de
context "gepland werk".

## Wat ik ga wijzigen

### Homepage (`src/routes/index.tsx`)
- Title → `Elektricien Amsterdam | 24/7 & binnen 60 min | VoltFix`
- Meta description → jouw tekst
- H1 → `Elektricien in Amsterdam — bij spoed binnen 60 minuten`
- Subkop houdt de spoedhaak; geen uitgebreide stroomstoring-tekst (blijft bij
  `/stroomstoring-amsterdam`)
- Nieuwe contextuele sectie "Gepland elektrawerk plannen" met een `<a href>` naar
  `/elektricien-amsterdam` (ankertekst: "elektricien inhuren in Amsterdam")

### `/elektricien-amsterdam` (`src/routes/elektricien-amsterdam.tsx`)
- Title / H1 / description volgens jouw tekst
- Content herschreven naar gepland werk: wanneer gepland i.p.v. spoed, intake en opname,
  offertetraject, doorlooptijd en werkplanning, werken in een bewoonde woning, geplande
  stroomonderbrekingen, VvE-afstemming, renovatie van oudere Amsterdamse woningen, oplevering
  en controle. Garantie alleen zoals al vastgelegd (12 mnd werk, 2 jr materiaal)
- Bestaande cases hergebruikt, geherformuleerd als geplande trajecten
- FAQ's herschreven naar offerte, planning, VvE, renovatie
- Primaire CTA's: "Plan een opname" / "Vraag een offerte aan"; spoed alleen als kleine
  secundaire regel
- Canonical, sitemap-vermelding en indexeerbaarheid blijven ongewijzigd

### Interne links
- Dienstenmenu in `src/components/site-header.tsx`: item "Elektricien inhuren"
- `src/components/site-footer.tsx`: link met dezelfde ankertekst
- Bestaande links vanaf dienstenpagina's blijven; ankerteksten waar natuurlijk gedifferentieerd
- Alle links direct naar de canonieke URL, geen redirect-URL's

### Niet aanraken
Wijkpagina's, Engelse pagina's, trailing-slash-redirects, telefoonnummers, adressen,
prijzen, reviews, certificeringen.

## Controles vóór publicatie
Eén H1 per gewijzigde pagina; beide pagina's 200 met self-canonical; beide in de sitemap;
geen noindex; title/description/H1/content/links aanwezig in de eerste SSR-response
(gemeten met `curl`, zonder JS); geen interne links naar redirect-URL's; build en tests groen.

## Rapport achteraf
Gewijzigde bestanden, oude vs. nieuwe title/H1/description, live HTTP-status en canonical van
beide pagina's, redirectketens van alle domeinvarianten, bevestiging dat
`/elektricien-amsterdam` niet redirect, en wat niet vanuit Lovable kon (de www-301).
