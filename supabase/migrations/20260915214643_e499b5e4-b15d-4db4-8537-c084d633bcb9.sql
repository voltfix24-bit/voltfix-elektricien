ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;
ALTER TABLE public.contractors ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;

INSERT INTO public.contractors (id, name, phone, is_active, balance_cents, is_test)
VALUES
  ('11111111-1111-4111-8111-111111111101', 'Test Monteur A', '+31600000001', true, 5000, true),
  ('11111111-1111-4111-8111-111111111102', 'Test Monteur B', '+31600000002', false, 300, true),
  ('11111111-1111-4111-8111-111111111103', 'Test Monteur C', '+31600000003', true, 2500, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.leads (id, customer_name, customer_phone, address, postal_code, city, job_type, description, price_cents, status, is_test)
VALUES
  ('22222222-2222-4222-8222-222222222201', 'TEST Klant Jansen', '+31600000101', 'Teststraat 1', '1011 AA', 'Amsterdam', 'groepenkast', 'TEST dossier - niet opvolgen', 2000, 'new', true),
  ('22222222-2222-4222-8222-222222222202', 'TEST Klant De Vries', '+31600000102', 'Teststraat 2', '1012 BB', 'Amsterdam', 'storing', 'TEST dossier - niet opvolgen', 500, 'new', true),
  ('22222222-2222-4222-8222-222222222203', 'TEST Klant Bakker', '+31600000103', 'Teststraat 3', '1013 CC', 'Amsterdam', 'storing', 'TEST dossier - niet opvolgen', 500, 'dispatched', true),
  ('22222222-2222-4222-8222-222222222204', 'TEST Klant Smit', '+31600000104', 'Teststraat 4', '1014 DD', 'Amsterdam', 'groepenkast', 'TEST dossier - niet opvolgen', 2000, 'dispatched', true),
  ('22222222-2222-4222-8222-222222222205', 'TEST Klant Visser', '+31600000105', 'Teststraat 5', '1015 EE', 'Amsterdam', 'storing', 'TEST dossier - niet opvolgen', 500, 'new', true),
  ('22222222-2222-4222-8222-222222222206', 'TEST Klant Mulder', '+31600000106', 'Teststraat 6', '1016 FF', 'Amsterdam', 'groepenkast', 'TEST dossier - niet opvolgen', 2000, 'new', true)
ON CONFLICT (id) DO NOTHING;