alter table public.conversion_events
  add column if not exists gclid text,
  add column if not exists gbraid text,
  add column if not exists wbraid text,
  add column if not exists click_ref text;

create index if not exists conversion_events_click_ref_idx
  on public.conversion_events (click_ref, created_at desc)
  where click_ref is not null;

create index if not exists conversion_events_ad_click_idx
  on public.conversion_events (created_at desc)
  where gclid is not null or gbraid is not null or wbraid is not null;

alter table public.leads
  add column if not exists ads_upload_status text,
  add column if not exists ads_uploaded_at timestamptz,
  add column if not exists ads_upload_error text,
  add column if not exists ads_conversion_value_cents integer;