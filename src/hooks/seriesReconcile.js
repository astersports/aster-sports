import { supabase } from '../lib/supabase';

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
  const cursor = new Date(`${startDate}T00:00:00`);
  cursor.setDate(cursor.getDate() + step);
  const bound = new Date(`${newUntil}T00:00:00`);
  const newRows = [];
  while (cursor <= bound && newRows.length < 100) {
    const d = cursor.toISOString().slice(0, 10);
    const sAt = new Date(`${d}T${formData.startTime}`);
    const eAt = new Date(`${d}T${formData.endTime}`);
    if (eAt <= sAt) eAt.setDate(eAt.getDate() + 1);
    newRows.push({ ...row, start_at: sAt.toISOString(), end_at: eAt.toISOString(), parent_event_id: seriesId });
    cursor.setDate(cursor.getDate() + step);
  }
  if (newRows.length > 0) {
    await supabase.from('events').insert(newRows);
  }
}
