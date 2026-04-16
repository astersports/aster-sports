import { useState } from 'react';
import { supabase } from '../lib/supabase';

export function useCreateActivity() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const create = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const baseRow = {
        team_id: formData.teamId,
        event_type: formData.eventType,
        title: formData.title || buildTitle(formData.eventType, formData.opponent),
        location: formData.location || null,
        location_address: formData.locationAddress || null,
        sub_location: formData.subLocation || null,
        opponent: formData.opponent || null,
        home_away: formData.homeAway || 'tbd',
        is_scrimmage: formData.isScrimmage || false,
        notes: formData.notes || null,
        coach_notes: formData.coachNotes || null,
        jersey: formData.jersey || null,
        indoor: formData.indoor ?? true,
        enable_rides: formData.enableRides || false,
        arrival_minutes_before: formData.arrivalMinutes || 15,
        status: 'scheduled',
      };

      const pattern = formData.recurrence?.pattern || 'once';
      const dates = expandDates(formData, pattern);

      // Insert the first event alone so we can reference its ID as
      // parent_event_id on any recurring siblings.
      const firstRow = withTime(baseRow, dates[0], formData);
      const { data: first, error: firstErr } = await supabase
        .from('events').insert(firstRow).select().single();
      if (firstErr) throw firstErr;

      const createdIds = [first.id];
      if (dates.length > 1) {
        const siblings = dates.slice(1).map((d) => ({
          ...withTime(baseRow, d, formData),
          parent_event_id: first.id,
        }));
        const { data: sibData, error: sibErr } = await supabase
          .from('events').insert(siblings).select('id');
        if (sibErr) throw sibErr;
        (sibData || []).forEach((r) => createdIds.push(r.id));
      }

      // Fan out duty slots across every created event. One row per slot
      // (a "Scorekeeper x 2" duty becomes 2 event_duties rows with the
      // same duty_name). Schema uses `duty_name` not `name`.
      const duties = (formData.duties || []).filter((d) => d.duty_name?.trim() || d.name?.trim());
      if (duties.length > 0) {
        const dutyRows = [];
        createdIds.forEach((eid) => {
          duties.forEach((d) => {
            const label = (d.duty_name || d.name).trim();
            for (let i = 0; i < (d.slots_needed || 1); i++) {
              dutyRows.push({ event_id: eid, duty_name: label });
            }
          });
        });
        if (dutyRows.length > 0) {
          const { error: dErr } = await supabase.from('event_duties').insert(dutyRows);
          if (dErr) console.error('event_duties insert:', dErr.message);
        }
      }

      return { data: first };
    } catch (err) {
      console.error('Create event failed:', err.message, err);
      setError(err.message);
      return { error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return { create, loading, error };
}

// Builds the ISO-string start_at / end_at for a specific date, holding
// the HH:MM constant. Called once per recurring instance.
function withTime(row, date, formData) {
  // new Date('YYYY-MM-DDTHH:MM') is interpreted as LOCAL time per the
  // ECMA-262 Date Time String Format; .toISOString() then converts to
  // UTC for storage. Do not append 'Z' or an offset — that would force
  // UTC parsing and shift events by the user's timezone.
  const startDate = new Date(`${date}T${formData.startTime}`);
  const endDate = new Date(`${date}T${formData.endTime}`);
  // Late-night events (e.g. start 22:00 → end 01:03) cross midnight;
  // bump the end date forward a day so end_at > start_at.
  if (endDate <= startDate) endDate.setDate(endDate.getDate() + 1);
  return {
    ...row,
    start_at: startDate.toISOString(),
    end_at: endDate.toISOString(),
  };
}

// Returns an array of YYYY-MM-DD strings. For 'once' it's [startDate];
// for weekly/biweekly it steps by 7 or 14 days up to (and including)
// the `until` date, capped at 100 to avoid runaway loops.
function expandDates(formData, pattern) {
  const startDate = formData.date;
  if (pattern === 'once') return [startDate];
  const step = pattern === 'weekly' ? 7 : 14;
  const until = formData.recurrence?.until
    ? new Date(`${formData.recurrence.until}T00:00:00`)
    : null;
  const out = [];
  const cursor = new Date(`${startDate}T00:00:00`);
  while ((!until || cursor <= until) && out.length < 100) {
    out.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + step);
  }
  return out;
}

function buildTitle(type, opponent) {
  if ((type === 'game' || type === 'tournament') && opponent) return `vs. ${opponent}`;
  const labels = { practice: 'Practice', game: 'Game', skills_lab: 'Skills Lab', tryout: 'Tryout', tournament: 'Tournament', other: 'Event' };
  return labels[type] || 'Event';
}
