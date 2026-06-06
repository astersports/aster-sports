import { useCallback, useMemo } from 'react';
import { usePendingRsvps } from './usePendingRsvps';
import { useRideNeeded } from './useRideNeeded';
import { useVolunteerSlots } from './useVolunteerSlots';
import { useInboxList } from './useInboxList';
import { isRsvpClosingSoon, rsvpCloseLabel } from '../lib/rsvpDeadline';

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

  // Inline RSVP resolution: refetch and let usePendingRsvps re-derive the
  // pending set. ChildRsvp.onSave fires on BOTH set and CLEAR — relying on
  // the refetch (not a local dismissed-Set) means a cleared RSVP correctly
  // reappears as pending instead of being permanently hidden.
  const onRsvpResolved = useCallback(() => {
    Promise.resolve().then(refetchRsvps);
  }, [refetchRsvps]);

  const childById = useMemo(() => new Map((myChildren || []).map((k) => [k.playerId, k])), [myChildren]);
  const eventTypeById = useMemo(() => new Map(next7days.map((e) => [e.id, e.event_type])), [next7days]);

  const commsItem = useMemo(() => {
    const unread = (inbox || []).find((it) => !it.opened_at);
    if (!unread) return null;
    // The comms card is a received BRIEFING — open it in the inbox (deep-link
    // by recipient id), NOT team chat. There is no Inbox nav tab, so this card
    // is the parent's only path to the briefing.
    return { domain: 'comms', id: `comms-${unread.id}`, message_id: unread.message_id, subject: unread.subject, from: unread.from, to: `/inbox?r=${unread.id}` };
  }, [inbox]);

  const items = useMemo(() => {
    const rsvpItems = (pending || [])
      .map((p) => ({
        ...p, domain: 'rsvp', id: `rsvp-${p.event_id}-${p.player_id}`,
        child: childById.get(p.player_id) || { playerId: p.player_id, firstName: p.kid_first_name },
        eventType: eventTypeById.get(p.event_id) || null,
        // #1b deadline chip + #1a urgent tint, rendered by ActionRow.
        rsvpCloseLabel: rsvpCloseLabel(p.start_at, nowMs),
        isSoon: isRsvpClosingSoon(p.start_at, nowMs),
      }));
    const rideItems = (rides || []).map((r) => ({ ...r, domain: 'ride', id: `ride-${r.event_id}-${r.player_id}` }));
    const volItems = (volunteers || []).map((v) => ({ ...v, domain: 'volunteer', id: `vol-${v.event_id}` }));
    const actionable = [...rsvpItems, ...rideItems, ...volItems]
      .sort((a, b) => new Date(a.start_at || 0) - new Date(b.start_at || 0));
    // Comms sits just under the most-urgent action (parent render order).
    const out = [...actionable];
    if (commsItem) out.splice(Math.min(1, out.length), 0, commsItem);
    return out;
  }, [pending, rides, volunteers, commsItem, childById, eventTypeById, nowMs]);

  return {
    items: items.slice(0, CAP),
    overflowCount: Math.max(0, items.length - CAP),
    totalCount: items.length,
    loading: rsvpLoading || rideLoading || volLoading || inboxLoading,
    onRsvpResolved,
  };
}
