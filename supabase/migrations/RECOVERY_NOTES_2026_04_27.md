# Migration recovery notes — Phase 1.5 Ship 7.10

**Date:** April 27, 2026
**Reason:** 4 production migrations were applied via Supabase MCP earlier today without matching local repo files. This recovery commits the SQL bodies as local files using their exact production version timestamps, so future `supabase db pull` and `supabase migration list` see zero drift.

## Filename convention shift

Migrations 001 through 033 use the old `NNN_name.sql` numbering. Starting with this recovery, structural migrations applied via newer Supabase CLI / MCP use timestamp-format `YYYYMMDDHHMMSS_name.sql` versions. Both conventions coexist in production migration history; this is intentional and matches Supabase CLI's native behavior.

## Files added in this recovery

| File | Prod version | Content |
|------|-------------|---------|
| `20260427131334_rides_offer_cancel_cascade.sql` | 20260427131334 | Cascade trigger: cancelling a ride offer cancels its claims; waitlist promotion gated on offer.status='active'. Phase D.2 Ship 1. |
| `20260427185842_ship_7_1_security_lockdown.sql` | 20260427185842 | REVOKE EXECUTE on 21 SECURITY DEFINER functions from anon/PUBLIC. Broaden ride_claims_insert RLS to permit rider self-insert. Phase 1.5 Ship 7.1. |
| `20260427185927_ship_7_1_security_lockdown_public_revoke_fix.sql` | 20260427185927 | Follow-up: REVOKE FROM PUBLIC for Group B+C functions (anon inherits from PUBLIC, so revoke-from-anon-only was insufficient). Phase 1.5 Ship 7.1. |
| `20260427190412_ship_7_2_schema_drift_fix.sql` | 20260427190412 | DROP COLUMN events.ride_coordination_enabled + DROP INDEX idx_events_ride_coord + REPLACE get_event_ride_state RPC to read enable_rides. Phase 1.5 Ship 7.2. |

## What is NOT recovered (intentional)

The 6 April 26 migrations (`tournament_times_correction`, `data_integrity_fix`, `data_corrections_resurrection_jersey`, `resurrection_address_correction`, `venue_address_corrections_and_canonical_urls`, `rename_cardinal_spellman_to_cyo_spellman`) are one-off DATA corrections, not structural changes. They remain prod-only by design. If you need their bodies for any reason, query `supabase_migrations.schema_migrations` directly.
