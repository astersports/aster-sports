import { supabase } from '../lib/supabase';

// Reconcile an event's volunteer slots (event_duties) to match the wizard's
// edited duty list. Sections L99 audit P0-2: the single-event update() path
// previously blind-INSERTed the full duty set on every edit, so each save
// DOUBLED the rows (Scorekeeper ×2 → ×4 → ×6). This reconciles by diff and
// — critically — never deletes a CLAIMED slot (a parent already signed up),
// so re-saving an event with claimed volunteers is safe and idempotent.
export async function reconcileEventDuties(eventId, formDuties) {
  const desired = (formDuties || [])
    .filter((d) => (d.duty_name || d.name || '').trim())
    .map((d) => ({ name: (d.duty_name || d.name).trim(), slots: Math.max(1, d.slots_needed || 1) }));

  const { data: existing, error } = await supabase
    .from('event_duties')
    .select('id, duty_name, claimed_by_name, guardian_id')
    .eq('event_id', eventId);
  if (error) throw error;

  const byName = {};
  (existing || []).forEach((r) => { (byName[r.duty_name] ||= []).push(r); });
  const isClaimed = (r) => !!(r.claimed_by_name || r.guardian_id);

  const toDelete = [];
  const toInsert = [];
  const desiredNames = new Set(desired.map((d) => d.name));

  desired.forEach(({ name, slots }) => {
    const rows = byName[name] || [];
    const claimed = rows.filter(isClaimed);
    const unclaimed = rows.filter((r) => !isClaimed(r));
    // Floor the kept count at the claimed count — never drop a claimed slot.
    const keep = Math.max(slots, claimed.length);
    const keepUnclaimed = unclaimed.slice(0, Math.max(0, keep - claimed.length));
    unclaimed.slice(keepUnclaimed.length).forEach((r) => toDelete.push(r.id));
    const have = claimed.length + keepUnclaimed.length;
    for (let i = have; i < keep; i++) toInsert.push({ event_id: eventId, duty_name: name });
  });

  // Duties removed entirely in the editor: delete all their rows.
  Object.keys(byName).forEach((name) => {
    if (!desiredNames.has(name)) byName[name].forEach((r) => toDelete.push(r.id));
  });

  if (toDelete.length) {
    const { error: dErr } = await supabase.from('event_duties').delete().in('id', toDelete);
    if (dErr) throw dErr;
  }
  if (toInsert.length) {
    const { error: iErr } = await supabase.from('event_duties').insert(toInsert);
    if (iErr) throw new Error(`Volunteers failed to save: ${iErr.message}`);
  }
}
