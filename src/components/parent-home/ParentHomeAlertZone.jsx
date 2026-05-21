import AlertZone from '../alerts/AlertZone';
import ConflictCallout from '../home/ConflictCallout';
import ActionZone from '../home/ActionZone';

// Alert + conflict + action queue zone for ParentHomePage. Extracted
// from ParentHomePage in the preemptive split arc per L99 platform
// audit PART 5 Phase 4 / PQ3 (2026-05-21). Pure presentational; the
// parent-relevance-filtered alerts come from useAlertEvaluator +
// filterAlertsForParent in the parent page, and the action items +
// conflicts come from useParentHomeSignals.
export default function ParentHomeAlertZone({
  alerts,
  alertsLoading,
  conflicts,
  actionItems,
  actionItemsLoading,
}) {
  return (
    <>
      <AlertZone alerts={alerts} loading={alertsLoading} variant="collapsible" sectionLabel="ALERTS" />
      <ConflictCallout conflicts={conflicts} />
      <ActionZone items={actionItems} loading={actionItemsLoading} sectionKey="parent-action-zone" />
    </>
  );
}
