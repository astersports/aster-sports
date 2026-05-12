// Wave 3.12 — merges DB-backed comms_messages (drafts + scheduled) with
// synthetic items.
//
// Wave 4.1b §6.F — viewFilter='drafts' renders ONLY in-progress drafts
// (no scheduled, no synthetic). Used by the new Drafts tab.
//
// Wave 4.8 6c (PR #120) — useInboxQueue now serves a UNIFIED set
// (DB-backed drafts/scheduled + synthetic game_recap / tournament_prelim
// / tournament_recap) via briefing_active_queue RPC. Filter chips
// (kind / teams / dateRange) thread through as RPC params. The remaining
// client-side synth surface (weekly_digest_due via useNeedsBriefing) is
// merged in here as a safety net; dedupe by (kind, anchor_id) prefers
// the RPC row if both produce the same anchor.

import { useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useInboxQueue } from '../../../hooks/useInboxQueue';
import { useNeedsBriefing } from '../../../hooks/useNeedsBriefing';
import { sortPriority, statusFor } from '../../../lib/briefings/statusTable';
import { applyClientFilters } from './clientFilters';
import ActionQueueRow from './ActionQueueRow';
import EmptyState from './EmptyState';

function dedupeByAnchor(primary, safetyNet) {
  const seen = new Set(primary.map((r) => `${r.kind}|${r.anchor_id || ''}`));
  const extras = safetyNet.filter((r) => !seen.has(`${r.kind}|${r.anchor_id || ''}`));
  return [...primary, ...extras];
}

export default function ActiveQueue({ filters, search, onAction, onCompose, onViewHistory, viewFilter }) {
  const { orgId } = useAuth();
  const { rows: dbRows } = useInboxQueue({
    orgId,
    kind: filters?.kind || null,
    teamIds: filters?.teams?.length ? filters.teams : null,
    dateRange: filters?.dateRange || 'last_14_days',
  });
  const { items: safetyNet } = useNeedsBriefing({ orgId });

  const merged = useMemo(() => {
    if (viewFilter === 'drafts') {
      const drafts = (dbRows || []).filter((r) => r.source !== 'synthetic' && r.status === 'draft');
      return applyClientFilters(drafts, filters, search);
    }
    const combined = dedupeByAnchor(dbRows || [], safetyNet || []);
    const filtered = applyClientFilters(combined, filters, search);
    return filtered.slice().sort((a, b) => sortPriority(a) - sortPriority(b));
  }, [dbRows, safetyNet, filters, search, viewFilter]);

  if (!merged.length) {
    const filterActive = !!(filters?.kind || filters?.teams?.length || search?.trim());
    if (filterActive) return <EmptyState kind="filtered" onClearFilters={() => onAction(null, 'clear_filters')} />;
    if (viewFilter === 'drafts') return <EmptyState kind="drafts" onCompose={onCompose} />;
    return <EmptyState kind="active" onCompose={onCompose} onViewHistory={onViewHistory} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {merged.map((row) => (
        <ActionQueueRow key={row.id || row.synthetic_id || `${row.kind}-${row.anchor_id}`} row={row} onAction={(r) => onAction(r, statusFor(r))} />
      ))}
    </div>
  );
}
