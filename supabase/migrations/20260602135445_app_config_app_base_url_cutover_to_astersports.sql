-- Cutover: flip the seed default for app_config.app_base_url to astersports.app.
-- The seed migration (20260602001709) wrote the deploy host that was current
-- when it was authored (https://skyfire-app.vercel.app). The live row was
-- repointed via a one-shot UPDATE during the rebrand cutover (#629 / #634);
-- this migration makes that UPDATE part of the deterministic migration chain
-- so a `supabase db reset` produces the post-cutover value, not the stale seed.
--
-- Idempotent: running twice is a no-op past the first row touch.
update public.app_config
   set value = 'https://astersports.app', updated_at = now()
 where key = 'app_base_url';
