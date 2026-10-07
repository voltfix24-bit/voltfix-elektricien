# Post-Batch-1 live verification (read-only, nothing changed)

Verified live: **2026-10-07 09:44:04 UTC (11:44:04 Amsterdam)**. Account EUR. Campaigns: NL "(G) Search - Nederlands Elektrische Diensten" (24083979744), EN "(G) Search - English - Electrician" (24089099891).

## 1. Conversion actions
Goals biddable in BOTH Search campaigns: PHONE_CALL_LEAD/WEBSITE, PHONE_CALL_LEAD/CALL_FROM_ADS, SUBMIT_LEAD_FORM/WEBSITE, BOOK_APPOINTMENT/WEBSITE. NL only: UNKNOWN/GOOGLE_HOSTED (no action in that category). Not biddable: DEFAULT, PAGE_VIEW, CONTACT (all origins), GET_DIRECTIONS, ENGAGEMENT, REQUEST_QUOTE, QUALIFIED_LEAD, CONVERTED_LEAD.

| Action | ID | Primary | Category / origin | Counts in Search campaigns |
|---|---|---|---|---|
| klik_tel | 6714905668 | Secondary | PHONE_CALL_LEAD / WEBSITE | No |
| whatsapp_klik | 6714991157 | Secondary | CONTACT / WEBSITE | No |
| ContactformulierNL | 6717340947 | Secondary | SUBMIT_LEAD_FORM / WEBSITE | No |
| ContactformulierENG | 6717339768 | Secondary | SUBMIT_LEAD_FORM / WEBSITE | No |
| request_quote | 7700084612 | **Primary** | BOOK_APPOINTMENT / WEBSITE | **Yes** |
| Aanvraag ontvangen (offline) | 7792482692 | Primary | SUBMIT_LEAD_FORM / WEBSITE | Yes |
| Aanvraag gekwalificeerd (offline) | 7792482695 | Secondary | QUALIFIED_LEAD | No |
| Monteur aangenomen (offline) | 7792482698 | Secondary | CONVERTED_LEAD | No |
| Klus bevestigd (offline) | 7779910497 | Secondary | SUBMIT_LEAD_FORM | No |
| Gesprek vanuit advertentie 30 sec | 7715063438 | Primary | PHONE_CALL_LEAD / CALL_FROM_ADS | Yes |
| Afspraak (Default AdWords Express) UA | 242444395 | Primary | DEFAULT / WEBSITE | No (DEFAULT not biddable) |
| Calls from Smart Campaign Ads | 6689463300 | **Primary** | PHONE_CALL_LEAD / CALL_FROM_ADS | **Yes** |
| Groepenkast - Aanvraag voltooid | 7768207571 | **Primary** | SUBMIT_LEAD_FORM / WEBSITE | **Yes** |
| Klikken om te bellen (smart campaign ad) | 985591419 | Primary | CONTACT / CALL_FROM_ADS | No |
| Google-hosted local actions (985445515, 985445956, 985591362, 985591392, 6691502125, 6694098173, 7705587545) | — | Primary | CONTACT / GET_DIRECTIONS / PAGE_VIEW / ENGAGEMENT, GOOGLE_HOSTED | No |
| Other web actions (klik_mail, Website lead voltooid, WhatsApp/Telefoonklik direct, Groepenkast micro-steps, Schouw aangevraagd) | — | Secondary | various | No |

## 2. Negatives
- NL campaign: 47 negatives (pre-existing broad/phrase set) incl. PHRASE stedin, liander, storingsnummer, louwmans (plus older BROAD liander, alliander, storingskaart, PHRASE outage map).
- EN campaign: 43 negatives incl. **PHRASE technician — live**. Change history: created 2026-10-07 09:04:23 UTC via API (same batch as NL liander/storingsnummer phrase).
- Ad-group level: only "adres" PHRASE on NL-B Spoed Elektricien.

## 3. New ad groups (all ENABLED, group CPC €3,00)
NL-A Elektricien Amsterdam 203948434794; NL-B Spoed Elektricien 203948434954; NL-C Stroomstoring & Kortsluiting 203948434994; EN-A General Electrician 207636493384; EN-B Emergency Electrician 207636493424.

## 4. Keywords (CPC €3,00 unless noted)
- NL-A: elektricien amsterdam EXACT enabled; elektricien in de buurt PHRASE paused; elektricien direct PHRASE; elektricien vandaag PHRASE.
- NL-B (15): elektricien spoed EXACT+PHRASE; 24 uur elektricien EXACT+PHRASE; spoed elektricien EXACT+PHRASE; spoed elektricien amsterdam EXACT+PHRASE; elektricien amsterdam spoed, elektricien spoed amsterdam, elektricien op zondag, elektricien nooddienst, elektricien nodig spoed PHRASE; voltfix EXACT+PHRASE (no keyword CPC, uses group €3,00). All enabled.
- NL-C: storingsdienst elektra, stroomstoring elektricien, kortsluiting elektricien PHRASE, enabled.
- EN-A: electrician amsterdam EXACT €3,00; electrician amsterdam PHRASE €3,10; call electrician near me PHRASE €3,10; amsterdam electrician, electrician in amsterdam PHRASE; electrician near me EXACT+PHRASE paused.
- EN-B (15): emergency electrician, 24 hour electrician, urgent electrician, emergency electrician amsterdam EXACT+PHRASE; emergency electrical service, on call electrician, emergency electrician near me amsterdam, 24 7 electrician amsterdam PHRASE; electrician now PHRASE paused; voltfix EXACT+PHRASE (group bid).
- No keywords outside this set.

## 5. New RSAs (all ENABLED, policy APPROVED/REVIEWED, ad strength PENDING, all contain Techniek Nederland + 77 reviews)
NL-A 827159872548 → /elektricien-amsterdam; NL-B 827159872551 → /spoed-elektricien-amsterdam; NL-C 827159872554 → /stroomstoring-amsterdam; EN-A 827285829521 → /en-gb/elektricien-amsterdam; EN-B 827285829524 → /en-gb/spoed-elektricien-amsterdam.

## 6. Old Ad group 1
NL 198353540786 PAUSED; EN 201919269554 PAUSED. Their old RSAs remain ENABLED inside the paused groups (do not serve; still contain "67 Reviews" and "NEN 1010 Gecertificeerd/Certified").

## 7. Budgets and bidding
NL €10/day, EN €10/day, both MANUAL_CPC. Paused campaigns untouched: generiek €20 paused; Groepenkast NL/EN €10 paused, MANUAL_CPC.

## 8. Divergences from approved Batch 1
- **technician PHRASE negative is live in EN campaign** (added 09:04:23 UTC) — the plan said not to add it.
- **Duplicate lead counting possible**: request_quote (BOOK_APPOINTMENT) is Primary and biddable in both campaigns alongside Aanvraag ontvangen. Also biddable and Primary: Calls from Smart Campaign Ads (alongside the 30-sec call action) and Groepenkast - Aanvraag voltooid (SUBMIT_LEAD_FORM).
- Correction to earlier report: old AdWords Express action is DEFAULT category, which is not biddable in either campaign, so it does not count.
- No Batch 2 keywords; no budget or bid changes found.

## 9. Timestamp
2026-10-07 09:44:04 UTC.
