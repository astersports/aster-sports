// L99 redesign PR B — role × event-type × time-window action stack
// for the event detail hero. Hero owns layout; this child owns the
// per-scenario action matrix.
//
// Scenarios:
//   - Past game (staff, unscored)   -> [Enter Score]
//   - Past game (staff, scored)     -> Final score line (no action)
//   - Future game/tournament (staff) -> [Notify families] + [Lock roster]
//     Q5: Notify left, Lock right (frequency-weighted).
//   - Future practice (staff)       -> [Notify families]
//   - Tournament draft (staff)      -> [Compose briefing] + [Notify families]
//   - Cancelled (any role)          -> none
//   - Parent (any future event)     -> RSVP picker per kid (ChildRsvp)
//     Parent within parent-arrival window -> ParentArrivalActions

import { Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ChildRsvp from '../schedule/ChildRsvp';
import ParentArrivalActions from '../gameday/ParentArrivalActions';
import { useNow } from '../../hooks/useNow';
import { PARENT_ARRIVAL_WINDOW_AFTER_MS, PARENT_ARRIVAL_WINDOW_BEFORE_MS } from '../../lib/eventWindows';

const ROW = { display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' };
const BTN = { flex: '1 1 140px', minHeight: 44, padding: '0 14px', borderRadius: 10, border: 'none', backgroundColor: 'var(--as-accent)', color: 'var(--as-text-inverse)', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 };
const BTN_SEC = { ...BTN, backgroundColor: 'transparent', color: 'var(--as-accent)', border: '1px solid var(--as-accent)' };

export default function EventHeroActions({
  event, isStaff, isGameType, isPast,
  onEnterScore, onLockRoster, onNotify,
  lockCount, onRsvpChange,
}) {
  const { role, myChildren } = useAuth();
  const navigate = useNavigate();
  const now = useNow();
  const isCancelled = event.status === 'cancelled';

  if (isCancelled) return null;

  if (role === 'parent') {
    const kids = (myChildren || []).filter((c) => c.teamIds?.includes(event.team_id) || c.teamId === event.team_id);
    if (kids.length === 0) return null;
    const msUntil = new Date(event.start_at).getTime() - now;
    const msAfter = now - new Date(event.start_at).getTime();
    const inArrivalWindow = msUntil <= PARENT_ARRIVAL_WINDOW_BEFORE_MS && msAfter <= PARENT_ARRIVAL_WINDOW_AFTER_MS;
    if (inArrivalWindow && isGameType) return <ParentArrivalActions event={event} />;
    return (
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {kids.map((c) => <ChildRsvp key={c.playerId} child={c} eventId={event.id} eventType={event.event_type} disabled={isPast} onSave={onRsvpChange} />)}
      </div>
    );
  }

  if (!isStaff) return null;

  if (isPast) {
    if (isGameType) {
      // FinalizedGameView below renders the result if scored; tapping
      // Enter Score on a scored game opens the sheet in edit mode.
      // Coach game-recap trigger mirrors the tournament Compose-briefing
      // deep link above (compose entry point #3): a past 'game' event
      // pre-fills the composer with the game anchor + game_recap kind.
      const isGameEvent = event.event_type === 'game';
      return (
        <div style={ROW}>
          <button type="button" onClick={onEnterScore} className="as-press" style={BTN}>Enter Score</button>
          {isGameEvent && (
            <button type="button" onClick={() => navigate(`/admin/briefings/compose?anchor=event&id=${event.id}&kind=game_recap`)} className="as-press" style={BTN_SEC}><Send size={14} strokeWidth={1.75} />Request recap</button>
          )}
        </div>
      );
    }
    return null;
  }

  // Future events, staff. Action stack varies by event_type.
  if (isGameType) {
    const isTournamentDraft = event.event_type === 'tournament' && !event.opponent;
    return (
      <div style={ROW}>
        {isTournamentDraft && event.tournament_id ? (
          <button type="button" onClick={() => navigate(`/admin/briefings/compose?anchor=tournament&id=${event.tournament_id}`)} className="as-press" style={BTN}><Send size={14} strokeWidth={1.75} />Compose briefing</button>
        ) : null}
        <button type="button" onClick={onNotify} className="as-press" style={BTN}><Send size={14} strokeWidth={1.75} />Notify families</button>
        {!isTournamentDraft && <button type="button" onClick={onLockRoster} className="as-press" style={BTN_SEC}>Lock roster{lockCount != null ? ` · ${lockCount}` : ''}</button>}
      </div>
    );
  }

  // Practice — Notify only.
  return <div style={ROW}><button type="button" onClick={onNotify} className="as-press" style={BTN}><Send size={14} strokeWidth={1.75} />Notify families</button></div>;
}
