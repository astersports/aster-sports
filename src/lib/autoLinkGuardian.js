import { supabase } from './supabase';

// First-login hook for parent accounts. If a guardians row has a matching
// email and no linked user_id, claim it for the authed user and insert the
// matching user_roles row so subsequent logins use the normal membership
// path. Returns { role, organization } when linked, otherwise null.
export async function autoLinkGuardian(user) {
  const email = user?.email?.trim().toLowerCase();
  if (!email || !user?.id) return null;
  // Refuse to claim a guardian row for an unverified email — prevents
  // a hostile signup from hijacking another family's account by registering
  // an auth user with their email before they confirm.
  if (!user.email_confirmed_at) return null;

  const { data: guardian, error: gErr } = await supabase
    .from('guardians')
    .select('id, org_id')
    .ilike('email', email)
    .is('user_id', null)
    .maybeSingle();
  if (gErr || !guardian) return null;

  const { error: updErr } = await supabase
    .from('guardians')
    .update({ user_id: user.id })
    .eq('id', guardian.id);
  if (updErr) { console.error('autoLinkGuardian update:', updErr.message); return null; }

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
