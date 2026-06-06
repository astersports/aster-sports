import { useMemo } from 'react';
import { useInboxQueue } from './useInboxQueue';
import { useAlertEvaluator } from './useAlertEvaluator';
import { useFamiliesOwingCount } from './useFamiliesOwingCount';
import { useAdminHomeSignals } from './useAdminHomeSignals';
import { alertToActionItem } from '../lib/home/coachHomeData';
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

export function useAdminNeedsYou({ orgId, activities, seasonId }) {
  const { rows: briefingRows, isLoading: briefingsLoading } = useInboxQueue({ orgId });
  const { alerts, loading: alertsLoading } = useAlertEvaluator();
  const { count: owingCount, totalCents: owingCents, loading: owingLoading } = useFamiliesOwingCount(orgId);
  const { actionItems, actionLoading } = useAdminHomeSignals(activities, orgId, seasonId);

  const items = useMemo(() => {
    const out = [];
    if ((briefingRows || []).length) {
      out.push({
        domain: 'comms', id: 'briefings', primary: 'Briefings', pinned: true,
        subtitle: `${briefingRows.length} to review`, to: '/admin/briefings/radar',
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
    for (const q of actionItems || []) {
      out.push({ domain: 'generic', id: `q-${q.kind}-${q.event_id || q.id || out.length}`, primary: q.primary, to: q.href || '/schedule' });
    }
    return out;
  }, [briefingRows, alerts, owingCount, owingCents, actionItems]);

  return {
    items: items.slice(0, CAP),
    overflowCount: Math.max(0, items.length - CAP),
    totalCount: items.length,
    loading: briefingsLoading || alertsLoading || owingLoading || actionLoading,
    onRsvpResolved: () => {},
  };
}
