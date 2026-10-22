-- API hardening — closes the two remaining anonymous-surface findings.
-- Idempotent, additive. Run in Supabase SQL Editor after
-- 20261022_security_hardening.sql.

-- ---------------------------------------------------------------
-- 1. Storage: stop anonymous object enumeration
-- ---------------------------------------------------------------
-- The buckets are public, so objects are already served by
-- /storage/v1/object/public/<bucket>/<path>, which does not consult RLS.
-- The SELECT access on storage.objects is what lets the anon key call
-- POST /storage/v1/object/list/<bucket> and enumerate every filename, size
-- and timestamp.
--
-- Primary control: a RESTRICTIVE policy ANDs with every permissive policy, so
-- no future "public read" policy can re-open listing for anon. Public object
-- URLs are unaffected; admins (authenticated) are unaffected.
DROP POLICY IF EXISTS "anon no storage listing" ON storage.objects;
CREATE POLICY "anon no storage listing"
  ON storage.objects AS RESTRICTIVE FOR SELECT TO anon
  USING (false);

-- Secondary control: revoke the SELECT grant itself. Tolerated failure —
-- storage.objects is owned by supabase_storage_admin, so the SQL editor role
-- may not be allowed to change its grants; the restrictive policy above is
-- the guarantee if that happens.
DO $$
BEGIN
  REVOKE SELECT ON storage.objects FROM anon;
  REVOKE SELECT ON storage.objects FROM PUBLIC;
  GRANT SELECT ON storage.objects TO authenticated, service_role;
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'storage grant change skipped (%): restrictive policy still blocks anon listing', SQLERRM;
END $$;

-- ---------------------------------------------------------------
-- 2. Projects: public reads only expose published rows
-- ---------------------------------------------------------------
-- The old policy was USING (true), so a row with is_published = false would be
-- readable by anyone with the anon key even though the site treats it as a
-- draft. The dashboard is unaffected: admins still see all rows through
-- "admin manage projects" (FOR ALL), which ORs with this policy.
DROP POLICY IF EXISTS "public read projects" ON public.projects;
DROP POLICY IF EXISTS "public read published projects" ON public.projects;
CREATE POLICY "public read published projects"
  ON public.projects FOR SELECT
  USING (coalesce(is_published, true));

-- ---------------------------------------------------------------
-- 3. Verify after running (expect 401/[] for list, 200 for the image)
-- ---------------------------------------------------------------
-- select polname, polpermissive, polroles::regrole[], polqual
--   from pg_policy where polrelid = 'storage.objects'::regclass;
-- npm run check-api
