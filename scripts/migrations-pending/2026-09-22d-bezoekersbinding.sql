-- VOORBEREID, NIET TOEGEPAST.
-- Bezoekersbinding voor toestemming. Uitsluitend toevoegend: bestaande kolommen,
-- gegevens en rechten blijven ongewijzigd, zodat de gepubliceerde code blijft werken.

alter table public.ad_consent_tickets add column if not exists visitor_hash text;
create index if not exists ad_consent_tickets_visitor_hash_idx
  on public.ad_consent_tickets (visitor_hash) where visitor_hash is not null;

alter table public.leads add column if not exists consent_visitor_hash text;
create index if not exists leads_consent_visitor_hash_idx
  on public.leads (consent_visitor_hash) where consent_visitor_hash is not null;

alter table public.conversion_events add column if not exists consent_visitor_hash text;
create index if not exists conversion_events_consent_visitor_hash_idx
  on public.conversion_events (consent_visitor_hash) where consent_visitor_hash is not null;

alter table public.quote_requests add column if not exists ad_visitor_hash text;
