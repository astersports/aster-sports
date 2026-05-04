import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';
import { useRoster } from '../hooks/useRoster';
import { useLiveGame } from '../hooks/useLiveGame';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import Scoreboard from '../components/livescore/Scoreboard';
import ActionGrid from '../components/livescore/ActionGrid';
import PlayerPicker from '../components/livescore/PlayerPicker';
import PlayByPlayFeed from '../components/livescore/PlayByPlayFeed';

export default function LiveScorePage() {
  const { id: eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const { players } = useRoster(event?.team_id);
  const game = useLiveGame(eventId);
  const [pendingPlay, setPendingPlay] = useState(null);
  const [tab, setTab] = useState('scoring');
  const [confirmEnd, setConfirmEnd] = useState(false);

  useEffect(() => {
    supabase.from('events').select('*, teams(id, name, team_color, org_id)').eq('id', eventId).maybeSingle()
      .then(({ data }) => setEvent(data));
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

  const endGame = async () => {
    setConfirmEnd(false);
    await game.saveToGameResults();
    navigate(`/events/${eventId}`);
  };

  const LABELS = { fg2_made: '2-point FG', fg3_made: '3-point FG', ft_made: 'Free throw', fg2_miss: '2PT miss', fg3_miss: '3PT miss', ft_miss: 'FT miss', rebound: 'Rebound', assist: 'Assist', steal: 'Steal', block: 'Block', turnover: 'Turnover', foul: 'Foul' };

  if (!event) return <div style={{ padding: 32, textAlign: 'center', color: 'var(--em-text-tertiary)' }}>Loading…</div>;

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9995, backgroundColor: 'var(--em-bg-page)', display: 'flex', flexDirection: 'column' }}>
      <Scoreboard teamName={event.teams?.name} opponentName={event.opponent} ourScore={game.ourScore} oppScore={game.oppScore} period={game.period} onPeriodChange={game.setPeriod} teamColor={event.teams?.team_color} />
      <div style={{ display: 'flex', borderBottom: '2px solid var(--em-border-default)' }}>
        {['scoring', 'plays'].map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} aria-label={t === 'scoring' ? 'Scoring tab' : 'Play by play tab'} style={{ flex: 1, minHeight: 44, border: 'none', backgroundColor: 'transparent', fontSize: 14, fontWeight: tab === t ? 700 : 400, color: tab === t ? 'var(--em-accent)' : 'var(--em-text-tertiary)', borderBottom: tab === t ? '2px solid var(--em-accent)' : 'none', cursor: 'pointer', fontFamily: 'inherit' }}>{t === 'scoring' ? 'Scoring' : 'Play by Play'}</button>
        ))}
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {tab === 'scoring' && (
          <div style={{ padding: 16 }}>
            <ActionGrid isOpponent onPlay={handlePlay} teamLabel={event.opponent || 'Opponent'} />
            <ActionGrid isOpponent={false} onPlay={handlePlay} teamLabel={event.teams?.name || 'Home'} />
          </div>
        )}
        {tab === 'plays' && <PlayByPlayFeed plays={game.plays} players={players} />}
      </div>
      <div style={{ display: 'flex', gap: 8, padding: '8px 16px', paddingBottom: 'calc(env(safe-area-inset-bottom) + 8px)', borderTop: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)' }}>
        <button type="button" onClick={game.undoLast} className="sf-press" disabled={game.plays.length === 0} style={{ flex: 1, minHeight: 44, borderRadius: 10, border: '1px solid var(--em-border-default)', backgroundColor: 'transparent', color: 'var(--em-accent)', fontSize: 15, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer' }}>Undo</button>
        <button type="button" onClick={() => setConfirmEnd(true)} className="sf-press" style={{ flex: 1, minHeight: 44, borderRadius: 10, border: 'none', backgroundColor: 'var(--em-accent)', color: 'var(--em-text-inverse)', fontSize: 15, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>End Game</button>
      </div>
      <PlayerPicker open={!!pendingPlay} players={players} onCourt={game.onCourt} playLabel={pendingPlay ? (LABELS[pendingPlay.type] || pendingPlay.type) + ' by' : ''} onSelect={assignPlayer} onSkip={() => { if (pendingPlay) game.addPlay(pendingPlay.type, { ...pendingPlay.opts, teamId: event?.team_id }); setPendingPlay(null); }} onClose={() => setPendingPlay(null)} />
      {confirmEnd && (
        <ConfirmDialog title="End Game?" message={`Final score: ${game.ourScore}-${game.oppScore}. This will save and publish the result.`} confirmLabel="Save & End" onConfirm={endGame} onCancel={() => setConfirmEnd(false)} />
      )}
    </div>,
    document.body
  );
}
