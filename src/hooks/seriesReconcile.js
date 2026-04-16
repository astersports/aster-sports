import { supabase } from '../lib/supabase';

// Grow or shrink a recurring series to match formData.recurrence.until.
// Called by useUpdateActivity.updateSeries after the events-row update.
// New siblings inherit the edited event's times (formData.startTime /
// endTime); existing-row fields come from `row` (buildRow output minus
// start_at/end_at). Pattern changes (weekly ↔ biweekly) and conversion
// between once/recurring are NOT handled — that's follow-up work.
export async function reconcileSeries({ seriesId, formData, row }) {
  const newUntil = formData.recurrence?.until;
  const pattern = formData.recurrence?.pattern;
  if (!newUntil || pattern === 'once') return;

  const { data: sibs } = await supabase.from('events')
    .select('id, start_at')
    .eq('parent_event_id', seriesId)
    .order('start_at', { ascending: true });
  if (!sibs || sibs.length === 0) return;

  const lastDate = sibs[sibs.length - 1].start_at.slice(0, 10);

  if (newUntil < lastDate) {
    const toDelete = sibs.filter((s) => s.start_at.slice(0, 10) > newUntil).map((s) => s.id);
    if (toDelete.length > 0) {
      await supabase.from('events').delete().in('id', toDelete);
    }
  } else if (newUntil > lastDate) {
    const step = pattern === 'biweekly' ? 14 : 7;
    const cursor = new Date(`${lastDate}T00:00:00`);
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
}
