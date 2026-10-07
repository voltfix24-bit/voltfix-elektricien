# Voorrang voor je beste monteurs

Iedereen blijft in dezelfde Telegram-groep en ziet elke nieuwe klus meteen. Monteurs met voorrang kunnen de klus direct aannemen. De andere monteurs kunnen dat pas na een korte wachttijd, als niemand met voorrang hem al heeft gepakt.

## Hoe het werkt

- **Wie krijgt voorrang:** jij zet per monteur in de backoffice (Monteurs) een schakelaar "Voorrang" aan of uit. Naast elke monteur zie je het aantal reviews en het aantal 5-sterrenreviews, zodat je makkelijk kunt kiezen. Er wordt niets automatisch aangezet.
- **Wachttijd voor de rest:**
  - Storing/spoed: **2 minuten**, zodat de klant zo min mogelijk wacht.
  - Geplande klus: **10 minuten**.
  - Je kunt beide tijden aanpassen in Instellingen, en de hele regel kun je ook uitzetten.
- **Wat ziet een monteur zonder voorrang** als hij te vroeg op "Accepteer" tikt: "Deze klus staat nog X min open voor voorrangsmonteurs. Probeer het daarna opnieuw." Hij betaalt dan niets.
- **Veiligheid:** staat er geen enkele actieve monteur met voorrang die de klus kan betalen, dan mag iedereen direct aannemen. Zo blijft een klus nooit liggen.
- De huidige regel blijft gewoon werken: wie al op een storing zit, laat een vrije collega 2 minuten voorgaan.
- Klanten merken hier niets van.

## Testen

Eerst alleen in de testgroep "VoltFix TEST" met testmonteurs. Pas na jouw akkoord gaat het live. Er wordt niets gepubliceerd zonder jouw opdracht.

## Technische details

- Migratie: `contractors.has_priority boolean default false`; `lead_settings.priority_enabled boolean default true`, `priority_delay_urgent_seconds int default 120`, `priority_delay_planned_seconds int default 600`.
- `claim_lead`: nieuwe controle na de spam-/statuschecks. Als het aan staat, de monteur geen voorrang heeft, er een actieve voorrangsmonteur is met genoeg saldo voor de leadprijs, en `now() < dispatched_at + delay`, dan `{ok:false, reason:'priority_window', seconds_left}`. De claim blijft één atomaire update.
- Telegram-webhook: `priority_window` vertalen naar een `answerCallbackQuery`-melding (via `waitText`).
- `src/lib/claim-priority.ts`: pure functie `priorityWindowSeconds()` met unit-tests.
- Admin: schakelaar per monteur plus reviewcijfers op Monteurs/Contractors; velden in Instellingen; serverfuncties met admincontrole.
