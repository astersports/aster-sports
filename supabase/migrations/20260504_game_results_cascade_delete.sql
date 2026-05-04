-- Fix: ensure game_results.event_id cascades on event delete
-- Without this, deleting an event with a published score fails silently
ALTER TABLE public.game_results DROP CONSTRAINT IF EXISTS game_results_event_id_fkey;
ALTER TABLE public.game_results
  ADD CONSTRAINT game_results_event_id_fkey
  FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;
