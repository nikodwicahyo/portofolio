-- Privacy retention + storage hardening — closes the remaining audit findings
-- (20261022/20261023 must be applied first). Idempotent, additive.

-- ---------------------------------------------------------------
-- 1. Visitor IP buckets: 24h retention
-- ---------------------------------------------------------------
-- comment_rate_limits holds sha256(pepper::ip). That is pseudonymous, not
-- anonymous: it is personal data and must not live forever. Only the last hour
-- is ever queried (WINDOW_SECONDS / HOURLY_LIMIT in submit-comment), so 24h is
-- already generous.
CREATE INDEX IF NOT EXISTS comment_rate_limits_created_at_idx
  ON public.comment_rate_limits (created_at);

CREATE OR REPLACE FUNCTION public.comment_rate_limits_prune()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- ponytail: prune on write, no pg_cron dependency. Each insert deletes at most
  -- one day of rows and the index keeps it cheap; move to pg_cron if the table
  -- ever outgrows a single-statement delete.
  -- SECURITY DEFINER: the inserting role is service_role here, but the function
  -- must keep working if that changes; without it RLS silently no-ops the DELETE.
  DELETE FROM public.comment_rate_limits WHERE created_at < now() - interval '1 day';
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.comment_rate_limits_prune() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS comment_rate_limits_prune ON public.comment_rate_limits;
CREATE TRIGGER comment_rate_limits_prune
  BEFORE INSERT ON public.comment_rate_limits
  FOR EACH STATEMENT EXECUTE FUNCTION public.comment_rate_limits_prune();

-- ---------------------------------------------------------------
-- 2. Analytics rows: 30d retention
-- ---------------------------------------------------------------
-- portfolio_events accepts anonymous inserts (bounded by the 120/min trigger).
-- Nothing reads it yet, so it is pure growth + retention liability.
CREATE OR REPLACE FUNCTION public.portfolio_events_prune()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- ponytail: 30 days of coarse counts is all a portfolio needs. Same
  -- write-time-prune ceiling as above.
  -- SECURITY DEFINER is required: inserts arrive as `anon`, which has no DELETE
  -- policy, so an invoker-rights DELETE would match zero rows.
  DELETE FROM public.portfolio_events WHERE created_at < now() - interval '30 days';
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.portfolio_events_prune() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS portfolio_events_prune ON public.portfolio_events;
CREATE TRIGGER portfolio_events_prune
  BEFORE INSERT ON public.portfolio_events
  FOR EACH STATEMENT EXECUTE FUNCTION public.portfolio_events_prune();

-- ---------------------------------------------------------------
-- 3. Storage listing: admins only, for every role
-- ---------------------------------------------------------------
-- 20261023 only restricted `anon`, so any signed-in non-admin could still call
-- POST /storage/v1/object/list/<bucket> and enumerate every filename. The
-- rule should be "admin or nothing": restrictive policies AND with the
-- permissive "public read <bucket>" policies, so public object URLs
-- (/object/public/...) and the dashboard are unaffected.
DROP POLICY IF EXISTS "anon no storage listing" ON storage.objects;
DROP POLICY IF EXISTS "no storage listing" ON storage.objects;
CREATE POLICY "no storage listing"
  ON storage.objects AS RESTRICTIVE FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ---------------------------------------------------------------
-- 4. Bucket-level upload ceilings (native enforcement)
-- ---------------------------------------------------------------
-- The client validates type and size, but file.type and file.size are
-- attacker-controlled. Storage enforces these at the platform boundary instead.
-- svg-assets is the one bucket where content type matters: sanitization runs in
-- the browser, so the bucket only ever accepts SVG, capped at 512KB.
UPDATE storage.buckets
   SET file_size_limit = 524288,
       allowed_mime_types = ARRAY['image/svg+xml']
 WHERE id = 'svg-assets';

-- Raster buckets (project images are re-encoded to webp client-side).
UPDATE storage.buckets
   SET file_size_limit = 5242880,
       allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']
 WHERE id IN ('project-images', 'experience-logos');

-- Certificates allow PDFs as well as images.
UPDATE storage.buckets
   SET file_size_limit = 5242880,
       allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf']
 WHERE id = 'certificate-images';

UPDATE storage.buckets
   SET file_size_limit = 5242880,
       allowed_mime_types = ARRAY['application/pdf']
 WHERE id = 'cv-documents';

-- ---------------------------------------------------------------
-- 5. Verify after running
-- ---------------------------------------------------------------
-- select id, public, file_size_limit, allowed_mime_types from storage.buckets;
-- select polname, polpermissive, polroles::regrole[], polqual
--   from pg_policy where polrelid = 'storage.objects'::regclass;
-- select count(*) from public.comment_rate_limits where created_at < now() - interval '1 day';
--   -- must stay 0 (or shrink to 0 on the next comment)
