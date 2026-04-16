import { useState } from 'react';
import { supabase } from '../lib/supabase';

export function useUpdateActivity() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Full row builder shared between single and series updates.
  const buildRow = (formData) => {
    // See useCreateActivity.withTime for the local-time contract.
    const startAt = new Date(`${formData.date}T${formData.startTime}`);
    const endAt = new Date(`${formData.date}T${formData.endTime}`);
    // Midnight-crossover: if end is earlier than start, bump end one day.
    if (endAt <= startAt) endAt.setDate(endAt.getDate() + 1);
    return {
      team_id: formData.teamId,
      event_type: formData.eventType,
      title: formData.title || buildTitle(formData.eventType, formData.opponent),
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
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
    };
  };

  const update = async (eventId, formData) => {
    setLoading(true); setError(null);
    try {
      const { data, error: err } = await supabase
        .from('events').update(buildRow(formData)).eq('id', eventId).select().single();
      if (err) throw err;
      return data;
    } catch (err) {
      console.error('Update event failed:', err.message, err);
      setError(err.message);
      return null;
    }
    finally { setLoading(false); }
  };

  // Updates this event and all siblings in the same recurring series
  // (sharing the same parent_event_id) whose start_at is >= the current
  // event's start_at. Excludes date/time so each instance keeps its
  // own schedule; only location, notes, duties, toggles etc. propagate.
  const updateSeries = async (eventId, parentEventId, startAt, formData) => {
    setLoading(true); setError(null);
    try {
      const row = buildRow(formData);
      delete row.start_at; delete row.end_at;
      const seriesId = parentEventId || eventId;
      const parentUp = await supabase.from('events').update(row)
        .eq('id', seriesId).gte('start_at', startAt);
      if (parentUp.error) throw parentUp.error;
      const sibUp = await supabase.from('events').update(row)
        .eq('parent_event_id', seriesId).gte('start_at', startAt);
      if (sibUp.error) throw sibUp.error;
      return true;
    } catch (err) {
      console.error('Update series failed:', err.message, err);
      setError(err.message);
      return null;
    }
    finally { setLoading(false); }
  };

  return { update, updateSeries, loading, error };
}

function buildTitle(type, opponent) {
  if ((type === 'game' || type === 'tournament') && opponent) return `vs. ${opponent}`;
  const labels = { practice: 'Practice', game: 'Game', skills_lab: 'Skills Lab', tryout: 'Tryout', tournament: 'Tournament', other: 'Event' };
  return labels[type] || 'Event';
}
