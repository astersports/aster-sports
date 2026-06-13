import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { convertToSeries, reconcileSeries } from './seriesReconcile';
import { buildTitle } from '../lib/constants';

export function useUpdateActivity() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Full row builder shared between single and series updates.
  const buildRow = (formData) => {
    // See useCreateActivity.withTime for the local-time contract.
    const startAt = new Date(`${formData.date}T${formData.startTime}`);
    const endAt = new Date(`${formData.date}T${formData.endTime}`);
    if (endAt <= startAt) endAt.setDate(endAt.getDate() + 1);
    return {
      team_id: formData.teamId,
      event_type: formData.eventType,
      title: formData.title || buildTitle(formData.eventType, formData.opponent),
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
      location: formData.location || null,
      location_id: formData.locationId || null,
      location_address: formData.locationAddress || null,
      sub_location: formData.subLocation || null,
      opponent: formData.opponent || null,
      home_away: formData.homeAway || 'tbd',
      is_scrimmage: formData.isScrimmage || false,
      notes: formData.notes || null,
      tournament_name: formData.tournamentName || null,
      tournament_id: formData.tournamentId || null,
      is_bracket_game: formData.isBracketGame || false,
      is_championship_final: formData.isChampionshipFinal || false,
      is_bonus_game: formData.isBonusGame || false,
      coach_notes: formData.coachNotes || null,
      jersey: formData.jersey || null,
      indoor: formData.indoor ?? true,
      enable_rides: formData.enableRides || false,
      arrival_minutes_before: formData.arrivalMinutes ?? 5,
    };
  };

  const update = async (eventId, formData) => {
    setLoading(true); setError(null);
    try {
      const { data, error: err } = await supabase
        .from('events').update(buildRow(formData)).eq('id', eventId).select().single();
      if (err) throw err;
      const newDuties = (formData.duties || []).filter((d) => d.duty_name?.trim() || d.name?.trim());
      if (newDuties.length > 0) {
        const dutyRows = [];
        newDuties.forEach((d) => {
          const label = (d.duty_name || d.name).trim();
          for (let i = 0; i < (d.slots_needed || 1); i++) dutyRows.push({ event_id: eventId, duty_name: label });
        });
        const { error: dErr } = await supabase.from('event_duties').insert(dutyRows);
        if (dErr) throw new Error(`Volunteers failed to save: ${dErr.message}`);
      }
      const pattern = formData.recurrence?.pattern;
      if (pattern && pattern !== 'once' && !data.parent_event_id) {
        await convertToSeries({ eventId, formData, row: buildRow(formData) });
      }
      return { data };
    } catch (err) {
      console.error('Update event failed:', err.message, err);
      setError(err.message);
      return { error: err.message };
    }
    finally { setLoading(false); }
  };

  // Wave 3.8 §5.2 rebuild: scope-aware series update.
  // scope='instance' → caller should use update() instead (single event).
  // scope='this_and_future' → propagate metadata + apply (newStart - oldStart)
  //   offset to every sibling whose start_at >= the edited event's old start_at.
  //   Preserves day-of-week pattern (move Wed→Fri shifts every future Wed by +2d).
  // scope='series' → same offset math but applied to ALL siblings (no gte filter).
  // Anti-pattern fix: previously deleted row.start_at/end_at unconditionally,
  // silently no-op'ing every date/time change in series mode.
  const updateSeries = async (eventId, parentEventId, oldStartAt, formData, scope = 'this_and_future') => {
    setLoading(true); setError(null);
    try {
      const row = buildRow(formData);
      const seriesId = parentEventId || eventId;
      const newStartMs = new Date(row.start_at).getTime();
      const oldStartMs = new Date(oldStartAt).getTime();
      const offsetMs = newStartMs - oldStartMs;
      const metadataRow = { ...row };
      delete metadataRow.start_at; delete metadataRow.end_at;
      const filterStart = scope === 'series' ? null : oldStartAt;
      const siblings = await fetchSeriesRows(seriesId, filterStart);
      for (const sib of siblings) {
        const patch = { ...metadataRow };
        if (offsetMs !== 0 && sib.start_at && sib.end_at) {
          patch.start_at = new Date(new Date(sib.start_at).getTime() + offsetMs).toISOString();
          patch.end_at = new Date(new Date(sib.end_at).getTime() + offsetMs).toISOString();
        }
        const up = await supabase.from('events').update(patch).eq('id', sib.id);
        if (up.error) throw up.error;
      }
      await reconcileSeries({ seriesId, eventId, formData, row });
      return { data: true };
    } catch (err) {
      console.error('Update series failed:', err.message, err);
      setError(err.message);
      return { error: err.message };
    }
    finally { setLoading(false); }
  };

  return { update, updateSeries, loading, error };
}

async function fetchSeriesRows(seriesId, gteStartAt) {
  let parentQ = supabase.from('events').select('id,start_at,end_at').eq('id', seriesId);
  if (gteStartAt) parentQ = parentQ.gte('start_at', gteStartAt);
  let sibQ = supabase.from('events').select('id,start_at,end_at').eq('parent_event_id', seriesId);
  if (gteStartAt) sibQ = sibQ.gte('start_at', gteStartAt);
  const [parent, sib] = await Promise.all([parentQ, sibQ]);
  if (parent.error) throw parent.error;
  if (sib.error) throw sib.error;
  const seen = new Set();
  return [...(parent.data || []), ...(sib.data || [])].filter((r) => !seen.has(r.id) && seen.add(r.id));
}
