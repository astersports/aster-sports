import { AlertTriangle, ChevronRight, DollarSign, ListChecks, Send } from 'lucide-react';
import ChildRsvp from '../schedule/ChildRsvp';
import Badge from '../shared/Badge';
import { formatDayTime } from '../../lib/formatters';

// ActionRow — the "action" card archetype (shell contract v2), one of three
// platform archetypes. Variants by domain: rsvp (inline ChildRsvp), comms
// (the unread-briefing touchpoint), prep (coach next-event + action chips —
// the R-a "event-context body + chip row" refinement), and generic
// (ride/volunteer/alert/queue tap-through). Team-color left rail = identity;
// cobalt rail = system/comms.
const card = (rail) => ({
  backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)',
  borderLeft: `3px solid ${rail}`, borderRadius: 12,
  boxShadow: 'var(--as-shadow-sm)', padding: '13px 14px',
});
const KT = { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--as-text-primary)' };
const dot = (c) => ({ width: 8, height: 8, borderRadius: '50%', backgroundColor: c, flexShrink: 0 });
const EVLINE = { fontSize: 13, color: 'var(--as-text-secondary)', marginTop: 5 };
const TAP = { display: 'flex', alignItems: 'center', gap: 9, width: '100%', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' };
const CHIP = { fontSize: 12, fontWeight: 600, padding: '0 12px', minHeight: 44, borderRadius: 9999, border: '1px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-card)', color: 'var(--as-text-primary)', cursor: 'pointer', fontFamily: 'inherit' };
const GROUPED = { fontSize: 9, fontWeight: 700, color: 'var(--as-text-secondary)', backgroundColor: 'var(--as-bg-secondary)', border: '1px solid var(--as-border-default)', borderRadius: 9999, padding: '1px 6px' };

export default function ActionRow({ item, onRsvpResolved, onNavigate }) {
  if (item.domain === 'comms') {
    // primary wins (admin "Briefings" pin); else the real sender ("New from
    // Frank" / a coach's name), falling back when sent_by is unresolved.
    const label = item.primary || (item.from ? `New from ${item.from}` : 'New from your coach');
    const sub = item.subtitle || item.subject;
    return (
      <button type="button" onClick={() => onNavigate(item.to || '/messages')} className="as-press"
        style={{ ...card('var(--as-accent)'), ...TAP }} aria-label={`${label}${sub ? `: ${sub}` : ''}`}>
        <span style={{ width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', flexShrink: 0, backgroundColor: 'var(--as-accent-soft)', color: 'var(--as-accent)' }}>
          <Send size={16} strokeWidth={1.75} aria-hidden="true" />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={KT}>
            {label}
            {item.pinned && <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 700, color: 'var(--as-accent)', backgroundColor: 'var(--as-accent-soft)', borderRadius: 9999, padding: '1px 6px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>pinned</span>}
          </div>
          {sub && <div style={{ ...EVLINE, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</div>}
        </div>
        <span aria-label="unread" style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: 'var(--as-accent)', flexShrink: 0 }} />
      </button>
    );
  }

  const rail = item.team_color || 'var(--as-neutral)';

  if (item.domain === 'rsvp') {
    // Urgent tint (#1a) + deadline chip (#1b) live on the act-now RSVP card
    // per HOME_RENDERS: amber wash when the event is event-soon, an amber
    // "RSVP closes…" chip top-right (rsvpCloseLabel/isSoon set by the hook).
    const rsvpStyle = { ...card(rail) };
    if (item.isSoon) {
      delete rsvpStyle.backgroundColor;
      rsvpStyle.background = 'linear-gradient(92deg, var(--as-warning-soft), var(--as-bg-card) 62%)';
    }
    return (
      <div style={rsvpStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={KT}><span aria-hidden="true" style={dot(rail)} />{item.kid_first_name} · {item.team_name}{item.opponent ? ` vs ${item.opponent}` : ''}</div>
          {item.rsvpCloseLabel && (
            <Badge pill variant="warning" compact style={{ backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-warning)', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {item.rsvpCloseLabel}
            </Badge>
          )}
        </div>
        <div style={EVLINE}>{formatDayTime(item.start_at)}</div>
        <ChildRsvp child={item.child} eventId={item.event_id} eventType={item.eventType}
          onSave={() => onRsvpResolved(item.event_id, item.player_id)} />
      </div>
    );
  }

  if (item.domain === 'prep') {
    return (
      <div style={card(rail)}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--as-accent)' }}>Prep · {formatDayTime(item.start_at)}</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--as-text-primary)', marginTop: 3 }}>{item.title}</div>
        {item.subtitle && <div style={EVLINE}>{item.subtitle}</div>}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 9 }}>
          {item.chips.map((c) => (
            <button key={c.label} type="button" onClick={() => onNavigate(c.to)} className="as-press"
              style={c.primary
                ? { ...CHIP, backgroundColor: 'var(--as-accent)', borderColor: 'var(--as-accent)', color: 'var(--as-text-inverse)' }
                : CHIP}>
              {c.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // generic — ride / volunteer / coach action-queue / alert tap-through.
  // Severity (alerts) drives an amber/red rail + warning icon (act-now, D-B).
  const sevColor = item.severity === 'critical' ? 'var(--as-danger)'
    : item.severity === 'warning' ? 'var(--as-warning)' : null;
  const genRail = sevColor || item.team_color || 'var(--as-neutral)';
  return (
    <button type="button" onClick={() => onNavigate(item.to || `/events/${item.event_id}`)} className="as-press"
      style={{ ...card(genRail), ...TAP }} aria-label={item.primary}>
      {sevColor && (
        <span style={{ width: 28, height: 28, borderRadius: 7, display: 'grid', placeItems: 'center', flexShrink: 0, backgroundColor: item.severity === 'critical' ? 'var(--as-danger-soft)' : 'var(--as-warning-soft)', color: sevColor }}>
          {item.iconKey === 'dollar'
            ? <DollarSign size={16} strokeWidth={1.75} aria-hidden="true" />
            : <AlertTriangle size={16} strokeWidth={1.75} aria-hidden="true" />}
        </span>
      )}
      {!sevColor && item.queue && (
        <span style={{ width: 28, height: 28, borderRadius: 7, display: 'grid', placeItems: 'center', flexShrink: 0, backgroundColor: 'var(--as-bg-secondary)', color: 'var(--as-text-secondary)' }}>
          <ListChecks size={16} strokeWidth={1.75} aria-hidden="true" />
        </span>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={KT}>
          {item.team_color && !sevColor && !item.queue && <span aria-hidden="true" style={dot(genRail)} />}
          {item.primary}
          {item.grouped != null && <span style={GROUPED}>grouped · {item.grouped}</span>}
        </div>
        {(item.subtitle || item.start_at) && (
          <div style={EVLINE}>{item.subtitle || `${item.team_name} · ${formatDayTime(item.start_at)}`}</div>
        )}
      </div>
      <ChevronRight size={16} strokeWidth={1.75} color="var(--as-text-tertiary)" aria-hidden="true" style={{ flexShrink: 0 }} />
    </button>
  );
}
