# Inventarisatie: waar staat "Mauritius 17, 1505 VK Zaandam"?

Read-only onderzoek. Er is niets gewijzigd.

## Kort antwoord

Het Zaandam-adres staat op **één plek hardcoded** (`src/lib/business.ts`, veld `registeredAddress`) en wordt vandaaruit op 5 plekken in de site gebruikt. Daarnaast staat het **één keer los** in `public/llms.txt`. In de database, e-mailtemplates, sitemap of afbeeldingen komt het niet voor.

## 1. Bron van waarheid (enige hardcoded plek in src/)

| Bestand | Regels | Inhoud |
|---|---|---|
| `src/lib/business.ts` | 19-25 | `registeredAddress: { streetAddress: "Mauritius 17", postalCode: "1505 VK", city: "Zaandam", region: "Noord-Holland", country: "NL" }` |

## 2. Plekken die dat veld gebruiken (dus zichtbaar op de site)

| Bestand | Regels | Waar zichtbaar | Taal |
|---|---|---|---|
| `src/components/site-footer.tsx` | 141-142 | Footer, "Registered address: ..." | EN |
| `src/components/site-footer.tsx` | 154-155 | Footer, "Geregistreerd adres: ..." | NL |
| `src/routes/privacybeleid.tsx` | 111-112 | Privacybeleid, "Geregistreerd bedrijfsadres" | NL |
| `src/routes/en-gb.privacy-policy.tsx` | 109-110 | Privacy policy, "Registered business address" | EN |
| `src/lib/seo.ts` | 478-482 | JSON-LD `Organization.address` (PostalAddress) op **elke** pagina | beide |

Omdat de footer op alle routes staat, verschijnt het adres feitelijk op **alle NL- en EN-pagina's** — bevestigd op de live site voor `/`, `/en-gb`, `/contact`, `/over-ons`, `/privacybeleid`, `/en-gb/privacy-policy`.

Belangrijk: de `LocalBusiness` / `Electrician`-node gebruikt bewust **niet** dit adres, maar de bezoeklocatie Jacob van Lennepkade 142, 1053 MV Amsterdam (`src/lib/seo.ts:451` bevat die toelichting). Alleen de `Organization`-node draagt Zaandam.

## 3. Losse (niet-gegenereerde) vermelding

| Bestand | Regel | Inhoud |
|---|---|---|
| `public/llms.txt` | 12 | `- Geregistreerd bedrijfsadres: Mauritius 17, 1505 VK Zaandam, Nederland` |

Dit bestand wordt handmatig onderhouden en loopt dus niet automatisch mee met `business.ts`.

## 4. Waar het NIET staat (gecontroleerd)

- Database (Lovable Cloud): geen tabel/kolom/rij met dit adres; e-mailtemplates in `src/lib/email-templates/*` bevatten het niet.
- API-routes (`src/routes/api/**`, `src/routes/lovable/**`) en `supabase/`: geen treffers.
- `public/robots.txt`, `sitemap.xml`, `BingSiteAuth.xml`, logo's/afbeeldingen: geen treffers.
- Contactpagina's (NL en EN): tonen de Google Maps-embed en het **Amsterdamse** bezoekadres, niet Zaandam (behalve via de footer).

## 5. Losse "Zaandam"-vermeldingen zonder adres (werkgebied, geen NAP)

Deze noemen alleen de plaatsnaam als servicegebied:

- `src/lib/business.ts:353` — `serviceAreas` bevat "Zaandam"
- `src/routes/index.tsx:529`, `src/routes/en-gb.index.tsx:374`
- `src/routes/elektricien-amsterdam.tsx:261`
- `src/routes/veelgestelde-vragen.tsx:56`, `src/routes/en-gb.faq.tsx:57`
- `src/lib/keyword-research.ts:51` (keyword-lijst)
- `public/llms.txt:15` (werkgebied)

## Als je later wilt wijzigen

Eén wijziging in `src/lib/business.ts` (regels 19-25) dekt de footer, beide privacypagina's en de `Organization` JSON-LD op de hele site. `public/llms.txt` regel 12 moet dan handmatig mee.
