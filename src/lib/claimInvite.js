import { supabase } from './supabase';
import { autoLinkGuardian } from './autoLinkGuardian';

// Wave 3.A #18 P0-3/P0-4: post-login claim handler for invited users.
// Reads raw_user_meta_data.{org_id, role} (set by invite-parent) and
// inserts the matching user_roles row via the claim_invite SECDEF RPC.
//
// Sibling of autoLinkGuardian: that one finds an existing guardian row
// by email; this one handles invites where no profile row pre-exists
// (staff invites, plus parents without a pre-seeded guardian).
//
// Returns { role, organization } when a claim was performed OR when an
// existing claim is found; null when the user has no invite metadata
// (the normal case for already-onboarded users).
export async function claimInvite(user) {
  if (!user?.id) return null;
  const { data, error } = await supabase.rpc('claim_invite');
  if (error) {
    console.error('claimInvite rpc:', error.message);
    return null;
  }
  if (!data?.organization) return null;
  return { role: data.role ?? null, organization: data.organization ?? null };
}

// Combined entry point used by AuthContext when a freshly-authed user has
// no user_roles rows. Tries the invite-metadata claim first (covers staff
// + new parents); falls back to the email-match auto-link.
export async function resolveNewUserContext(user) {
  // Link any anonymously-created guardian row (submit_registration leaves
  // user_id NULL) to this account by confirmed email, via the SECDEF
  // claim_guardian_by_email() RPC — the client can't (guardians_select_own/
  // update_own require user_id = auth.uid(), so an unlinked row is invisible).
  // Run it BEFORE the claimInvite short-circuit so it also covers an invited
  // parent's first login: claim_invite writes user_roles but never sets
  // guardians.user_id, which parent_context_v requires. Idempotent + safe for
  // staff (no matching guardian -> no-op). The RPC carries the email-confirmed gate.
  if (user?.id) {
    const { error: claimErr } = await supabase.rpc('claim_guardian_by_email');
    if (claimErr) console.error('claim_guardian_by_email:', claimErr.message);
  }
  const claimed = await claimInvite(user);
  if (claimed) return claimed;
  return await autoLinkGuardian(user);
}
