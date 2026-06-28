import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';
import { useRoster } from '../hooks/useRoster';
import { useLiveGame } from '../hooks/useLiveGame';
import { useToast } from '../context/useToast';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import Scoreboard from '../components/livescore/Scoreboard';
import ActionGrid from '../components/livescore/ActionGrid';
import PlayerPicker from '../components/livescore/PlayerPicker';
import PlayByPlayFeed from '../components/livescore/PlayByPlayFeed';
import BoxScore from '../components/livescore/BoxScore';
import SubstitutionSheet from '../components/livescore/SubstitutionSheet';

const LABELS = { fg2_made: '2-point FG', fg3_made: '3-point FG', ft_made: 'Free throw', fg2_miss: '2PT miss', fg3_miss: '3PT miss', ft_miss: 'FT miss', rebound: 'Rebound', assist: 'Assist', steal: 'Steal', block: 'Block', turnover: 'Turnover', foul: 'Foul' };
const POINT_LABELS = { fg2_made: '+2', fg3_made: '+3', ft_made: '+1' };

export default function LiveScorePage() {
  const { id: eventId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [event, setEvent] = useState(null);
  const [loadState, setLoadState] = useState('loading'); // 'loading' | 'ready' | 'notfound' | 'error'
  const { players } = useRoster(event?.team_id);
  const game = useLiveGame(eventId, { teamId: event?.team_id, orgId: event?.teams?.org_id });
  const [pendingPlay, setPendingPlay] = useState(null);
  const [tab, setTab] = useState('scoring');
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [showSubs, setShowSubs] = useState(false);

  useEffect(() => {
    supabase.from('events').select('*, teams(id, name, team_color, org_id)').eq('id', eventId).maybeSingle()
      .then(({ data, error }) => {
        if (error) { console.error('LiveScorePage event:', error.message); setLoadState('error'); return; }
        setEvent(data);
        setLoadState(data ? 'ready' : 'notfound');
      });
  }, [eventId]);

  const handlePlay = (type, opts) => {
    if (opts.isOpponent || type === 'sub_in' || type === 'sub_out' || type === 'timeout') {
      game.addPlay(type, { ...opts, teamId: event?.team_id });
      return;
    }
    setPendingPlay({ type, opts });
  };

  const assignPlayer = (playerId) => {
    if (!pendingPlay) return;
    game.addPlay(pendingPlay.type, { ...pendingPlay.opts, playerId, teamId: event?.team_id });
    setPendingPlay(null);
  };

  const handleUndo = () => {
    const last = game.plays[game.plays.length - 1];
    if (!last) return;
    const name = players.find((p) => p.id === last.player_id)?.first_name || (last.is_opponent ? 'Opponent' : '');
    const label = POINT_LABELS[last.play_type] || LABELS[last.play_type] || last.play_type;
    game.undoLast();
    showToast(`Undid ${label}${name ? ` by ${name}` : ''}`, 'info');
  };

  const endGame = async () => { setConfirmEnd(false); await game.saveToGameResults(); navigate(`/events/${eventId}`, { replace: true }); };

  if (loadState === 'error') return <div style={{ padding: 32, textAlign: 'center', color: 'var(--as-text-tertiary)' }}>Couldn’t load this game. Try again in a moment.</div>;
  if (loadState === 'notfound') return <div style={{ padding: 32, textAlign: 'center', color: 'var(--as-text-tertiary)' }}>We couldn’t find this game. It may have been moved or removed.</div>;
  if (!event) return <div style={{ padding: 32, textAlign: 'center', color: 'var(--as-text-tertiary)' }}>Loading…</div>;

  const tabs = ['scoring', 'stats', 'plays'];

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9995, backgroundColor: 'var(--as-bg-page)', display: 'flex', flexDirection: 'column' }}>
      <Scoreboard teamName={event.teams?.name} opponentName={event.opponent} ourScore={game.ourScore} oppScore={game.oppScore} period={game.period} onPeriodChange={game.setPeriod} teamColor={event.teams?.team_color} onBack={() => navigate(`/events/${eventId}`, { replace: true })} />
      <div style={{ display: 'flex', borderBottom: '2px solid var(--as-border-default)' }}>
        {tabs.map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} role="tab" aria-selected={tab === t} style={{ flex: 1, minHeight: 44, border: 'none', backgroundColor: 'transparent', fontSize: 13, fontWeight: tab === t ? 700 : 400, color: tab === t ? 'var(--as-accent)' : 'var(--as-text-tertiary)', borderBottom: tab === t ? '2px solid var(--as-accent)' : 'none', cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize' }}>{t === 'plays' ? 'Plays' : t === 'stats' ? 'Stats' : 'Scoring'}</button>
        ))}
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {tab === 'scoring' && (
          <div style={{ padding: 16 }}>
            <ActionGrid isOpponent={false} onPlay={handlePlay} teamLabel={event.teams?.name || 'Home'} />
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: 'var(--as-text-tertiary)' }}>On Court: {game.onCourt.length}</span>
              <button type="button" onClick={() => setShowSubs(true)} className="as-press" style={{ marginLeft: 8, fontSize: 13, fontWeight: 600, color: 'var(--as-accent)', background: 'none', border: '1px solid var(--as-accent)', borderRadius: 8, padding: '4px 12px', minHeight: 32, cursor: 'pointer', fontFamily: 'inherit' }}>Substitutions</button>
            </div>
            <ActionGrid isOpponent onPlay={handlePlay} teamLabel={event.opponent || 'Opponent'} />
          </div>
        )}
        {tab === 'stats' && <BoxScore playerStats={game.playerStats} players={players} />}
        {tab === 'plays' && <PlayByPlayFeed plays={game.plays} players={players} />}
      </div>
      <div style={{ display: 'flex', gap: 8, padding: '8px 16px', paddingBottom: 'calc(env(safe-area-inset-bottom) + 8px)', borderTop: '1px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-card)' }}>
        <button type="button" onClick={handleUndo} className="as-press" disabled={game.plays.length === 0} style={{ flex: 1, minHeight: 44, borderRadius: 10, border: '1px solid var(--as-border-default)', backgroundColor: 'transparent', color: game.plays.length === 0 ? 'var(--as-text-tertiary)' : 'var(--as-accent)', fontSize: 15, fontWeight: 500, fontFamily: 'inherit', cursor: game.plays.length === 0 ? 'not-allowed' : 'pointer', opacity: game.plays.length === 0 ? 0.5 : 1 }}>Undo</button>
        <button type="button" onClick={() => setConfirmEnd(true)} className="as-press" style={{ flex: 1, minHeight: 44, borderRadius: 10, border: 'none', backgroundColor: 'var(--as-accent)', color: 'var(--as-text-inverse)', fontSize: 15, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>End Game</button>
      </div>
      <PlayerPicker open={!!pendingPlay} players={players} onCourt={game.onCourt} playerStats={game.playerStats} playLabel={pendingPlay ? (LABELS[pendingPlay.type] || pendingPlay.type) + ' by' : ''} onSelect={assignPlayer} onSkip={() => { if (pendingPlay) game.addPlay(pendingPlay.type, { ...pendingPlay.opts, teamId: event?.team_id }); setPendingPlay(null); }} onClose={() => setPendingPlay(null)} />
      <SubstitutionSheet open={showSubs} players={players} onCourt={game.onCourt} playerStats={game.playerStats} onSubIn={game.subIn} onSubOut={game.subOut} onClose={() => setShowSubs(false)} />
      {confirmEnd && <ConfirmDialog title="End Game?" message={`Final score: ${game.ourScore}-${game.oppScore}. This will save and publish the result.`} confirmLabel="Save & End" onConfirm={endGame} onCancel={() => setConfirmEnd(false)} />}
    </div>,
    document.body
  );
}
