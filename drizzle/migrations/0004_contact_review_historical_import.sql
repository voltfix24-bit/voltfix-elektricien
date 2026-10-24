ALTER TABLE public.contact_route_reviews ALTER COLUMN reviewed_by DROP NOT NULL;
ALTER TABLE public.contact_route_reviews ADD COLUMN historical_import boolean NOT NULL DEFAULT false;
COMMENT ON COLUMN public.contact_route_reviews.reviewed_by IS 'NULL alleen bij historical_import (door eigenaar bevestigd, geïmporteerd)';