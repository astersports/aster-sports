// EVENT DETAIL HERO — DESIGN SYSTEM adoption (PR-V6, operator-graded
// 3/10 pre-adoption). Same rail anatomy as the schedule card (D1):
// team-colored time rail + content column; D3 word-grammar breakdown
// line; per-role actions via EventHeroActions (tri-state buttons, D4).
// Cancelled = red border + tag (V6 state matrix). Skeleton matches the
// rail anatomy so the card doesn't reshape on load.

import { Ban } from 'lucide-react';
import EventHeroActions from './EventHeroActions';
import { formatEventTitle } from '../../lib/eventTitle';
import { rsvpBreakdown } from '../../lib/rsvpEligibility';

const CARD = (cancelled) => ({
  margin: '12px 16px', borderRadius: 10, backgroundColor: 'var(--as-bg-card)',
  border: cancelled ? '1.5px solid var(--as-danger)' : '1px solid var(--as-border-default)',
  boxShadow: 'var(--as-shadow-sm)', display: 'flex', alignItems: 'stretch', overflow: 'hidden',
});
const SKELETON_BAR = { backgroundColor: 'var(--as-bg-secondary)', borderRadius: 4 };

const NY = 'America/New_York';
function fmtDate(iso) { return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: NY }); }
const railTime = (iso) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: NY }).split(' ');

export default function EventDetailHero({
  event, isStaff, isPast, rsvps, roster, activatedSet,
  onEnterScore, onLockRoster, onNotify, onRsvpChange,
}) {
  const isGameType = event.event_type === 'game' || event.event_type === 'tournament';
  const isCancelled = event.status === 'cancelled';
  const { prefix, body } = formatEventTitle(event);
  const counts = rsvpBreakdown(rsvps, roster);
  const total = (roster || []).length;
  const goingPct = total > 0 ? Math.round((counts.going / total) * 100) : 0;
  const maybePct = total > 0 ? Math.round((counts.maybe / total) * 100) : 0;
  const teamColor = event.teams?.team_color || 'var(--as-accent)';
  const [hm, mer] = railTime(event.start_at);
  // D3 detailed word grammar — same breakdown the schedule card reads.
  const breakdown = total > 0
    ? [`${counts.going} of ${total} going`,
       counts.maybe > 0 ? `${counts.maybe} maybe` : null,
       counts.out > 0 ? `${counts.out} can't` : null,
       counts.noReply > 0 ? `${counts.noReply} no reply` : null].filter(Boolean).join(' · ')
    : null;

  return (
    <div style={CARD(isCancelled)}>
      <div style={{ flexShrink: 0, width: 68, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, borderRight: '1px solid var(--as-border-subtle)', padding: '16px 0' }}>
        <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1, color: isPast ? 'var(--as-text-tertiary)' : teamColor }}>{hm}</span>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: 'var(--as-text-tertiary)' }}>{mer}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0, padding: '14px 16px' }}>
        {isCancelled && <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--as-danger)', backgroundColor: 'var(--as-danger-soft)', padding: '2px 8px', borderRadius: 4, marginBottom: 6 }}><Ban size={11} strokeWidth={1.75} />Cancelled</div>}
        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--as-text-primary)', lineHeight: 1.3, textDecoration: isCancelled ? 'line-through' : 'none' }}>{prefix}{body}</div>
        <div style={{ fontSize: 13, color: 'var(--as-text-secondary)', marginTop: 4 }}>
          {fmtDate(event.start_at)}{event.arrival_minutes_before > 0 ? ` · Arrive ${event.arrival_minutes_before} min early` : ''}
        </div>
        {event.location && (
          <div style={{ fontSize: 13, color: 'var(--as-text-tertiary)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {event.location}{event.jersey ? ` · Jersey: ${event.jersey}` : ''}
          </div>
        )}
        {breakdown && !isCancelled && (
          <div style={{ fontSize: 13, color: 'var(--as-text-tertiary)', marginTop: 6 }}>{breakdown}</div>
        )}
        {isStaff && isGameType && !isPast && total > 0 && (
          <div style={{ marginTop: 8, height: 6, borderRadius: 3, backgroundColor: 'var(--as-bg-tertiary)', overflow: 'hidden', display: 'flex' }} aria-label={`RSVP progress: ${counts.going} going of ${total}`}>
            <div style={{ width: `${goingPct}%`, backgroundColor: 'var(--as-success)', transition: 'width 150ms ease-out' }} />
            <div style={{ width: `${maybePct}%`, backgroundColor: 'var(--as-warning)', transition: 'width 150ms ease-out' }} />
          </div>
        )}
        <EventHeroActions
          event={event} isStaff={isStaff} isGameType={isGameType} isPast={isPast} activatedSet={activatedSet}
          onEnterScore={onEnterScore} onLockRoster={onLockRoster} onNotify={onNotify}
          lockCount={counts.going + counts.maybe} onRsvpChange={onRsvpChange}
        />
      </div>
    </div>
  );
}

EventDetailHero.Skeleton = function HeroSkeleton() {
  return (
    <div style={CARD(false)} aria-busy="true" aria-label="Loading event">
      <div style={{ flexShrink: 0, width: 68, borderRight: '1px solid var(--as-border-subtle)', padding: '16px 0', display: 'flex', justifyContent: 'center' }}>
        <div style={{ ...SKELETON_BAR, height: 24, width: 40 }} />
      </div>
      <div style={{ flex: 1, padding: '14px 16px' }}>
        <div style={{ ...SKELETON_BAR, height: 20, width: '70%' }} />
        <div style={{ ...SKELETON_BAR, height: 13, width: '55%', marginTop: 8 }} />
        <div style={{ ...SKELETON_BAR, height: 13, width: '45%', marginTop: 6 }} />
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <div style={{ ...SKELETON_BAR, flex: 1, height: 44 }} />
          <div style={{ ...SKELETON_BAR, flex: 1, height: 44 }} />
          <div style={{ ...SKELETON_BAR, flex: 1, height: 44 }} />
        </div>
      </div>
    </div>
  );
};
