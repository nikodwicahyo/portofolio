-- Security hardening — closes the public write paths that bypass the
-- submit-comment edge function, and locks down the admin role column.
-- Additive + idempotent: safe to re-run. Run in Supabase SQL Editor.

-- ---------------------------------------------------------------
-- 1. Comments: the edge function is the only writer
-- ---------------------------------------------------------------
-- The old "public insert comment" policy let anyone POST straight to
-- /rest/v1/portfolio_comments with the anon key, skipping the rate limit,
-- length caps, link filter and server timestamp in submit-comment.
DROP POLICY IF EXISTS "public insert comment" ON public.portfolio_comments;
-- No client inserts at all (the dashboard never creates comments). UPDATE and
-- DELETE stay granted to authenticated so the admin can pin/remove; RLS still
-- limits those to role = 'admin'. anon gets nothing but SELECT.
REVOKE INSERT ON public.portfolio_comments FROM anon, authenticated;
REVOKE UPDATE, DELETE ON public.portfolio_comments FROM anon;

-- Same limits at rest: a future policy mistake cannot reintroduce oversized
-- rows. NOT VALID skips legacy rows, enforcement applies to every new insert.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'comment_name_len' AND conrelid = 'public.portfolio_comments'::regclass
  ) THEN
    ALTER TABLE public.portfolio_comments
      ADD CONSTRAINT comment_name_len CHECK (char_length(user_name) BETWEEN 1 AND 15) NOT VALID;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'comment_body_len' AND conrelid = 'public.portfolio_comments'::regclass
  ) THEN
    ALTER TABLE public.portfolio_comments
      ADD CONSTRAINT comment_body_len CHECK (char_length(content) BETWEEN 1 AND 200) NOT VALID;
  END IF;
END $$;

-- Server-owned columns + flood guard. created_at and profile_image are never
-- legitimately supplied by a caller: back-dating pins spam at the top of the
-- wall, and a caller-chosen profile_image turns every page view into a
-- tracking-pixel request. The global cap is IP-independent, so spoofed
-- X-Forwarded-For values cannot bypass it.
CREATE INDEX IF NOT EXISTS portfolio_comments_created_at_idx
  ON public.portfolio_comments (created_at DESC);

CREATE OR REPLACE FUNCTION public.portfolio_comments_before_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.created_at := now();
  NEW.profile_image := NULL;

  -- ponytail: global cap, not per-IP (proxy hops are spoofable). 30/min is far
  -- above real traffic for a personal site; raise it if that ever stops being true.
  IF (SELECT count(*) FROM public.portfolio_comments
      WHERE created_at > now() - interval '60 seconds') >= 30 THEN
    RAISE EXCEPTION 'comment_flood' USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS portfolio_comments_before_insert ON public.portfolio_comments;
CREATE TRIGGER portfolio_comments_before_insert
  BEFORE INSERT ON public.portfolio_comments
  FOR EACH ROW EXECUTE FUNCTION public.portfolio_comments_before_insert();

-- ---------------------------------------------------------------
-- 2. Rate-limit ledger: service_role only
-- ---------------------------------------------------------------
REVOKE ALL ON public.comment_rate_limits FROM anon, authenticated;

-- ---------------------------------------------------------------
-- 3. Analytics: bound row size and insert rate
-- ---------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'event_path_len' AND conrelid = 'public.portfolio_events'::regclass
  ) THEN
    ALTER TABLE public.portfolio_events
      ADD CONSTRAINT event_path_len CHECK (path IS NULL OR char_length(path) <= 200) NOT VALID;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'event_meta_size' AND conrelid = 'public.portfolio_events'::regclass
  ) THEN
    ALTER TABLE public.portfolio_events
      ADD CONSTRAINT event_meta_size CHECK (meta IS NULL OR pg_column_size(meta) <= 2048) NOT VALID;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS portfolio_events_created_at_idx
  ON public.portfolio_events (created_at DESC);

CREATE OR REPLACE FUNCTION public.portfolio_events_before_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.created_at := now();

  -- ponytail: 120/min global cap so a scripted anon key cannot bloat the table.
  IF (SELECT count(*) FROM public.portfolio_events
      WHERE created_at > now() - interval '60 seconds') >= 120 THEN
    RAISE EXCEPTION 'event_flood' USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS portfolio_events_before_insert ON public.portfolio_events;
CREATE TRIGGER portfolio_events_before_insert
  BEFORE INSERT ON public.portfolio_events
  FOR EACH ROW EXECUTE FUNCTION public.portfolio_events_before_insert();

-- ---------------------------------------------------------------
-- 4. Profiles: the admin role column is read-only for clients
-- ---------------------------------------------------------------
-- Every dashboard permission is "does profiles.role = 'admin'". Clients never
-- write this table (the dashboard only reads its own role), so revoking writes
-- is the durable fix: RLS policies can never grant a privilege that is revoked.
REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM anon, authenticated;
GRANT SELECT ON public.profiles TO authenticated;

-- Guarantee the role lookup in Login/ProtectedRoute works even if the
-- dashboard-created policy set is incomplete. Own row only; admins still read
-- only their own row, which is all the client ever needs.
DROP POLICY IF EXISTS "profiles read own" ON public.profiles;
CREATE POLICY "profiles read own"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

-- ---------------------------------------------------------------
-- 5. Verify (run separately, commit the output alongside this file)
-- ---------------------------------------------------------------
-- select tablename, policyname, cmd, roles, qual, with_check
--   from pg_policies where schemaname = 'public' order by tablename, cmd;
