import { ChevronRight, Mail } from 'lucide-react';
import ChildRsvp from '../schedule/ChildRsvp';
import { formatDayTime } from '../../lib/formatters';

// ActionRow — the "action" card archetype (shell contract v2), one of three
// platform archetypes. Three variants by domain: rsvp (inline ChildRsvp),
// comms (the unread-briefing touchpoint), and ride/volunteer (tap-through).
// The team-color left rail is identity; cobalt rail = system/comms.
const card = (rail) => ({
  backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)',
  borderLeft: `3px solid ${rail}`, borderRadius: 12,
  boxShadow: 'var(--as-shadow-sm)', padding: '13px 14px',
});
const KT = { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--as-text-primary)' };
const dot = (c) => ({ width: 8, height: 8, borderRadius: '50%', backgroundColor: c, flexShrink: 0 });
const EVLINE = { fontSize: 13, color: 'var(--as-text-secondary)', marginTop: 5 };
const TAP = { display: 'flex', alignItems: 'center', gap: 9, width: '100%', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' };

export default function ActionRow({ item, onRsvpResolved, onNavigate }) {
  if (item.domain === 'comms') {
    return (
      <button type="button" onClick={() => onNavigate('/messages')} className="as-press"
        style={{ ...card('var(--as-accent)'), ...TAP }} aria-label={`Unread from your coach: ${item.subject}`}>
        <span style={{ width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', flexShrink: 0, backgroundColor: 'var(--as-accent-soft)', color: 'var(--as-accent)' }}>
          <Mail size={16} strokeWidth={1.75} aria-hidden="true" />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={KT}>New from your coach</div>
          <div style={{ ...EVLINE, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.subject}</div>
        </div>
        <span aria-label="unread" style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: 'var(--as-accent)', flexShrink: 0 }} />
      </button>
    );
  }

  const rail = item.team_color || 'var(--as-neutral)';
  if (item.domain === 'rsvp') {
    return (
      <div style={card(rail)}>
        <div style={KT}><span aria-hidden="true" style={dot(rail)} />{item.kid_first_name} · {item.team_name}</div>
        <div style={EVLINE}>{formatDayTime(item.start_at)}</div>
        <ChildRsvp child={item.child} eventId={item.event_id} eventType={item.eventType}
          onSave={() => onRsvpResolved(item.event_id, item.player_id)} />
      </div>
    );
  }

  // ride / volunteer — tap through to the event.
  return (
    <button type="button" onClick={() => onNavigate(`/events/${item.event_id}`)} className="as-press"
      style={{ ...card(rail), ...TAP }} aria-label={item.primary}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={KT}><span aria-hidden="true" style={dot(rail)} />{item.primary}</div>
        <div style={EVLINE}>{item.team_name} · {formatDayTime(item.start_at)}</div>
      </div>
      <ChevronRight size={16} strokeWidth={1.75} color="var(--as-text-tertiary)" aria-hidden="true" style={{ flexShrink: 0 }} />
    </button>
  );
}
