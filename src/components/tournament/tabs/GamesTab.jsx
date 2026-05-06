import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { formatTime } from '../../../lib/formatters';
import LoadingSkeleton from '../../shared/LoadingSkeleton';

export default function GamesTab({ tournament }) {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tournament?.id) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from('events')
        .select('id, title, event_type, start_at, opponent, home_away, team_id, status, teams(name, team_color)')
        .eq('tournament_id', tournament.id)
        .order('start_at', { ascending: true });
      if (cancelled) return;
      const evts = data || [];
      setEvents(evts);
      const ids = evts.map((e) => e.id);
      if (ids.length) {
        const { data: gr } = await supabase.from('game_results')
          .select('event_id, result, our_score, opponent_score, published_at')
          .in('event_id', ids).not('published_at', 'is', null);
        if (!cancelled) {
          const map = {};
          (gr || []).forEach((r) => { map[r.event_id] = r; });
          setResults(map);
        }
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [tournament?.id]);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const e of events) {
      const d = new Date(e.start_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/New_York' });
      if (!map.has(d)) map.set(d, []);
      map.get(d).push(e);
    }
    return [...map.entries()];
  }, [events]);

  if (loading) return <LoadingSkeleton variant="card" count={3} />;
  if (events.length === 0) return <div style={{ padding: 32, textAlign: 'center', color: 'var(--em-text-tertiary)', fontSize: 14 }}>No games scheduled for this tournament yet.</div>;

  return (
    <div>
      {grouped.map(([date, evts]) => (
        <div key={date} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--em-text-tertiary)', marginBottom: 6 }}>{date}</div>
          {evts.map((e) => {
            const r = results[e.id];
            const teamColor = e.teams?.team_color || 'var(--em-neutral)';
            return (
              <button key={e.id} type="button" onClick={() => navigate(`/events/${e.id}`)} className="sf-press"
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', marginBottom: 6, backgroundColor: 'var(--em-bg-card)', borderRadius: 10, border: '1px solid var(--em-border-default)', textAlign: 'left', fontFamily: 'inherit', cursor: 'pointer' }}>
                <div style={{ width: 4, alignSelf: 'stretch', borderRadius: 2, backgroundColor: teamColor }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--em-text-primary)' }}>{formatTime(e.start_at)} · {e.teams?.name || ''}</div>
                  <div style={{ fontSize: 13, color: 'var(--em-text-secondary)', marginTop: 2 }}>{e.home_away === 'away' ? '@ ' : 'vs. '}{e.opponent || e.title || 'TBD'}</div>
                </div>
                {r && (
                  <div style={{ fontSize: 15, fontWeight: 700, color: r.result === 'W' ? 'var(--em-success)' : r.result === 'L' ? 'var(--em-danger)' : 'var(--em-text-secondary)' }}>
                    {r.result} {r.our_score}-{r.opponent_score}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
