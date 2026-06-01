-- Capture-flow addendum (NOT a §4.5 migration — that chain closed 12/12). Per
-- AUDIT_REGISTRATION_CAPTURE_L99.md §5.1 / gap G6: the public parent registration entry
-- (/r/:slug) needs programs to carry a public slug + registration window + publish flag.
-- These do not exist today (migration #10 added player ext, not program registration cols).
-- Applied via Supabase MCP 2026-06-01 (version 20260601044658).

ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS public_slug   text,
  ADD COLUMN IF NOT EXISTS reg_opens_at  timestamptz,
  ADD COLUMN IF NOT EXISTS reg_closes_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_published  boolean NOT NULL DEFAULT false;

-- Global slug uniqueness for v1 (single domain). Multiple NULLs allowed (nulls-distinct),
-- so the 3 existing season programs keep NULL slugs. Multi-org subdomain routing (per-org
-- slug uniqueness) is a Phase 5 concern — see audit §4.1 / spec Q5.
CREATE UNIQUE INDEX IF NOT EXISTS programs_public_slug_key
  ON public.programs (public_slug) WHERE public_slug IS NOT NULL;

-- Fast slug lookup for get_public_program (published programs only).
CREATE INDEX IF NOT EXISTS programs_published_slug_idx
  ON public.programs (public_slug) WHERE is_published = true;

DO $$
DECLARE v_cols int;
BEGIN
  SELECT count(*) INTO v_cols FROM information_schema.columns
   WHERE table_schema='public' AND table_name='programs'
     AND column_name IN ('public_slug','reg_opens_at','reg_closes_at','is_published');
  IF v_cols <> 4 THEN RAISE EXCEPTION 'verify failed: expected 4 new program columns, got %', v_cols; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='programs_public_slug_key') THEN
    RAISE EXCEPTION 'verify failed: programs_public_slug_key unique index missing';
  END IF;
  IF (SELECT count(*) FROM public.programs WHERE public_slug IS NOT NULL OR is_published) <> 0 THEN
    RAISE EXCEPTION 'verify failed: existing programs unexpectedly have slug/published set';
  END IF;
  RAISE NOTICE 'migration 13a verified: 4 columns + slug unique index added; existing programs untouched.';
END $$;
