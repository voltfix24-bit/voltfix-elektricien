CREATE TABLE public.admin_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_shared boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX admin_views_user_idx ON public.admin_views (user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_views TO authenticated;
GRANT ALL ON public.admin_views TO service_role;

ALTER TABLE public.admin_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read own and shared views"
ON public.admin_views FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') AND (user_id = auth.uid() OR is_shared));

CREATE POLICY "Admins create own views"
ON public.admin_views FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') AND user_id = auth.uid());

CREATE POLICY "Admins update own views"
ON public.admin_views FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin') AND user_id = auth.uid())
WITH CHECK (public.has_role(auth.uid(), 'admin') AND user_id = auth.uid());

CREATE POLICY "Admins delete own views"
ON public.admin_views FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin') AND user_id = auth.uid());