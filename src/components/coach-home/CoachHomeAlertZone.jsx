import AlertZone from '../alerts/AlertZone';
import ActionZone from '../home/ActionZone';

// Alert + action queue zone for CoachHomePage. Extracted from
// CoachHomePage in the preemptive split arc per L99 platform audit
// PART 5 Phase 4 / PQ3 (2026-05-21). Pure presentational; receives
// alerts + action items from useCoachHomeSignals via the parent
// page. The two shells are co-located here because both are
// alert-flavored queues that surface at the top of the page above
// the calendar / schedule content.
export default function CoachHomeAlertZone({
  alerts,
  alertsLoading,
  actionItems,
  actionItemsLoading,
}) {
  return (
    <>
      <AlertZone alerts={alerts} loading={alertsLoading} variant="collapsible" sectionLabel="ALERTS" />
      <ActionZone items={actionItems} loading={actionItemsLoading} sectionKey="coach-action-zone" />
    </>
  );
}
