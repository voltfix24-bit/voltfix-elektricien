-- VOORBEREID, NIET TOEGEPAST op de gedeelde database.
-- Beheerderstestlinks voor het veilig testen van de bestaande websiteformulieren.
-- Niet-destructief: één nieuwe tabel (alleen server) + één kolom met standaard false.

create table if not exists public.form_test_links (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  created_by uuid not null references auth.users(id) on delete cascade,
  label text,
  target_path text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  idempotency_key text,
  used_at timestamptz,
  quote_request_id uuid unique references public.quote_requests(id) on delete set null
);

grant all on public.form_test_links to service_role;
alter table public.form_test_links enable row level security;
-- Bewust geen policies: alleen de server (service role) leest en schrijft.

alter table public.quote_requests
  add column if not exists is_test boolean not null default false;

-- Terugdraaien (alleen als er nog geen testaanvragen zijn):
--   drop table public.form_test_links;
--   alter table public.quote_requests drop column is_test;