alter table public.leads
  add column if not exists gclid text,
  add column if not exists gbraid text,
  add column if not exists wbraid text;

alter table public.quote_requests
  add column if not exists gclid text,
  add column if not exists gbraid text,
  add column if not exists wbraid text;

create index if not exists leads_gclid_idx on public.leads (gclid) where gclid is not null;