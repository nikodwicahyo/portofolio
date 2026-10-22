-- Comment content is plain text at every layer. The edge function rejects
-- tag-like sequences (submit-comment/rules.mjs) and the browser mirrors it, but
-- service_role and any future write path skip both. This constraint makes the
-- table itself refuse markup. Idempotent, additive; run after 20261024.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'comment_no_markup' AND conrelid = 'public.portfolio_comments'::regclass
  ) THEN
    -- Same shape as rules.mjs: "<" plus an optional "/" and a letter, "!" or
    -- "?" is a tag; "<3" and "5 < 6" stay legal. "\m" is a word start, so
    -- "metadata: x" is allowed while "javascript:" / "data:" never are.
    ALTER TABLE public.portfolio_comments
      ADD CONSTRAINT comment_no_markup CHECK (
        user_name !~ '<[[:space:]]*/?[[:space:]]*[a-zA-Z!?]'
        AND content !~ '<[[:space:]]*/?[[:space:]]*[a-zA-Z!?]'
        AND user_name !~* '\m(javascript|vbscript|data):'
        AND content !~* '\m(javascript|vbscript|data):'
      ) NOT VALID;
  END IF;
END $$;

-- Verify after running:
-- select conname, pg_get_constraintdef(oid) from pg_constraint
--   where conrelid = 'public.portfolio_comments'::regclass;
