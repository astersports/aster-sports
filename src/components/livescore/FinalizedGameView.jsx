import { useState } from 'react';
import { Trophy } from 'lucide-react';
import { useGameDetail } from './useGameDetail';
import { useRoster } from '../../hooks/useRoster';
import { useAuth } from '../../context/AuthContext';
import { isStaff } from '../../lib/permissions';
import LoadingSkeleton from '../shared/LoadingSkeleton';
import GameBoxScore from './GameBoxScore';
import PlayByPlayFeed from './PlayByPlayFeed';

export default function FinalizedGameView({ event }) {
  const { role } = useAuth();
  const { result, plays, playerStats, quarterScores, loading, update } = useGameDetail(event.id);
  const { players } = useRoster(event.team_id);
  const [showPlays, setShowPlays] = useState(false);
  const [highlight, setHighlight] = useState('');
  const staff = isStaff(role);
  const teamColor = event.teams?.team_color || 'var(--em-accent)';

  if (loading) return <div style={{ padding: 16 }}><LoadingSkeleton variant="card" count={2} /></div>;
  if (!result?.published_at) return null;

  const diff = result.our_score - result.opponent_score;
  const potg = result.player_of_game_id ? players.find((p) => p.id === result.player_of_game_id) : null;
  const potgStats = potg ? playerStats[potg.id] : null;
  const dt = new Date(event.start_at);
  const dateStr = dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/New_York' });
  const qKeys = Object.keys(quarterScores).sort((a, b) => a - b);
  const needsCapture = staff && (!result.player_of_game_id || !result.coach_highlight);

  return (
    <div style={{ padding: '0 16px 24px' }}>
      <div style={{ padding: 20, borderRadius: 10, backgroundColor: teamColor, textAlign: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--em-text-inverse)', fontFamily: "'Barlow Condensed', sans-serif" }}>
          {result.our_score} — {result.opponent_score}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 4 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--em-text-inverse)', backgroundColor: 'rgba(255,255,255,0.2)', padding: '2px 10px', borderRadius: 6 }}>{result.result}</span>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--em-text-inverse)', opacity: 0.8 }}>+{Math.abs(diff)}</span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--em-text-inverse)', opacity: 0.7, marginTop: 8 }}>
          vs. {event.opponent || 'Opponent'} · {dateStr} · {event.location || ''} · {event.home_away === 'home' ? 'HOME' : event.home_away === 'away' ? 'AWAY' : ''}
        </div>
      </div>

      {qKeys.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 16, fontSize: 13, color: 'var(--em-text-secondary)' }}>
          {qKeys.map((k) => <span key={k} style={{ fontWeight: 600 }}>H{k} {quarterScores[k].us}-{quarterScores[k].them}</span>)}
        </div>
      )}

      {needsCapture && (
        <div style={{ padding: 14, borderRadius: 10, border: '1px dashed var(--em-accent)', backgroundColor: 'var(--em-accent-soft)', marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--em-accent)', marginBottom: 8 }}>Capture This Game</div>
          {!result.player_of_game_id && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 13, color: 'var(--em-text-secondary)', marginBottom: 4 }}>Player of the Game</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {players.filter((p) => playerStats[p.id]).map((p) => (
                  <button key={p.id} type="button" onClick={() => update({ player_of_game_id: p.id })} className="sf-press"
                    style={{ minHeight: 36, padding: '0 10px', borderRadius: 8, border: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)', fontSize: 13, fontWeight: 500, color: 'var(--em-text-primary)', cursor: 'pointer', fontFamily: 'inherit' }}>
                    {p.first_name} #{p.jersey_number || '—'}
                  </button>
                ))}
              </div>
            </div>
          )}
          {!result.coach_highlight && (
            <div>
              <div style={{ fontSize: 13, color: 'var(--em-text-secondary)', marginBottom: 4 }}>Coach Highlight</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input type="text" value={highlight} onChange={(e) => setHighlight(e.target.value)} maxLength={140} placeholder="One line for parents..." style={{ flex: 1, minHeight: 36, padding: '0 10px', borderRadius: 8, border: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)', fontSize: 14, fontFamily: 'inherit', color: 'var(--em-text-primary)' }} />
                <button type="button" onClick={() => { if (highlight.trim()) update({ coach_highlight: highlight.trim() }); }} className="sf-press" style={{ minHeight: 36, padding: '0 12px', borderRadius: 8, border: 'none', backgroundColor: 'var(--em-accent)', color: 'var(--em-text-inverse)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Save</button>
              </div>
            </div>
          )}
        </div>
      )}

      {potg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 10, backgroundColor: 'var(--em-bg-card)', border: '1px solid var(--em-border-default)', marginBottom: 16 }}>
          <Trophy size={20} strokeWidth={1.75} color="#FFD700" />
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--em-text-primary)' }}>{potg.first_name} {potg.last_name} #{potg.jersey_number || ''}</div>
            {potgStats && <div style={{ fontSize: 13, color: 'var(--em-text-secondary)' }}>{potgStats.pts} pts · {potgStats.fgm}/{potgStats.fga} FG{potgStats.blk ? ` · ${potgStats.blk} BLK` : ''}{potgStats.reb ? ` · ${potgStats.reb} REB` : ''}</div>}
          </div>
        </div>
      )}

      {result.coach_highlight && (
        <div style={{ padding: 14, borderRadius: 10, backgroundColor: 'var(--em-bg-card)', border: '1px solid var(--em-border-default)', marginBottom: 16, fontSize: 15, color: 'var(--em-text-primary)', fontStyle: 'italic', lineHeight: 1.5 }}>
          "{result.coach_highlight}"
        </div>
      )}

      <GameBoxScore playerStats={playerStats} players={players} />

      <button type="button" onClick={() => setShowPlays((v) => !v)} className="sf-press"
        style={{ width: '100%', minHeight: 44, marginTop: 16, borderRadius: 10, border: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)', color: 'var(--em-text-secondary)', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
        {showPlays ? 'Hide plays' : `View ${plays.length} plays`}
      </button>
      {showPlays && <PlayByPlayFeed plays={plays} players={players} />}
    </div>
  );
}
