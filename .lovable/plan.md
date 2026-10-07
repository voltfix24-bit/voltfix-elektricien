# Aparte voorranggroep in Telegram

Nieuwe klussen gaan eerst alleen naar een aparte, besloten Telegram-groep met je beste monteurs. Neemt daar binnen de wachttijd niemand de klus aan, dan verschijnt hij pas daarna in de gewone monteursgroep. Monteurs in de gewone groep zien niets van de voorranggroep: het bericht ziet er voor hen precies hetzelfde uit als nu, zonder vermelding van een eerdere ronde.

## Hoe het werkt

- **Voorranggroep:** jij maakt in Telegram een nieuwe groep aan met de monteurs die je voorrang wilt geven en voegt de VoltFix-bot eraan toe. Ik koppel die groep daarna.
- **Volgorde per klus:**
  1. Klus komt binnen en gaat alleen naar de voorranggroep.
  2. Neemt iemand hem aan, dan is hij weg. De gewone groep krijgt niets.
  3. Niemand binnen de wachttijd? Dan gaat dezelfde klus naar de gewone groep. De knop in de voorranggroep wordt dan "Niet meer beschikbaar".
- **Wachttijd** (aan te passen in Instellingen):
  - Storing/spoed: **3 minuten**.
  - Geplande klus: **15 minuten**.
- **Veiligheid:** is de regel uitgezet of de voorranggroep niet gekoppeld, dan gaat alles direct naar de gewone groep, zoals nu. Ook als er in de voorranggroep niemand is met genoeg saldo, gaat de klus meteen door naar de gewone groep. De bestaande escalatie bij onbeantwoorde klussen blijft werken en telt vanaf het moment dat de klus in de gewone groep staat.
- **Wie in welke groep zit**, bepaal je zelf in Telegram door mensen toe te voegen of te verwijderen. Aannemen, saldo en prijzen werken in beide groepen hetzelfde.
- Klanten merken hier niets van.

## Testen

Eerst met de testgroep "VoltFix TEST" plus een tweede testgroep als voorranggroep. Pas na jouw akkoord gaat het live.

## Wat ik van je nodig heb

Maak de voorranggroep aan, voeg de bot toe en stuur daar één berichtje. Dan zoek ik de groep zelf op.

## Technische details

- Migratie: `lead_settings.priority_group_enabled boolean default false`, `priority_chat_id bigint`, `priority_wait_urgent_seconds int default 180`, `priority_wait_planned_seconds int default 900`. `leads.priority_message_id bigint`, `priority_sent_at timestamptz`, `public_released_at timestamptz`.
- Dispatch (`lead-dispatch.server.ts`): eerst naar `priority_chat_id`, met `priority_sent_at`. Een cronroute `/api/public/hooks/priority-release` (beveiligd met de bestaande hook-token) zoekt elke minuut niet-geclaimde leads waarvan de wachttijd voorbij is. Die versturen we naar de hoofdgroep via de bestaande `telegram_message_id`-flow, het voorrangbericht passen we aan, en de update gebeurt atomair met `public_released_at IS NULL` zodat niets dubbel verstuurd wordt.
- `claim_lead` ongewijzigd qua betaling. Na een claim werken we beide berichten bij (voor zover verstuurd).
- De escalatietimer gebruikt `coalesce(public_released_at, dispatched_at)`.
- Admin Instellingen: aan/uit, gekoppelde groep, twee wachttijden.
- Testmodus: blijft de testgroep gebruiken.
