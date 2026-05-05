import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  const { players } = useRoster(event?.team_id);
  const game = useLiveGame(eventId, { teamId: event?.team_id, orgId: event?.teams?.org_id });
  const [pendingPlay, setPendingPlay] = useState(null);
  const [tab, setTab] = useState('scoring');
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [showSubs, setShowSubs] = useState(false);

  useEffect(() => {
    supabase.from('events').select('*, teams(id, name, team_color, org_id)').eq('id', eventId).maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error('LiveScorePage event:', error.message);
        setEvent(data);
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

  const endGame = async () => { setConfirmEnd(false); await game.saveToGameResults(); navigate(`/events/${eventId}`); };

  if (!event) return <div style={{ padding: 32, textAlign: 'center', color: 'var(--em-text-tertiary)' }}>Loading…</div>;

  const tabs = ['scoring', 'stats', 'plays'];

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9995, backgroundColor: 'var(--em-bg-page)', display: 'flex', flexDirection: 'column' }}>
      <Scoreboard teamName={event.teams?.name} opponentName={event.opponent} ourScore={game.ourScore} oppScore={game.oppScore} period={game.period} onPeriodChange={game.setPeriod} teamColor={event.teams?.team_color} />
      <div style={{ display: 'flex', borderBottom: '2px solid var(--em-border-default)' }}>
        {tabs.map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} role="tab" aria-selected={tab === t} style={{ flex: 1, minHeight: 44, border: 'none', backgroundColor: 'transparent', fontSize: 13, fontWeight: tab === t ? 700 : 400, color: tab === t ? 'var(--em-accent)' : 'var(--em-text-tertiary)', borderBottom: tab === t ? '2px solid var(--em-accent)' : 'none', cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize' }}>{t === 'plays' ? 'Plays' : t === 'stats' ? 'Stats' : 'Scoring'}</button>
        ))}
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {tab === 'scoring' && (
          <div style={{ padding: 16 }}>
            <ActionGrid isOpponent={false} onPlay={handlePlay} teamLabel={event.teams?.name || 'Home'} />
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: 'var(--em-text-tertiary)' }}>On Court: {game.onCourt.length}</span>
              <button type="button" onClick={() => setShowSubs(true)} className="sf-press" style={{ marginLeft: 8, fontSize: 13, fontWeight: 600, color: 'var(--em-accent)', background: 'none', border: '1px solid var(--em-accent)', borderRadius: 8, padding: '4px 12px', minHeight: 32, cursor: 'pointer', fontFamily: 'inherit' }}>Substitutions</button>
            </div>
            <ActionGrid isOpponent onPlay={handlePlay} teamLabel={event.opponent || 'Opponent'} />
          </div>
        )}
        {tab === 'stats' && <BoxScore playerStats={game.playerStats} players={players} />}
        {tab === 'plays' && <PlayByPlayFeed plays={game.plays} players={players} />}
      </div>
      <div style={{ display: 'flex', gap: 8, padding: '8px 16px', paddingBottom: 'calc(env(safe-area-inset-bottom) + 8px)', borderTop: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)' }}>
        <button type="button" onClick={handleUndo} className="sf-press" disabled={game.plays.length === 0} style={{ flex: 1, minHeight: 44, borderRadius: 10, border: '1px solid var(--em-border-default)', backgroundColor: 'transparent', color: 'var(--em-accent)', fontSize: 15, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer' }}>Undo</button>
        <button type="button" onClick={() => setConfirmEnd(true)} className="sf-press" style={{ flex: 1, minHeight: 44, borderRadius: 10, border: 'none', backgroundColor: 'var(--em-accent)', color: 'var(--em-text-inverse)', fontSize: 15, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>End Game</button>
      </div>
      <PlayerPicker open={!!pendingPlay} players={players} onCourt={game.onCourt} playerStats={game.playerStats} playLabel={pendingPlay ? (LABELS[pendingPlay.type] || pendingPlay.type) + ' by' : ''} onSelect={assignPlayer} onSkip={() => { if (pendingPlay) game.addPlay(pendingPlay.type, { ...pendingPlay.opts, teamId: event?.team_id }); setPendingPlay(null); }} onClose={() => setPendingPlay(null)} />
      <SubstitutionSheet open={showSubs} players={players} onCourt={game.onCourt} playerStats={game.playerStats} onSubIn={game.subIn} onSubOut={game.subOut} onClose={() => setShowSubs(false)} />
      {confirmEnd && <ConfirmDialog title="End Game?" message={`Final score: ${game.ourScore}-${game.oppScore}. This will save and publish the result.`} confirmLabel="Save & End" onConfirm={endGame} onCancel={() => setConfirmEnd(false)} />}
    </div>,
    document.body
  );
}
