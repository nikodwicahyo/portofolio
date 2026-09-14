-- Security hardening: RLS, admin-only writes, public-comment guardrails,
-- storage policies, comment rate-limit table, svg-assets bucket.
-- Run once via Supabase Dashboard > SQL Editor (or `supabase db push`).
-- Idempotent: safe to re-run (DROP IF EXISTS before CREATE).

-- ---------------------------------------------------------------- 0. helper
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ------------------------------------------------- 1. rate-limit table
create table if not exists public.comment_rate_limits (
  id bigint generated always as identity primary key,
  ip_hash text not null,
  created_at timestamptz not null default now()
);
create index if not exists comment_rate_limits_ip_time
  on public.comment_rate_limits (ip_hash, created_at desc);
alter table public.comment_rate_limits enable row level security;
-- No public policies: only service_role (edge function) touches this table.

-- ------------------------------------------------- 2. svg-assets bucket
insert into storage.buckets (id, name, public)
values ('svg-assets', 'svg-assets', true)
on conflict (id) do nothing;

-- ------------------------------------------------- 3. row level security
alter table public.profiles             enable row level security;
alter table public.projects             enable row level security;
alter table public.certificates         enable row level security;
alter table public.experiences          enable row level security;
alter table public.tech_stacks          enable row level security;
alter table public.cv_documents         enable row level security;
alter table public.portfolio_comments   enable row level security;

-- profiles: a user can read only their own row; writes are admin-managed.
drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read" on public.profiles
  for select to authenticated using (auth.uid() = id);

-- Generic public-read content tables (read by the public site).
do $$
declare t text;
begin
  foreach t in array array['projects','certificates','experiences','tech_stacks','cv_documents'] loop
    execute format('drop policy if exists %I on public.%I', t || ' public read', t);
    execute format(
      'create policy %I on public.%I for select to anon, authenticated using (true)',
      t || ' public read', t);
    execute format('drop policy if exists %I on public.%I', t || ' admin write', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())',
      t || ' admin write', t);
  end loop;
end $$;

-- portfolio_comments: public read; anon insert tightly constrained so even a
-- direct API call cannot set is_pinned, avatars, or overlong text.
drop policy if exists "comments public read" on public.portfolio_comments;
create policy "comments public read" on public.portfolio_comments
  for select to anon, authenticated using (true);

drop policy if exists "comments anon insert" on public.portfolio_comments;
create policy "comments anon insert" on public.portfolio_comments
  for insert to anon, authenticated
  with check (
    char_length(content) between 1 and 200
    and char_length(user_name) between 1 and 15
    and is_pinned = false
    and profile_image is null
  );

drop policy if exists "comments admin write" on public.portfolio_comments;
create policy "comments admin write" on public.portfolio_comments
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ------------------------------------------------- 4. storage policies
-- Public read on site buckets; writes admin-only. Raw SVG must never be
-- uploaded here (raster only) — SVGs go through sanitize-svg into svg-assets.

do $$
declare b text;
begin
  foreach b in array array['project-images','experience-logos','certificate-images','cv-documents','svg-assets'] loop
    execute format('drop policy if exists %I on storage.objects', b || ' public read');
    execute format(
      'create policy %I on storage.objects for select to anon, authenticated using (bucket_id = %L)',
      b || ' public read', b);
    execute format('drop policy if exists %I on storage.objects', b || ' admin write');
    execute format(
      'create policy %I on storage.objects for all to authenticated using (bucket_id = %L and public.is_admin()) with check (bucket_id = %L and public.is_admin())',
      b || ' admin write', b, b);
  end loop;
end $$;
