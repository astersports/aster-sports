import { memo } from 'react';
import { useNow } from '../../hooks/useNow';
import { shouldAutoExpandLocation } from '../../lib/eventWindows';
import CollapsibleSection from '../shared/CollapsibleSection';
import EventLocationTab from './EventLocationTab';

// 2026-05-21 (EventDetail perf pass) — useNow lifted OUT of EventDetailPage
// into this slot, mirroring the TeamDetailHeroSlot pattern from PR #428
// (Teams audit C7). Without this wrapper, the 60s useNow tick re-renders
// the entire EventDetailPage subtree (EventRosterLockSection, all
// CollapsibleSections, EventDutiesTab, EventCommentsTab, EventBriefingHistory)
// even though only the Location section's defaultOpen depends on time.
//
// CollapsibleSection consumes defaultOpen as a useState initializer, so
// the value is only read once per mount — but the page-level useNow
// still forced a full reconciliation every minute. Lifting confines the
// tick to this leaf.
function EventLocationSlot({ role, event, teamId, myChildren, rsvps }) {
  const nowMs = useNow();
  const locationAutoExpand = shouldAutoExpandLocation({ role, event, nowMs, teamId, myChildren, rsvps });
  return (
    <CollapsibleSection title="Location" sectionKey="location" defaultOpen={locationAutoExpand} subtitle={event.location || 'TBD'}>
      <EventLocationTab event={event} />
    </CollapsibleSection>
  );
}

export default memo(EventLocationSlot);
