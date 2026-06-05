import { useCallback, useMemo, useState } from 'react';
import { usePendingRsvps } from './usePendingRsvps';
import { useRideNeeded } from './useRideNeeded';
import { useVolunteerSlots } from './useVolunteerSlots';
import { useInboxList } from './useInboxList';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const CAP = 4;

// useParentNeedsYou — owns the parent "Needs you" action signals (shell
// contract v2). Composes pending-RSVP / ride / volunteer + the latest unread
// briefing (the comms touchpoint, pilot-gated: absent when there's no unread
// briefing, never a blank slot). Capped at CAP with an overflow count for
// "see all". Inline RSVP resolves optimistically — onRsvpResolved drops the
// (event×player) item immediately, then refetches to reconcile.
export function useParentNeedsYou({ myChildren, activities, nowMs, userId }) {
  const next7days = useMemo(() => (activities || [])
    .filter((a) => {
      if (!a.start_at || a.status === 'cancelled') return false;
      const t = new Date(a.start_at).getTime();
      return t >= nowMs && t < nowMs + SEVEN_DAYS_MS;
    })
    .sort((a, b) => new Date(a.start_at) - new Date(b.start_at)), [activities, nowMs]);

  const { pending, loading: rsvpLoading, refetch: refetchRsvps } = usePendingRsvps(myChildren, next7days);
  const { needed: rides, loading: rideLoading } = useRideNeeded(myChildren, next7days, userId);
  const { items: volunteers, loading: volLoading } = useVolunteerSlots(myChildren, next7days);
  const { items: inbox, loading: inboxLoading } = useInboxList();

  const [dismissed, setDismissed] = useState(() => new Set());
  const onRsvpResolved = useCallback((eventId, playerId) => {
    setDismissed((prev) => new Set(prev).add(`${eventId}:${playerId}`));
    Promise.resolve().then(refetchRsvps);
  }, [refetchRsvps]);

  const childById = useMemo(() => new Map((myChildren || []).map((k) => [k.playerId, k])), [myChildren]);
  const eventTypeById = useMemo(() => new Map(next7days.map((e) => [e.id, e.event_type])), [next7days]);

  const commsItem = useMemo(() => {
    const unread = (inbox || []).find((it) => !it.opened_at);
    if (!unread) return null;
    return { domain: 'comms', id: `comms-${unread.id}`, message_id: unread.message_id, subject: unread.subject };
  }, [inbox]);

  const items = useMemo(() => {
    const rsvpItems = (pending || [])
      .filter((p) => !dismissed.has(`${p.event_id}:${p.player_id}`))
      .map((p) => ({
        ...p, domain: 'rsvp', id: `rsvp-${p.event_id}-${p.player_id}`,
        child: childById.get(p.player_id) || { playerId: p.player_id, firstName: p.kid_first_name },
        eventType: eventTypeById.get(p.event_id) || null,
      }));
    const rideItems = (rides || []).map((r) => ({ ...r, domain: 'ride', id: `ride-${r.event_id}-${r.player_id}` }));
    const volItems = (volunteers || []).map((v) => ({ ...v, domain: 'volunteer', id: `vol-${v.event_id}` }));
    const actionable = [...rsvpItems, ...rideItems, ...volItems]
      .sort((a, b) => new Date(a.start_at || 0) - new Date(b.start_at || 0));
    // Comms sits just under the most-urgent action (parent render order).
    const out = [...actionable];
    if (commsItem) out.splice(Math.min(1, out.length), 0, commsItem);
    return out;
  }, [pending, rides, volunteers, commsItem, dismissed, childById, eventTypeById]);

  return {
    items: items.slice(0, CAP),
    overflowCount: Math.max(0, items.length - CAP),
    totalCount: items.length,
    loading: rsvpLoading || rideLoading || volLoading || inboxLoading,
    onRsvpResolved,
  };
}
