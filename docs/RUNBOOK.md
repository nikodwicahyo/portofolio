# Runbook — keep the site alive

## Rotate keys
1. Supabase Dashboard → Settings → API → rotate anon key.
2. Vercel → Project → Environment Variables → update `VITE_SUPABASE_URL` /
   `VITE_SUPABASE_ANON_KEY` → Redeploy. Same for `VITE_FORMLY_ACCESS_KEY`.
3. Confirm `/` loads with fresh data and contact form sends.

## Restore DB
Supabase → Database → Backups → point-in-time restore (Pro) or replay the
SQL in `README.md` + `supabase/migrations/20261002_portfolio_enhancements.sql`.
Storage: mirror `project-images`, `certificate-images`, `svg-assets`,
`cv-documents` buckets before destructive changes.

## When contact fails
Form posts to Formly with a 15s timeout; on failure the UI shows a direct
`mailto:nikodwchy@gmail.com` fallback. If Formly is down >1h, check the key
in Vercel env and Formly dashboard quota.

## When comments fail
Client calls `functions/v1/submit-comment` (the only write path — there is no
direct-insert fallback). Check, in order:

1. `supabase functions list` / function logs — a 5xx means the service-role
   insert or the rate-limit ledger is failing. A 500 whose log names
   `comment_no_markup` means the row tripped the DB constraint but not the
   shared filter: fix `supabase/functions/submit-comment/rules.mjs` and the
   constraint in `20261025_comment_markup.sql` together.
2. `npm run check-api` — table grants, storage listing, signup toggle, markup
   filter.
3. 403 `captcha_failed` for every visitor: `TURNSTILE_SECRET` is set on the
   project but `VITE_TURNSTILE_SITE_KEY` is missing from the Vercel build (or
   the reverse). They must be enabled together.
4. 429 across unrelated visitors: the DB-level 30/min global cap
   (`comment_flood`) is saturated — likely abuse; enable Turnstile.

## Rotate the comment IP pepper
`supabase secrets set COMMENT_HASH_SALT="$(openssl rand -hex 32)"`, then
`supabase functions deploy submit-comment`. All existing rate-limit buckets
become unmatchable (every visitor gets one fresh slot; rows age out in 24h).
Without `COMMENT_HASH_SALT` the function uses the service-role key as the
pepper, so rotating that key has the same effect.

## Retention
Applied by `supabase/migrations/20261024_privacy_retention.sql`, on write:
`comment_rate_limits` → 24h, `portfolio_events` → 30 days. Verify with
`select count(*) from public.comment_rate_limits where created_at < now() - interval '1 day';`
— it must be 0. If you reset the schema, re-run that migration.

## Deploy the edge function
`supabase functions deploy submit-comment` (verify_jwt=false is intentional:
public intake, rate-limited inside — see supabase/config.toml). Set
`COMMENT_HASH_SALT` (and optionally `TURNSTILE_SECRET`) first — see README 4c.
