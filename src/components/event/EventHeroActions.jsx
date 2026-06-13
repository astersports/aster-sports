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
import ChildRsvp from '../shared/ChildRsvp';
import ParentArrivalActions from '../gameday/ParentArrivalActions';
import { useNow } from '../../hooks/useNow';
import { isRsvpOpen, PARENT_ARRIVAL_WINDOW_AFTER_MS, PARENT_ARRIVAL_WINDOW_BEFORE_MS } from '../../lib/eventWindows';
import { composeFromEvent } from '../../lib/briefings/composeFromEvent';

const ROW = { display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' };
const BTN = { flex: '1 1 140px', minHeight: 44, padding: '0 14px', borderRadius: 10, border: 'none', backgroundColor: 'var(--as-accent)', color: 'var(--as-text-inverse)', fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 };
const BTN_SEC = { ...BTN, backgroundColor: 'transparent', color: 'var(--as-accent)', border: '1px solid var(--as-accent)' };

export default function EventHeroActions({
  event, isStaff, isGameType, isPast, activatedSet,
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
    // SD-11: parent RSVP closes AT start_at. V6: tri-state BUTTONS (D4)
    // — same control grammar as the detailed schedule card; unactivated
    // academy kids get the violet sentence, never a fake control.
    const academy = kids.filter((c) => c.memberType === 'futures_academy' && isGameType && !activatedSet?.has(c.playerId));
    return (
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {kids.map((c) => (
          <div key={c.playerId}>
            {kids.length > 1 && <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--as-text-secondary)' }}>{c.firstName}</div>}
            <ChildRsvp child={c} eventId={event.id} eventType={event.event_type} variant="buttons" disabled={!isRsvpOpen(event.start_at, now)} onSave={onRsvpChange} />
          </div>
        ))}
        {academy.length > 0 && (
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--as-academy)' }}>
            {`${academy.map((c) => c.firstName).join(' and ')} ${academy.length === 1 ? "isn't" : "aren't"} activated for this game`}
          </div>
        )}
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
      // Past tournament event → tournament_recap (composeFromEvent maps it,
      // requires tournament_id). Past game → game_recap. Both pre-scope so
      // the admin lands in a filled composer, not the cold picker.
      const isPastTournament = event.event_type === 'tournament' && !!event.tournament_id;
      return (
        <div style={ROW}>
          <button type="button" onClick={onEnterScore} className="as-press" style={BTN}>Enter Score</button>
          {isGameEvent && (
            <button type="button" onClick={() => navigate(composeFromEvent(event, isPast))} className="as-press" style={BTN_SEC}><Send size={14} strokeWidth={1.75} />Request recap</button>
          )}
          {isPastTournament && (
            <button type="button" onClick={() => navigate(composeFromEvent(event, isPast))} className="as-press" style={BTN_SEC}><Send size={14} strokeWidth={1.75} />Compose recap</button>
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
          <button type="button" onClick={() => navigate(composeFromEvent(event, isPast))} className="as-press" style={BTN}><Send size={14} strokeWidth={1.75} />Compose briefing</button>
        ) : null}
        <button type="button" onClick={onNotify} className="as-press" style={BTN}><Send size={14} strokeWidth={1.75} />Notify families</button>
        {!isTournamentDraft && <button type="button" onClick={onLockRoster} className="as-press" style={BTN_SEC}>Lock roster{lockCount != null ? ` · ${lockCount}` : ''}</button>}
      </div>
    );
  }

  // Practice — Notify only.
  return <div style={ROW}><button type="button" onClick={onNotify} className="as-press" style={BTN}><Send size={14} strokeWidth={1.75} />Notify families</button></div>;
}
