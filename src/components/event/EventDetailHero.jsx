// L99 redesign PR B — consolidated hero card for event detail.
// Replaces RsvpSummaryBlock + EventDetailTab + standalone Lock card
// + Location heading with a single card at the top of the page.
//
// Layout:
//   Title (opponent or event type)
//   Date · Time · Arrival
//   📍 Location · Jersey
//   ━━━━━ progress bar + RSVP count line   (games / tournaments only)
//   [action stack via EventHeroActions]
//
// Cancelled state (Gap 3): red border + CANCELLED badge, action stack
//   suppressed via EventHeroActions early return.
// Loading skeleton (Gap 1): caller renders <EventDetailHero.Skeleton />.

import { Ban, MapPin } from 'lucide-react';
import EventHeroActions from './EventHeroActions';
import { formatEventTitle } from '../../lib/eventTitle';

const CARD = (cancelled) => ({
  margin: '12px 16px', padding: 16, borderRadius: 12, backgroundColor: 'var(--as-bg-card)',
  border: `1px solid ${cancelled ? 'var(--as-danger)' : 'var(--as-border-default)'}`,
  boxShadow: 'var(--as-shadow-sm)',
});
const TITLE = { fontSize: 17, fontWeight: 700, color: 'var(--as-text-primary)', lineHeight: 1.3 };
const META = { fontSize: 13, color: 'var(--as-text-secondary)', marginTop: 6, lineHeight: 1.5 };
const LOC = { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--as-text-secondary)', marginTop: 4 };
const PROG_WRAP = { marginTop: 12, height: 6, borderRadius: 3, backgroundColor: 'var(--as-bg-tertiary)', overflow: 'hidden', display: 'flex' };
const PROG_LABEL = { fontSize: 12, color: 'var(--as-text-tertiary)', marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' };
const CANCEL_BADGE = { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--as-danger)', backgroundColor: 'var(--as-danger-soft)', padding: '2px 8px', borderRadius: 4, marginBottom: 6 };
const SKELETON_BAR = { backgroundColor: 'var(--as-bg-secondary)', borderRadius: 4 };

function fmtDate(iso) { return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/New_York' }); }
function fmtTime(iso) { return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }); }

function rsvpCounts(rsvps, roster) {
  const r = rsvps || [];
  const going = r.filter((x) => x.response === 'going').length;
  const maybe = r.filter((x) => x.response === 'maybe').length;
  const out = r.filter((x) => x.response === 'not_going').length;
  const replied = r.filter((x) => x.response).length;
  return { going, maybe, out, noReply: Math.max(0, (roster || []).length - replied) };
}

export default function EventDetailHero({
  event, isStaff, isPast, rsvps, roster,
  onEnterScore, onLockRoster, onNotify, onRsvpChange,
}) {
  const isGameType = event.event_type === 'game' || event.event_type === 'tournament';
  const isCancelled = event.status === 'cancelled';
  const { prefix, body } = formatEventTitle(event);
  const counts = rsvpCounts(rsvps, roster);
  const total = (roster || []).length;
  const goingPct = total > 0 ? Math.round((counts.going / total) * 100) : 0;
  const maybePct = total > 0 ? Math.round((counts.maybe / total) * 100) : 0;

  return (
    <div style={CARD(isCancelled)}>
      {isCancelled && <div style={CANCEL_BADGE}><Ban size={11} strokeWidth={1.75} />Cancelled</div>}
      <div style={{ ...TITLE, textDecoration: isCancelled ? 'line-through' : 'none' }}>{prefix}{body}</div>
      <div style={META}>{fmtDate(event.start_at)} · {fmtTime(event.start_at)}{event.arrival_minutes_before > 0 ? ` · Arrive ${event.arrival_minutes_before} min early` : ''}</div>
      {event.location && (
        <div style={LOC}><MapPin size={13} strokeWidth={1.75} color="var(--as-text-tertiary)" />{event.location}{event.jersey ? ` · Jersey: ${event.jersey}` : ''}</div>
      )}
      {isStaff && isGameType && !isPast && total > 0 && (
        <>
          <div style={PROG_WRAP} aria-label={`RSVP progress: ${counts.going} going of ${total}`}>
            <div style={{ width: `${goingPct}%`, backgroundColor: 'var(--as-success)' }} />
            <div style={{ width: `${maybePct}%`, backgroundColor: 'var(--as-warning)' }} />
          </div>
          <div style={PROG_LABEL}>
            <span style={{ color: 'var(--as-success)', fontWeight: 600 }}>{counts.going} going</span>
            {counts.maybe > 0 && <span style={{ color: 'var(--as-warning)', fontWeight: 600 }}>{counts.maybe} maybe</span>}
            {counts.out > 0 && <span style={{ color: 'var(--as-danger)', fontWeight: 600 }}>{counts.out} out</span>}
            <span>{counts.noReply} no reply</span>
          </div>
        </>
      )}
      <EventHeroActions
        event={event} isStaff={isStaff} isGameType={isGameType} isPast={isPast}
        onEnterScore={onEnterScore} onLockRoster={onLockRoster} onNotify={onNotify}
        lockCount={counts.going + counts.maybe} onRsvpChange={onRsvpChange}
      />
    </div>
  );
}

EventDetailHero.Skeleton = function HeroSkeleton() {
  return (
    <div style={CARD(false)} aria-busy="true" aria-label="Loading event">
      <div style={{ ...SKELETON_BAR, height: 22, width: '70%' }} />
      <div style={{ ...SKELETON_BAR, height: 14, width: '60%', marginTop: 8 }} />
      <div style={{ ...SKELETON_BAR, height: 14, width: '50%', marginTop: 6 }} />
      <div style={{ ...SKELETON_BAR, height: 6, marginTop: 14 }} />
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <div style={{ ...SKELETON_BAR, flex: 1, height: 44 }} />
        <div style={{ ...SKELETON_BAR, flex: 1, height: 44 }} />
      </div>
    </div>
  );
};
