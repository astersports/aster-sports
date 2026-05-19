import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

// §4.C Sprint D — ACTION QUEUE signal: unpublished Quick Scores.
// Triggers per HOME_DESIGN_SPEC §2.1.3: game_results rows with
// published_at IS NULL on coach's teams. Coach taps to review +
// publish via Quick Score UI on the event detail page.
//
// Output shape matches ActionZone's signal-agnostic contract.
// secondary line shows "{our_score}-{opponent_score} · entered Xh ago"
// so the coach has enough at a glance to decide if it's worth a tap.
//
// Per anti-pattern #36 (data + error destructured) + #37 (team_id
// scope via events!inner join chain — same pattern as useOrgTeamRecords
// per PR #239).

export function useUnpublishedScores(coachedTeamIds) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const teamIds = useMemo(() => (coachedTeamIds || []).filter(Boolean), [coachedTeamIds]);

  const refetch = useCallback(async () => {
    if (!teamIds.length) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: e } = await supabase
      .from('game_results')
      .select('id, event_id, our_score, opponent_score, result, entered_at, events!inner(team_id, opponent, title, start_at, teams!inner(id, name, team_color))')
      .is('published_at', null)
      .in('events.team_id', teamIds)
      .order('entered_at', { ascending: false });
    if (e) {
      console.error('useUnpublishedScores fetch:', e.message);
      setError(e.message);
      setItems([]);
      setLoading(false);
      return;
    }
    const mapped = (data || []).map((r) => {
      const teamName = r.events?.teams?.name || 'Team';
      const opponent = r.events?.opponent || '';
      const titleBit = opponent ? `vs ${opponent}` : (r.events?.title || 'Game');
      const scoreBit = (typeof r.our_score === 'number' && typeof r.opponent_score === 'number')
        ? `${r.our_score}-${r.opponent_score}`
        : 'Score pending';
      return {
        kind: 'score_unpublished',
        primary: `${teamName}: ${titleBit}`,
        secondary: `${scoreBit} · awaiting publish`,
        href: `/events/${r.event_id}`,
        id: r.id,
        team_color: r.events?.teams?.team_color || 'var(--em-warning)',
        team_name: teamName,
        event_id: r.event_id,
        start_at: r.events?.start_at,
      };
    });
    setError(null);
    setItems(mapped);
    setLoading(false);
  }, [teamIds]);

  useEffect(() => { Promise.resolve().then(refetch); }, [refetch]);

  return { items, loading, error, refetch };
}
