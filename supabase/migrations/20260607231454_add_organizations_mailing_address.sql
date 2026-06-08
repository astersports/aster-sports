-- G1 (B2 CAN-SPAM) — organizations.mailing_address: the physical postal address
-- rendered in every briefing footer to satisfy 15 U.S.C. §7704(a)(5). Additive,
-- nullable. Mirror of MCP-applied migration 20260607231454 (AP#21 — the apply
-- landed live last session; this mirror file was missed and is backfilled here
-- per the architect's housekeeping flag, 2026-06-08).
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS mailing_address text;
