-- Programs L99 registry build: add the `other` archetype (the single curated
-- escape hatch, ratified §4 mapping 2026-06-07). Known enum value, treated
-- non-competitive by default in PROGRAM_TYPE_REGISTRY. ADD VALUE is its own
-- migration (the value can't be used in the same transaction it's added).
ALTER TYPE program_type ADD VALUE IF NOT EXISTS 'other';
