-- Mirror file backfilled 2026-05-28 from supabase_migrations.schema_migrations.statements per Wave 2.A audit #23 P0-1.
-- Original SQL applied via chat-side claude.ai MCP without same-turn mirror; this file restores the AP #21 mirror invariant.

-- Y2b: Backfill spring 2026 game_results from records-v14_2.html source of truth.
-- Maps real production events (event_id FK) to actual W/L/scores.
-- 26 results across 5 teams, dated Apr 9-19 2026.
-- Schema constraint: result must be 'W' / 'L' / 'T'.

-- 11U Girls (5-2)
INSERT INTO game_results (event_id, our_score, opponent_score, result, point_differential, published_at) VALUES
  ('bb20c869-af98-4d39-9739-9de0bbb78e4e', 29, 12, 'W', 17, now()),
  ('d9173ad8-482c-443f-9709-5be6d86ecbd3', 40, 9,  'W', 31, now()),
  ('c61a49d6-3966-4182-8484-ee7c72f604a2', 26, 16, 'W', 10, now()),
  ('fc44453c-83ea-48c0-829d-dd1048b3ac9c', 35, 21, 'W', 14, now()),
  ('ed7a626b-722a-48d7-83dd-bf97bbebb586', 20, 43, 'L', -23, now()),
  ('50f0ac01-788f-4122-91d3-1a6ea65a86f1', 14, 24, 'L', -10, now()),
  ('1aef592f-c116-499e-a936-5566ff792f6d', 29, 24, 'W', 5,  now());

-- 10U Black (5-4)
INSERT INTO game_results (event_id, our_score, opponent_score, result, point_differential, published_at) VALUES
  ('160f9d9f-6f98-446d-851b-1a778bc0a410', 43, 19, 'W', 24, now()),
  ('6b1a8245-06cd-4312-818f-8a3f47430920', 21, 18, 'W', 3,  now()),
  ('0dedfdc7-ca29-4306-9a92-8d89ee79e3c2', 40, 19, 'W', 21, now()),
  ('864f2ef6-e6cb-4ab0-ae91-32cd17b70937', 41, 18, 'W', 23, now()),
  ('6fcbe932-7f87-4c6a-b777-52660336c30f', 39, 17, 'W', 22, now()),
  ('e67a66ca-0112-46c5-9c51-14199c185037', 34, 38, 'L', -4,  now()),
  ('64d461b0-a1b8-42a7-af89-4d71681f18ad', 28, 31, 'L', -3,  now()),
  ('daecb466-7f3a-4481-b566-e5a30726c9ca', 28, 48, 'L', -20, now()),
  ('30e07f45-a853-44a7-bd09-a5012051f71f', 12, 42, 'L', -30, now());

-- 8U Boys (3-5)
INSERT INTO game_results (event_id, our_score, opponent_score, result, point_differential, published_at) VALUES
  ('a4208b85-5653-4aaf-be53-f1e47eeb707d', 12, 11, 'W', 1,   now()),
  ('d90fe4f2-67bc-45f0-a818-6e6a31e4e3dc', 38, 14, 'W', 24,  now()),
  ('21802388-462a-42b7-b4cb-afe5da30bc71', 14, 28, 'L', -14, now()),
  ('24b998e9-8fe6-4123-bc95-607f20a70c8d', 12, 45, 'L', -33, now()),
  ('089cb5aa-b94f-4cb7-8e8b-b0acc8d4893e', 29, 27, 'W', 2,   now()),
  ('c4f4d823-7aa6-4eda-8af0-5b8fb15f36ea', 14, 28, 'L', -14, now()),
  ('f789f676-e597-4dab-9761-31f6d1ac325d', 10, 41, 'L', -31, now()),
  ('b2f11683-fa39-40dd-a97d-bf79cfebcf62', 9,  29, 'L', -20, now());

-- 10U Blue (1-1)
INSERT INTO game_results (event_id, our_score, opponent_score, result, point_differential, published_at) VALUES
  ('162a9658-7a9f-48dc-9ff8-73b0d801e1f5', 48, 20, 'W', 28,  now()),
  ('27d40a50-473e-4ab6-8b44-8032179d5cc5', 10, 33, 'L', -23, now());

-- 9U Boys (0-1)
INSERT INTO game_results (event_id, our_score, opponent_score, result, point_differential, published_at) VALUES
  ('28e7ce0e-d709-4287-bb57-6838252e8004', 16, 24, 'L', -8, now());
