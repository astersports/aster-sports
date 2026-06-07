// Pure decision helpers for admin program create (PR-1). No supabase import at
// module top (AP#27) so these are unit-testable without the client singleton —
// checkSlugAvailable takes the client as an injected argument instead.

import { programRule } from './programRegistry';

export function slugify(s) {
  return (s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// Status default on create — reads the registry (Fork 1): camp/clinic go live
// ('active'); season/tryout/evaluation/interest_list/other are born 'draft'
// (pre-launch), promoted via activate(). The old "season -> archived" guard is
// replaced by draft-on-create + the single-active-season DB index.
export function statusForProgramType(type) {
  return programRule(type).defaultStatus;
}

// Divisions + per-division fees are season-only — reads the registry
// (hasDivisions). Non-season programs bill a flat fee later (Phase-2 enrollment).
export function divisionsApplyTo(type) {
  return programRule(type).hasDivisions;
}

// App-level public_slug uniqueness on (org_id, slug) — the DB has no unique
// constraint (F3), so two programs could otherwise resolve the same /r/<slug>.
// Case-INSENSITIVE (.ilike): slugs are normalized to lowercase on write, but an
// older mixed-case row must still collide. (slugified slugs are [a-z0-9-] only,
// so .ilike carries no wildcard chars.) Pass excludeId on EDIT so a program
// doesn't collide with itself. Returns null when free, message if taken.
export async function checkSlugAvailable(client, orgId, slug, excludeId = null) {
  if (!slug) return null;
  let q = client.from('programs').select('id').eq('org_id', orgId).ilike('public_slug', slug);
  if (excludeId) q = q.neq('id', excludeId);
  const { data, error } = await q.limit(1);
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
