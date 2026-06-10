// BRIEF-3 (Option A) — shared pilot-gate/redirect resolution for the per-player
// kinds (rsvp_nudge, academy_callup_notice). Calls get_digest_recipients(pilot)
// ONCE and returns the gate inputs. Extracted from the verbatim block that was
// duplicated in rsvpNudge.js + academyCallupNoticeData.js (DRY — the audit's
// "shared per-player redirect helper").
//
//   allowedGuardianIds : real pilot families (FILTER mode allowlist).
//   redirectMode       : true when the RPC returns SYNTHETIC null-guardian rows
//                        (pre-cutover REDIRECT verification mode).
//   redirectEmail      : the pilot_test_recipient_email those synthetic rows carry.
//
// In redirectMode the send pipeline must queue the recipient row with
// email_at_send = redirectEmail AND guardian_id = NULL (passing decidePilotGate,
// the same shape the digest synthetic rows already use) WHILE token minting keeps
// the REAL (event, player, guardian) ids — the pilot tester's click then RSVPs as
// the real family (the verification being tested). AP#36: RPC error surfaced.
export async function resolvePilotRedirect(supabase, orgId, pilotOnly) {
  if (!pilotOnly || !orgId) {
    return { allowedGuardianIds: new Set(), redirectMode: false, redirectEmail: null };
  }
  const { data: rpcRows = [], error } = await supabase.rpc('get_digest_recipients', { p_org_id: orgId, p_pilot_only: true });
  if (error) throw error;
  const rows = rpcRows || [];
  const redirectRow = rows.find((r) => r.guardian_id == null && r.email);
  return {
    allowedGuardianIds: new Set(rows.filter((r) => r.guardian_id).map((r) => r.guardian_id)),
    redirectMode: !!redirectRow,
    redirectEmail: redirectRow?.email || null,
  };
}
