import { supabase } from './supabase';

// First-login hook for self-claim parent accounts (no invite). The email-match
// link of an anonymously-created guardian row (submit_registration leaves
// user_id NULL) is performed by the SECDEF claim_guardian_by_email() RPC in
// resolveNewUserContext — the client CANNOT do it directly: guardians_select_own
// / guardians_update_own require user_id = auth.uid(), so an unlinked row is
// invisible/unupdatable to a fresh parent (the onboarding-pipeline P0). Here we
// read the now-linked guardian, seed the parent's user_roles membership, and
// return the org context. Returns { role, organization } when a guardian is
// linked to this account, otherwise null. (The email-confirmation gate lives in
// the RPC — an unconfirmed email links nothing, so the read below finds nothing.)
export async function autoLinkGuardian(user) {
  if (!user?.id) return null;

  const { data: guardian, error: gErr } = await supabase
    .from('guardians')
    .select('org_id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (gErr) { console.error('autoLinkGuardian read:', gErr.message); return null; }
  if (!guardian) return null; // no guardian linked to this account by the RPC

  const { error: insErr } = await supabase
    .from('user_roles')
    .insert({ user_id: user.id, organization_id: guardian.org_id, role: 'parent' });
  if (insErr) { console.error('autoLinkGuardian insert:', insErr.message); return null; }

  const { data: organization, error: orgErr } = await supabase
    .from('organizations')
    .select('id, name, slug, logo_url, brand_colors')
    .eq('id', guardian.org_id)
    .single();
  if (orgErr) console.error('[autoLinkGuardian] organization:', orgErr.message);

  return { role: 'parent', organization: organization ?? null };
}
