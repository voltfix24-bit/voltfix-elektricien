ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS image_urls text[] NOT NULL DEFAULT '{}'::text[];

CREATE POLICY "Admins can read lead attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'lead-attachments' AND public.has_role(auth.uid(), 'admin'));