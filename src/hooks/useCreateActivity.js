import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { computeDefaultUntil } from '../lib/recurrenceHelpers';
import { buildTitle } from '../lib/constants';
import { expandDates, withTime } from './createActivityHelpers';

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
        status: 'scheduled',
      };

      const pattern = formData.recurrence?.pattern || 'once';
      // Safety net: if UI didn't set a recurrence.until, fetch season
      // end via team → season and default to last-weekday-before-end.
      let safeForm = formData;
      if (pattern !== 'once' && !formData.recurrence?.until && formData.teamId && formData.date) {
        const { data: team, error: teamErr } = await supabase.from('teams').select('season_id').eq('id', formData.teamId).single();
        if (teamErr) throw teamErr;
        let season = null;
        if (team?.season_id) {
          // Read base `programs` (every program_type), not the `seasons` VIEW
          // (programs WHERE program_type='season'). A team under a camp/clinic/
          // tryout program has season_id → a non-season programs.id absent from
          // the view; .single() there throws PGRST116 and aborts ALL event
          // creation for that team. .maybeSingle() degrades to no-end-date
          // (computeDefaultUntil falls back to its iteration cap).
          const { data: seasonRow, error: seasonErr } = await supabase.from('programs').select('end_date').eq('id', team.season_id).maybeSingle();
          if (seasonErr) throw seasonErr;
          season = seasonRow;
        }
        const until = computeDefaultUntil(formData.date, pattern, season?.end_date);
        safeForm = { ...formData, recurrence: { pattern, until } };
      }
      const dates = expandDates(safeForm, pattern);

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
        // Self-reference the parent so the repeat icon fires on every
        // event in the series (including the first). Siblings already
        // carry parent_event_id = first.id; this closes the loop.
        await supabase.from('events').update({ parent_event_id: first.id }).eq('id', first.id);
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
          if (dErr) throw new Error(`Volunteers failed to save: ${dErr.message}`);
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

