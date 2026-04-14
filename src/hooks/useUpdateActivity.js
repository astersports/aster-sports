import { useState } from 'react';
import { supabase } from '../lib/supabase';

export function useUpdateActivity() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const update = async (eventId, formData) => {
    setLoading(true);
    setError(null);
    try {
      const startAt = new Date(`${formData.date}T${formData.startTime}`);
      const endAt = new Date(`${formData.date}T${formData.endTime}`);
      const row = {
        team_id: formData.teamId,
        event_type: formData.eventType,
        title: formData.title || buildTitle(formData.eventType, formData.opponent),
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        location: formData.location || null,
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

      const { data, error: err } = await supabase
        .from('events').update(row).eq('id', eventId).select().single();
      if (err) throw err;
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { update, loading, error };
}

function buildTitle(type, opponent) {
  if ((type === 'game' || type === 'tournament') && opponent) return `vs. ${opponent}`;
  const labels = { practice: 'Practice', game: 'Game', skills_lab: 'Skills Lab', tryout: 'Tryout', tournament: 'Tournament', other: 'Event' };
  return labels[type] || 'Event';
}
