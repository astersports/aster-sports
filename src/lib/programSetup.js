// Pure decision helpers for admin program create (PR-1). No supabase import at
// module top (AP#27) so these are unit-testable without the client singleton —
// checkSlugAvailable takes the client as an injected argument instead.

export function slugify(s) {
  return (s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// Status default per program_type (GO D1): time-bounded offerings (camp, clinic)
// go live on create; the rest (season, tryout, evaluation, interest_list) are
// created 'archived'. Season's archived default also protects the single-active-
// season invariant — a new season must not silently become a 2nd active one (F4).
export function statusForProgramType(type) {
  return type === 'camp' || type === 'clinic' ? 'active' : 'archived';
}

// Divisions + per-division fees are season-only (GO D2). Non-season programs
// bill a flat fee later via the Phase-2 enrollment archetype; no divisions here.
export function divisionsApplyTo(type) {
  return type === 'season';
}

// App-level public_slug uniqueness on (org_id, slug) — the DB has no unique
// constraint (F3), so two programs could otherwise resolve the same /r/<slug>.
// Returns null when free, or a kindness message when taken.
export async function checkSlugAvailable(client, orgId, slug) {
  if (!slug) return null;
  const { data, error } = await client
    .from('programs').select('id').eq('org_id', orgId).eq('public_slug', slug).limit(1);
  if (error) return error.message;
  return data && data.length ? 'That public link is already taken. Pick another.' : null;
}
