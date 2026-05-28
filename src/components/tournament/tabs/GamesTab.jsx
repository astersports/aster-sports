import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { formatTime } from '../../../lib/formatters';
import LoadingSkeleton from '../../shared/LoadingSkeleton';

export default function GamesTab({ tournament, teamFilter }) {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tournament?.id) return;
    let cancelled = false;
    (async () => {
      // anti-pattern #36: destructure `error` and surface it; never swallow
      // PostgREST errors into an empty data array via the `data || []`
      // fallback alone. events is FK-scoped via team_id → teams.org_id
      // (no org_id column), so the AP #37 org_id filter does NOT apply.
      const { data, error } = await supabase.from('events')
        .select('id, title, event_type, start_at, opponent, home_away, team_id, status, is_bracket_game, is_championship_final, is_bonus_game, is_scrimmage, bracket_label, game_sequence, teams(name, team_color)')
        .eq('tournament_id', tournament.id)
        .order('start_at', { ascending: true });
      if (cancelled) return;
      if (error) console.error('GamesTab events:', error.message);
      const evts = data || [];
      setEvents(evts);
      const ids = evts.map((e) => e.id);
      if (ids.length) {
        const { data: gr, error: grErr } = await supabase.from('game_results')
          .select('event_id, result, our_score, opponent_score, published_at, quarter_scores, coach_highlight')
          .in('event_id', ids).not('published_at', 'is', null);
        if (!cancelled) {
          if (grErr) console.error('GamesTab results:', grErr.message);
          const map = {};
          (gr || []).forEach((r) => { map[r.event_id] = r; });
          setResults(map);
        }
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [tournament?.id]);

  const filtered = useMemo(() => {
    if (!teamFilter) return events;
    return events.filter((e) => e.team_id === teamFilter);
  }, [events, teamFilter]);

  const { poolGames, bracketGames, bonusGames } = useMemo(() => {
    const pool = [], bracket = [], bonus = [];
    for (const e of filtered) {
      if (e.is_bonus_game || e.is_scrimmage) bonus.push(e);
      else if (e.is_bracket_game || e.is_championship_final) bracket.push(e);
      else pool.push(e);
    }
    return { poolGames: pool, bracketGames: bracket, bonusGames: bonus };
  }, [filtered]);

  const grouped = (evts) => {
    const map = new Map();
    for (const e of evts) {
      const d = new Date(e.start_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/New_York' });
      if (!map.has(d)) map.set(d, []);
      map.get(d).push(e);
    }
    return [...map.entries()];
  };

  if (loading) return <LoadingSkeleton variant="card" count={3} />;
  if (filtered.length === 0) return <div style={{ padding: 32, textAlign: 'center', color: 'var(--em-text-tertiary)', fontSize: 14 }}>No games for this tournament{teamFilter ? ' on the selected team' : ''}.</div>;

  return (
    <div>
      {poolGames.length > 0 && (
        <Section label="Pool Play" events={poolGames} results={results} grouped={grouped} navigate={navigate} />
      )}
      {bracketGames.length > 0 && (
        <Section label="Playoffs" events={bracketGames} results={results} grouped={grouped} navigate={navigate} isPlayoff />
      )}
      {bonusGames.length > 0 && (
        <Section label="Bonus Games" events={bonusGames} results={results} grouped={grouped} navigate={navigate} isBonus />
      )}
    </div>
  );
}

function Section({ label, events, results, grouped, navigate, isPlayoff, isBonus }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: isPlayoff ? 'var(--em-accent)' : isBonus ? 'var(--em-text-tertiary)' : 'var(--em-text-tertiary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
        {isPlayoff && <Trophy size={12} strokeWidth={2} />}
        {label} ({events.length})
      </div>
      {grouped(events).map(([date, evts]) => (
        <div key={date} style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--em-text-tertiary)', marginBottom: 4 }}>{date}</div>
          {evts.map((e) => <GameRow key={e.id} event={e} result={results[e.id]} navigate={navigate} isBonus={isBonus} />)}
        </div>
      ))}
    </div>
  );
}

function GameRow({ event: e, result: r, navigate, isBonus }) {
  const teamColor = e.teams?.team_color || 'var(--em-neutral)';
  const isChampionship = e.is_championship_final;
  const borderColor = isChampionship ? '#FFD700' : teamColor;
  return (
    <button type="button" onClick={() => navigate(`/events/${e.id}`)} className="em-press"
      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', marginBottom: 6, backgroundColor: isChampionship ? 'rgba(255,215,0,0.06)' : 'var(--em-bg-card)', borderRadius: 10, border: `1px solid ${isChampionship ? 'rgba(255,215,0,0.3)' : 'var(--em-border-default)'}`, borderLeft: `4px solid ${borderColor}`, textAlign: 'left', fontFamily: 'inherit', cursor: 'pointer', opacity: isBonus ? 0.7 : 1 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isChampionship && <Trophy size={14} strokeWidth={2} color="#FFD700" />}
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--em-text-primary)' }}>{formatTime(e.start_at)} · {e.teams?.name || ''}</span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--em-text-secondary)', marginTop: 2 }}>
          {e.home_away === 'away' ? '@ ' : 'vs. '}{e.opponent || e.title || 'TBD'}
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
          {e.bracket_label && <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4, backgroundColor: isChampionship ? 'rgba(255,215,0,0.15)' : 'var(--em-bg-secondary)', color: isChampionship ? '#B8860B' : 'var(--em-text-secondary)' }}>{e.bracket_label}</span>}
          {isBonus && <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4, backgroundColor: 'var(--em-neutral-soft)', color: 'var(--em-neutral)' }}>Bonus</span>}
          {e.is_scrimmage && <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4, backgroundColor: 'var(--em-neutral-soft)', color: 'var(--em-neutral)' }}>Scrimmage</span>}
        </div>
      </div>
      {r && (
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: r.result === 'W' ? 'var(--em-success)' : r.result === 'L' ? 'var(--em-danger)' : 'var(--em-text-secondary)' }}>
            {r.result} {r.our_score}-{r.opponent_score}
          </div>
          {r.coach_highlight && <div style={{ fontSize: 11, color: 'var(--em-text-tertiary)', marginTop: 2, maxWidth: 140 }}>{r.coach_highlight}</div>}
        </div>
      )}
    </button>
  );
}
