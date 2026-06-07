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
// Case-INSENSITIVE (.ilike): slugs are normalized to lowercase on write, but an
// older mixed-case row must still collide. (slugified slugs are [a-z0-9-] only,
// so .ilike carries no wildcard chars.) Returns null when free, message if taken.
export async function checkSlugAvailable(client, orgId, slug) {
  if (!slug) return null;
  const { data, error } = await client
    .from('programs').select('id').eq('org_id', orgId).ilike('public_slug', slug).limit(1);
  if (error) return error.message;
  return data && data.length ? 'That public link is already taken. Pick another.' : null;
}

// Logical date guards shared by program create + edit. Returns the first
// violation as a kindness message (§16.3), or null when consistent. start/end
// are 'YYYY-MM-DD'; reg_* are datetime-local 'YYYY-MM-DDTHH:MM' (compare the
// date portion of reg_closes against end_date).
export function validateProgramDates({ start_date, end_date, reg_opens_at, reg_closes_at } = {}) {
  if (start_date && end_date && end_date < start_date) {
    return "End date can't be before the start date.";
  }
  if (reg_opens_at && reg_closes_at && reg_opens_at > reg_closes_at) {
    return "Registration can't close before it opens.";
  }
  if (end_date && reg_closes_at && reg_closes_at.slice(0, 10) > end_date) {
    return "Registration can't close after the program ends.";
  }
  return null;
}

// Registration windows are picked at day granularity; store the implied
// boundary time so opens = start-of-day (midnight) and closes = end-of-day
// (inclusive of the close date). Pass a 'YYYY-MM-DD' string; returns a
// timestamp string or null.
export function dayBoundaryTs(dateStr, edge) {
  if (!dateStr) return null;
  return `${dateStr}T${edge === 'close' ? '23:59:59' : '00:00:00'}`;
}
