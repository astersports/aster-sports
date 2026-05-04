import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';
import { useRoster } from '../hooks/useRoster';
import { useLiveGame } from '../hooks/useLiveGame';
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

  useEffect(() => {
    supabase.from('events').select('*, teams(id, name, team_color, org_id)').eq('id', eventId).maybeSingle()
      .then(({ data }) => setEvent(data));
  }, [eventId]);

  const handlePlay = (type, opts) => {
    if (opts.isOpponent || type.includes('sub') || type === 'timeout') {
      game.addPlay(type, { ...opts, teamId: event?.team_id });
      return;
    }
    setPendingPlay({ type, opts });
  };

  const assignPlayer = (playerId) => {
    game.addPlay(pendingPlay.type, { ...pendingPlay.opts, playerId, teamId: event?.team_id });
    setPendingPlay(null);
  };

  const PLAY_LABELS = { fg2_made: '2-point FG made by', fg3_made: '3-point FG made by', ft_made: 'Free throw made by', fg2_miss: '2PT miss by', fg3_miss: '3PT miss by', rebound: 'Rebound by', assist: 'Assist by', steal: 'Steal by', block: 'Block by', turnover: 'Turnover by', foul: 'Foul on' };

  if (!event) return <div style={{ padding: 32, textAlign: 'center', color: 'var(--em-text-tertiary)' }}>Loading…</div>;

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9995, backgroundColor: 'var(--em-bg-page)', display: 'flex', flexDirection: 'column' }}>
      <Scoreboard teamName={event.teams?.name} opponentName={event.opponent} ourScore={game.ourScore} oppScore={game.oppScore} period={game.period} onPeriodChange={game.setPeriod} teamColor={event.teams?.team_color} />
      <div style={{ display: 'flex', borderBottom: '2px solid var(--em-border-default)' }}>
        {['scoring', 'plays'].map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} style={{ flex: 1, minHeight: 40, border: 'none', backgroundColor: 'transparent', fontSize: 14, fontWeight: tab === t ? 700 : 400, color: tab === t ? 'var(--em-accent)' : 'var(--em-text-tertiary)', borderBottom: tab === t ? '2px solid var(--em-accent)' : 'none', cursor: 'pointer', fontFamily: 'inherit' }}>{t === 'scoring' ? 'Scoring' : 'Play by Play'}</button>
        ))}
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {tab === 'scoring' && (
          <div style={{ padding: 16 }}>
            <ActionGrid isOpponent={true} onPlay={handlePlay} teamLabel={event.opponent || 'Opponent'} />
            <ActionGrid isOpponent={false} onPlay={handlePlay} teamLabel={event.teams?.name || 'Home'} />
          </div>
        )}
        {tab === 'plays' && <PlayByPlayFeed plays={game.plays} players={players} />}
      </div>
      <div style={{ display: 'flex', gap: 8, padding: '8px 16px', paddingBottom: 'calc(env(safe-area-inset-bottom) + 8px)', borderTop: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)' }}>
        <button type="button" onClick={game.undoLast} className="sf-press" disabled={game.plays.length === 0} style={{ flex: 1, minHeight: 44, borderRadius: 10, border: '1px solid var(--em-border-default)', backgroundColor: 'transparent', color: 'var(--em-accent)', fontSize: 15, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer' }}>Undo</button>
        <button type="button" onClick={() => navigate(-1)} className="sf-press" style={{ flex: 1, minHeight: 44, borderRadius: 10, border: 'none', backgroundColor: 'var(--em-accent)', color: 'var(--em-text-inverse)', fontSize: 15, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>End Game</button>
      </div>
      <PlayerPicker open={!!pendingPlay} players={players} onCourt={game.onCourt} playLabel={pendingPlay ? PLAY_LABELS[pendingPlay.type] || pendingPlay.type : ''} onSelect={assignPlayer} onSkip={() => { game.addPlay(pendingPlay.type, { ...pendingPlay.opts, teamId: event?.team_id }); setPendingPlay(null); }} onClose={() => setPendingPlay(null)} />
    </div>,
    document.body
  );
}
