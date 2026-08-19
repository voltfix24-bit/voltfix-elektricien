Plan: verwijderen AI-afbeeldingen en vervangen door echte foto's

## Probleem
De volgende AI-gegenereerde afbeeldingen zijn door de agent toegevoegd en staan nu live op de site:

- `src/assets/voltfix-keuring-scene.webp` — hero op `/keuring-amsterdam` en `/en-gb/electrical-inspection-amsterdam` (gebruiker meldt: 3 handen)
- `src/assets/voltfix-laadpaal-scene.webp` — hero op `/laadpaal-amsterdam` en `/en-gb/ev-charger-installation-amsterdam`
- `src/assets/groepenkast.webp` — hero op `/groepenkast-samenstellen` en `/en-gb/how-to-assemble-a-fuse-box`
- `public/og-voltfix.jpg` — social-share preview
- `public/favicon.svg`, `public/favicon.png`, `public/apple-touch-icon.png` — favicon-set

De gebruiker wil geen AI-afbeeldingen op de website.

## Oplossing

1. **Verwijder de AI-sceneafbeeldingen uit `src/assets/` en de bijbehorende `.webp`-bestanden.**
2. **Vervang de verwijderde hero's met de gebruiker-geüploade foto's:**
   - `image-105.png` → NEN-keuring / groepenkast scene (voor keuring-amsterdam, groepenkast-samenstellen en EN-varianten)
   - `image-104.png` → laadpaal installatie scene (voor laadpaal-amsterdam en EN-variant)
3. **Upload de vervangende foto's via Lovable Assets** zodat ze via de CDN worden geserveerd en de binaire bestanden niet in de repo blijven.
4. **Update alle imports in de routes** (NL + EN) zodat de nieuwe CDN-asset pointers worden gebruikt.
5. **Vervang `og-voltfix.jpg` en het favicon-set** door een tekstuele/logo-versie zonder AI-personen, of vraag de gebruiker om een echt bedrijfslogo / teamfoto. Voorstel: favicon behouden als SVG-logo, og-image maken van een clean grafisch ontwerp zonder mensen.
6. **Audit** de hele codebase op achtergebleven AI-afbeeldingen en verwijder ze.
7. **Build draaien** en preview controleren op `/keuring-amsterdam` en `/laadpaal-amsterdam`.

## Scope
Geen wijzigingen aan URL's, routes, SEO-meta of tekstuele content. Alleen afbeeldingen vervangen.

## Vragen aan de gebruiker
- Mogen de twee geüploade foto's (`image-104.png` en `image-105.png`) worden gebruikt als definitieve vervanging? (Zijn dit jouw eigen / gelicenseerde foto's?)
- Wil je dat we de favicon en og-image ook vervangen door jouw logo, of mag dat een clean grafisch ontwerp blijven?
