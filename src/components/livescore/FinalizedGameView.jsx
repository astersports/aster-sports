import { useState } from 'react';
import { Trophy } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useGameDetail } from './useGameDetail';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/useToast';
import { isStaff } from '../../lib/permissions';
import LoadingSkeleton from '../shared/LoadingSkeleton';
import GameBoxScore from './GameBoxScore';
import PlayByPlayFeed from './PlayByPlayFeed';

export default function FinalizedGameView({ event }) {
  const { role, user, orgId } = useAuth();
  const { showToast } = useToast();
  const { result, plays, stats, quarterScores, loading, update } = useGameDetail(event.id);
  const [showPlays, setShowPlays] = useState(false);
  const [highlight, setHighlight] = useState('');
  const staff = isStaff(role);
  const teamColor = event.teams?.team_color || 'var(--as-accent)';

  if (loading) return <div style={{ padding: 16 }}><LoadingSkeleton variant="card" count={2} /></div>;
  if (!result?.published_at) return null;

  const diff = result.our_score - result.opponent_score;
  const potgStat = result.player_of_game_id ? stats.find((s) => s.player_id === result.player_of_game_id) : null;
  const dt = new Date(event.start_at);
  const dateStr = dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/New_York' });
  const qKeys = Object.keys(quarterScores).sort((a, b) => a - b);
  const needsCapture = staff && (!result.player_of_game_id || !result.coach_highlight);

  const shareToChat = async () => {
    const msg = `${result.result === 'W' ? '🏆' : ''} Final: ${event.teams?.name || 'Us'} ${result.our_score} - ${result.opponent_score} ${event.opponent || 'Opponent'}${result.coach_highlight ? `\n\n${result.coach_highlight}` : ''}`;
    const { error } = await supabase.from('messages').insert({
      org_id: orgId, team_id: event.team_id, channel: 'chat', sender_id: user?.id, body: msg,
    });
    if (error) showToast("Couldn't share to chat. Try again?", 'error');
    else showToast('Shared to team chat!', 'success');
  };

  return (
    <div style={{ padding: '0 16px 24px' }}>
      <div style={{ padding: 20, borderRadius: 10, backgroundColor: teamColor, textAlign: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--as-text-inverse)', fontFamily: "'Barlow Condensed', sans-serif" }}>
          {result.our_score} — {result.opponent_score}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 4 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--as-text-inverse)', backgroundColor: 'rgba(255,255,255,0.2)', padding: '2px 10px', borderRadius: 6 }}>{result.result}</span>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--as-text-inverse)', opacity: 0.8 }}>{diff > 0 ? '+' : ''}{diff}</span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--as-text-inverse)', opacity: 0.7, marginTop: 8 }}>
          vs. {event.opponent || 'Opponent'} · {dateStr} · {event.location || ''} · {event.home_away === 'home' ? 'HOME' : event.home_away === 'away' ? 'AWAY' : ''}
        </div>
      </div>

      {qKeys.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 16, fontSize: 13, color: 'var(--as-text-secondary)' }}>
          {qKeys.map((k) => <span key={k} style={{ fontWeight: 600 }}>H{k} {quarterScores[k].us}-{quarterScores[k].them}</span>)}
        </div>
      )}

      {needsCapture && (
        <div style={{ padding: 14, borderRadius: 10, border: '1px dashed var(--as-accent)', backgroundColor: 'var(--as-accent-soft)', marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--as-accent)', marginBottom: 8 }}>Capture This Game</div>
          {!result.player_of_game_id && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 13, color: 'var(--as-text-secondary)', marginBottom: 4 }}>Player of the Game</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {stats.filter((s) => s.pts || s.fg_att || s.ft_att || s.reb || s.ast || s.stl || s.blk || s.pf)
                  .sort((a, b) => (b.pts || 0) - (a.pts || 0) || ((b.reb || 0) + (b.ast || 0) + (b.stl || 0) + (b.blk || 0)) - ((a.reb || 0) + (a.ast || 0) + (a.stl || 0) + (a.blk || 0)))
                  .map((s) => (
                  <button key={s.player_id} type="button" onClick={() => update({ player_of_game_id: s.player_id })} className="as-press"
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 40, padding: '6px 10px', borderRadius: 8, border: '1px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-card)', fontSize: 13, fontWeight: 500, color: 'var(--as-text-primary)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', width: '100%' }}>
                    <span style={{ fontWeight: 600 }}>#{s.jersey_at_time || '—'} {s.players?.first_name || '—'}</span>
                    <span style={{ color: 'var(--as-text-tertiary)', fontSize: 12 }}>{s.pts}p {s.reb}r {s.ast}a {s.fg_made}/{s.fg_att}FG{s.stl ? ` ${s.stl}s` : ''}{s.blk ? ` ${s.blk}b` : ''}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {!result.coach_highlight && (
            <div>
              <div style={{ fontSize: 13, color: 'var(--as-text-secondary)', marginBottom: 4 }}>Coach Highlight</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input type="text" value={highlight} onChange={(e) => setHighlight(e.target.value)} maxLength={140} placeholder="One line for parents..." style={{ flex: 1, minHeight: 36, padding: '0 10px', borderRadius: 8, border: '1px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-card)', fontSize: 14, fontFamily: 'inherit', color: 'var(--as-text-primary)' }} />
                <button type="button" onClick={() => { if (highlight.trim()) update({ coach_highlight: highlight.trim() }); }} className="as-press" style={{ minHeight: 36, padding: '0 12px', borderRadius: 8, border: 'none', backgroundColor: 'var(--as-accent)', color: 'var(--as-text-inverse)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Save</button>
              </div>
            </div>
          )}
        </div>
      )}

      {potgStat && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 10, backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)', marginBottom: 16 }}>
          <Trophy size={20} strokeWidth={1.75} color="#FFD700" />
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--as-text-primary)' }}>{potgStat.players?.first_name} {potgStat.players?.last_name} #{potgStat.jersey_at_time || ''}</div>
            <div style={{ fontSize: 13, color: 'var(--as-text-secondary)' }}>{potgStat.pts} pts · {potgStat.fg_made}/{potgStat.fg_att} FG{potgStat.blk ? ` · ${potgStat.blk} BLK` : ''}{potgStat.reb ? ` · ${potgStat.reb} REB` : ''}</div>
          </div>
        </div>
      )}

      {result.coach_highlight && (
        <div style={{ padding: 14, borderRadius: 10, backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)', marginBottom: 16, fontSize: 15, color: 'var(--as-text-primary)', fontStyle: 'italic', lineHeight: 1.5 }}>
          "{result.coach_highlight}"
        </div>
      )}

      <GameBoxScore stats={stats} />

      {plays.length > 0 && (
        <>
          <button type="button" onClick={() => setShowPlays((v) => !v)} className="as-press"
            style={{ width: '100%', minHeight: 44, marginTop: 16, borderRadius: 10, border: '1px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-card)', color: 'var(--as-text-secondary)', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
            {showPlays ? 'Hide plays' : `View ${plays.length} plays`}
          </button>
          {showPlays && <PlayByPlayFeed plays={plays} players={stats.map((s) => ({ id: s.player_id, first_name: s.players?.first_name, last_name: s.players?.last_name, jersey_number: s.jersey_at_time }))} />}
        </>
      )}

      {staff && (
        <button type="button" onClick={shareToChat} className="as-press"
          style={{ width: '100%', minHeight: 44, marginTop: 8, padding: '0 16px', borderRadius: 10, border: '1px solid var(--as-accent)', backgroundColor: 'transparent', color: 'var(--as-accent)', fontSize: 15, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
          Share to Chat
        </button>
      )}
    </div>
  );
}
