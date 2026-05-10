// Wave 3.12 — merges DB-backed comms_messages (drafts + scheduled)
// with synthetic items from useNeedsBriefing. Sorts by status priority.
//
// Wave 4.1b §6.F — viewFilter='drafts' renders ONLY in-progress drafts
// (no scheduled, no synthetic). Used by the new Drafts tab.
//
// Wave 4.1d-4 — pure client-side filter logic moved to clientFilters.js
// so it can be unit-tested without pulling the React tree. Team branch
// is now default-deny: synth rows that don't carry team scoping no
// longer fall through and bypass the chip filter.

import { useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useInboxQueue } from '../../../hooks/useInboxQueue';
import { useNeedsBriefing } from '../../../hooks/useNeedsBriefing';
import { sortPriority, statusFor } from '../../../lib/briefings/statusTable';
import { applyClientFilters } from './clientFilters';
import ActionQueueRow from './ActionQueueRow';
import EmptyState from './EmptyState';

export default function ActiveQueue({ filters, search, onAction, onCompose, onViewHistory, viewFilter }) {
  const { orgId } = useAuth();
  const { rows: dbRows } = useInboxQueue({ orgId });
  const { items: synthetic } = useNeedsBriefing({ orgId });

  const merged = useMemo(() => {
    if (viewFilter === 'drafts') {
      const drafts = (dbRows || []).filter((r) => r.status === 'draft');
      return applyClientFilters(drafts, filters, search);
    }
    const all = [...(dbRows || []), ...(synthetic || [])];
    const filtered = applyClientFilters(all, filters, search);
    return filtered.slice().sort((a, b) => sortPriority(a) - sortPriority(b));
  }, [dbRows, synthetic, filters, search, viewFilter]);

  if (!merged.length) {
    const filterActive = !!(filters?.kind || filters?.teams?.length || search?.trim());
    if (filterActive) return <EmptyState kind="filtered" onClearFilters={() => onAction(null, 'clear_filters')} />;
    if (viewFilter === 'drafts') return <EmptyState kind="drafts" onCompose={onCompose} />;
    return <EmptyState kind="active" onCompose={onCompose} onViewHistory={onViewHistory} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {merged.map((row) => (
        <ActionQueueRow key={row.synthetic_id || row.id} row={row} onAction={(r) => onAction(r, statusFor(r))} />
      ))}
    </div>
  );
}
