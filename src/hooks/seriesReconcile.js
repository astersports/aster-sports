import { supabase } from '../lib/supabase';

// Generate sibling date rows from (startDate + step) to until.
function buildSiblingRows(startDate, until, step, row, parentId, formData) {
  const cursor = new Date(`${startDate}T00:00:00`);
  cursor.setDate(cursor.getDate() + step);
  const bound = new Date(`${until}T00:00:00`);
  const rows = [];
  while (cursor <= bound && rows.length < 100) {
    const d = cursor.toISOString().slice(0, 10);
    const sAt = new Date(`${d}T${formData.startTime}`);
    const eAt = new Date(`${d}T${formData.endTime}`);
    if (eAt <= sAt) eAt.setDate(eAt.getDate() + 1);
    rows.push({ ...row, start_at: sAt.toISOString(), end_at: eAt.toISOString(), parent_event_id: parentId });
    cursor.setDate(cursor.getDate() + step);
  }
  return rows;
}

// Convert a standalone event to a recurring series.
// Called from update() when the user changes Once → Weekly/Biweekly.
export async function convertToSeries({ eventId, formData, row }) {
  const pattern = formData.recurrence?.pattern;
  const until = formData.recurrence?.until;
  if (!pattern || pattern === 'once' || !until || !formData.date) return;

  // Self-reference so the repeat icon shows on the original event too.
  await supabase.from('events').update({ parent_event_id: eventId }).eq('id', eventId);

  const step = pattern === 'biweekly' ? 14 : 7;
  const baseRow = { ...row };
  delete baseRow.start_at; delete baseRow.end_at;
  const newRows = buildSiblingRows(formData.date, until, step, baseRow, eventId, formData);
  if (newRows.length === 0) return;

  const { data: sibData, error: sibErr } = await supabase.from('events').insert(newRows).select('id');
  if (sibErr) throw sibErr;

  // Copy duties to each sibling (same pattern as useCreateActivity).
  const duties = (formData.duties || []).filter((d) => d.duty_name?.trim() || d.name?.trim());
  if (duties.length > 0) {
    const dutyRows = [];
    (sibData || []).forEach((s) => {
      duties.forEach((d) => {
        const label = (d.duty_name || d.name).trim();
        for (let i = 0; i < (d.slots_needed || 1); i++) dutyRows.push({ event_id: s.id, duty_name: label });
      });
    });
    if (dutyRows.length > 0) await supabase.from('event_duties').insert(dutyRows);
  }
}

// Delete future siblings and rebuild with the current pattern + until.
// Handles pattern changes (weekly ↔ biweekly), until extensions, until
// trims, and all three at once. Past siblings (before the edited event)
// are preserved. The edited event itself is always kept.
export async function reconcileSeries({ seriesId, eventId, formData, row }) {
  const newUntil = formData.recurrence?.until;
  const pattern = formData.recurrence?.pattern;
  if (!newUntil || pattern === 'once') return;

  const startDate = formData.date;
  const step = pattern === 'biweekly' ? 14 : 7;

  // Delete future siblings (on or after edited event), keeping the edited event.
  const { data: futureSibs } = await supabase.from('events')
    .select('id')
    .eq('parent_event_id', seriesId)
    .gte('start_at', `${startDate}T00:00:00`)
    .neq('id', eventId);
  if (futureSibs?.length > 0) {
    await supabase.from('events').delete().in('id', futureSibs.map((s) => s.id));
  }

  // Rebuild from (startDate + step) to newUntil with the current pattern.
  const newRows = buildSiblingRows(startDate, newUntil, step, row, seriesId, formData);
  if (newRows.length > 0) {
    await supabase.from('events').insert(newRows);
  }
}
