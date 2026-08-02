REVOKE ALL ON public.rank_snapshots FROM anon, authenticated;
GRANT ALL ON public.rank_snapshots TO service_role;
ALTER TABLE public.rank_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role manages rank_snapshots" ON public.rank_snapshots FOR ALL TO service_role USING (true) WITH CHECK (true);