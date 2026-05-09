// Wave 3.12 — merges DB-backed comms_messages (drafts + scheduled)
// with synthetic items from useNeedsBriefing. Sorts by status priority.

import { useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useInboxQueue } from '../../../hooks/useInboxQueue';
import { useNeedsBriefing } from '../../../hooks/useNeedsBriefing';
import { sortPriority, statusFor } from '../../../lib/briefings/statusTable';
import ActionQueueRow from './ActionQueueRow';
import EmptyState from './EmptyState';

function applyClientFilters(rows, filters, search) {
  let out = rows;
  if (filters?.kind) out = out.filter((r) => r.kind === filters.kind);
  if (filters?.teams?.length) {
    out = out.filter((r) => {
      if (r.audience_filter?.team_ids) return r.audience_filter.team_ids.some((t) => filters.teams.includes(t));
      if (r.anchor_kind === 'team') return filters.teams.includes(r.anchor_id);
      return true;
    });
  }
  if (search?.trim()) {
    const q = search.trim().toLowerCase();
    out = out.filter((r) => (r.title || r.subject || '').toLowerCase().includes(q));
  }
  return out;
}

export default function ActiveQueue({ filters, search, onAction, onCompose, onViewHistory }) {
  const { orgId } = useAuth();
  const { rows: dbRows } = useInboxQueue({ orgId });
  const { items: synthetic } = useNeedsBriefing({ orgId });

  const merged = useMemo(() => {
    const all = [...(dbRows || []), ...(synthetic || [])];
    const filtered = applyClientFilters(all, filters, search);
    return filtered.slice().sort((a, b) => sortPriority(a) - sortPriority(b));
  }, [dbRows, synthetic, filters, search]);

  if (!merged.length) {
    const filterActive = !!(filters?.kind || filters?.teams?.length || search?.trim());
    if (filterActive) return <EmptyState kind="filtered" onClearFilters={() => onAction(null, 'clear_filters')} />;
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
