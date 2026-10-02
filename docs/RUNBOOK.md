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
Client calls `functions/v1/submit-comment` (rate-limited) and falls back to
direct insert. If both fail, check RLS (`is_pinned = false` insert policy)
and the `comment_rate_limits` table from the migration.

## Deploy the edge function
`supabase functions deploy submit-comment` (verify_jwt=false is intentional:
public intake, rate-limited inside — see supabase/config.toml).
