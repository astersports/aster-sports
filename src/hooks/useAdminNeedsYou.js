import { useMemo } from 'react';
import { useInboxQueue } from './useInboxQueue';
import { useAlertEvaluator } from './useAlertEvaluator';
import { useFamiliesOwingCount } from './useFamiliesOwingCount';
import { useAdminHomeSignals } from './useAdminHomeSignals';
import { alertToActionItem, summarizeActionQueue } from '../lib/home/coachHomeData';
import { formatCurrency } from '../lib/formatters';

// useAdminNeedsYou — owns the admin "Needs you" signals (shell contract v2).
// Contract order (Rule 2): Briefings PINNED FIRST (Radar; pilot gates the
// SEND, not this item) → RSVP shortfall (org-wide) → Payments overdue,
// GROUPED into one all-seasons item ($ total + family count). Other org
// alerts + the admin action queue fill remaining cap slots. Grouping holds
// the cap of 4 (R-c). The hooks own the fetching — the old self-fetching
// admin cards are retired (fixes the LCP fan-out).
const CAP = 4;
const HANDLED_ALERTS = new Set(['payment_overdue', 'briefing_overdue', 'rsvp_shortfall']);

export function useAdminNeedsYou({ orgId, activities, seasonId, nowMs, offSeason }) {
  const { rows: briefingRows, isLoading: briefingsLoading } = useInboxQueue({ orgId });
  const { alerts, loading: alertsLoading } = useAlertEvaluator();
  const { count: owingCount, totalCents: owingCents, loading: owingLoading } = useFamiliesOwingCount(orgId);
  const { actionItems, actionLoading } = useAdminHomeSignals(activities, orgId, seasonId);

  const items = useMemo(() => {
    // Off-season (D-D): the close-out queue replaces the in-season signals.
    // Reconcile finances surfaces ONLY when a balance is outstanding (amber);
    // Roll rosters always (cobalt → the rollover wizard, which opens the next
    // season's registration). Briefings/RSVP/queue are season-bound — dropped.
    if (offSeason) {
      const close = [];
      if (owingCount > 0) {
        close.push({
          domain: 'generic', id: 'reconcile', primary: 'Reconcile finances',
          subtitle: `${formatCurrency(owingCents)} outstanding`, to: '/admin/financials', severity: 'warning',
        });
      }
      close.push({
        domain: 'generic', id: 'roll-rosters', primary: 'Roll rosters',
        subtitle: 'Set up the next season', team_color: 'var(--as-accent)', to: '/admin/rollover',
      });
      return close;
    }
    const out = [];
    if ((briefingRows || []).length) {
      // D-E split: ready = comms_messages drafts, to-write = synthetic
      // needs-briefing rows, overdue = synthetic past their anchor (cadence).
      const ready = briefingRows.filter((r) => r.source === 'comms_messages').length;
      const synthetic = briefingRows.filter((r) => r.source === 'synthetic');
      const overdue = synthetic.filter((r) => r.anchor_time && new Date(r.anchor_time).getTime() < nowMs).length;
      const parts = [];
      if (ready) parts.push(`${ready} ready`);
      if (synthetic.length) parts.push(`${synthetic.length} to write`);
      if (overdue) parts.push(`${overdue} overdue`);
      out.push({
        domain: 'comms', id: 'briefings', primary: 'Briefings', pinned: true,
        subtitle: parts.join(' · ') || 'Open Radar', to: '/admin/briefings/radar',
      });
    }
    const rsvpAlert = (alerts || []).find((a) => a.alert_type_key === 'rsvp_shortfall');
    if (rsvpAlert) out.push(alertToActionItem(rsvpAlert));
    if (owingCount > 0) {
      out.push({
        domain: 'generic', id: 'payments', primary: 'Payments overdue',
        subtitle: `${formatCurrency(owingCents)} · ${owingCount} famil${owingCount === 1 ? 'y' : 'ies'}`,
        to: '/admin/financials',
      });
    }
    for (const a of alerts || []) {
      if (HANDLED_ALERTS.has(a.alert_type_key)) continue;
      out.push(alertToActionItem(a));
    }
    if ((actionItems || []).length) {
      out.push({
        domain: 'generic', id: 'admin-queue', primary: 'Action queue', queue: true,
        grouped: actionItems.length, subtitle: summarizeActionQueue(actionItems), to: '/schedule',
      });
    }
    return out;
  }, [offSeason, briefingRows, alerts, owingCount, owingCents, actionItems, nowMs]);

  return {
    items: items.slice(0, CAP),
    overflowCount: Math.max(0, items.length - CAP),
    totalCount: items.length,
    loading: briefingsLoading || alertsLoading || owingLoading || actionLoading,
    onRsvpResolved: () => {},
  };
}
