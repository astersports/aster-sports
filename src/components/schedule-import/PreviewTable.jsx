// Wave 5 PR 2 — Step 2 UI orchestrator: bulk team picker + viewport-
// branched layout (desktop table vs mobile cards) + sticky-bottom
// commit footer. Per-row inline edit with NEW/UPDATED/DUP dedup
// labels and three-severity status indicators.

import { useEffect, useMemo, useState } from 'react';
import PreviewDesktopTable from './PreviewDesktopTable';
import PreviewMobileCards from './PreviewMobileCards';

const bulkInputStyle = { minHeight: 40, padding: '6px 10px', borderRadius: 8, border: '1px solid var(--as-border-default)', backgroundColor: '#fff', fontSize: 14, fontFamily: 'inherit', minWidth: 160 };

function useIsNarrow(breakpoint = 720) {
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && window.innerWidth < breakpoint);
  useEffect(() => {
    const onR = () => setNarrow(window.innerWidth < breakpoint);
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, [breakpoint]);
  return narrow;
}

export default function PreviewTable({ rows, validation, dedup, canCommit, onUpdateRow, onRemoveRow, onCommit, committing, teams }) {
  const narrow = useIsNarrow();
  const summary = useMemo(() => `${validation.valid} valid · ${validation.warning} warnings · ${validation.error} errors  |  ${dedup.new} new · ${dedup.updated} updated · ${dedup.duplicate} duplicate`, [validation, dedup]);
  const teamNames = (teams || []).map((t) => t.name);
  const someTeamMissing = rows.some((r) => !r.team);

  const applyTeamToAll = (name) => {
    if (!name) return;
    rows.forEach((_, i) => onUpdateRow(i, { team: name }));
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 'calc(96px + 80px + env(safe-area-inset-bottom, 0px))', paddingLeft: 12, paddingRight: 12 }}>
      <div style={{ padding: 12, backgroundColor: 'var(--as-bg-card)', borderRadius: 8, marginBottom: 12, fontSize: 14, color: 'var(--as-text-primary)' }}>{summary}</div>

      {teamNames.length > 0 && (
        <div style={{ padding: 12, backgroundColor: someTeamMissing ? 'var(--as-warning-soft)' : 'var(--as-bg-card)', border: `1px solid ${someTeamMissing ? 'var(--as-warning)' : 'var(--as-border-default)'}`, borderRadius: 8, marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <label htmlFor="bulk-team" style={{ fontSize: 13, fontWeight: 600, color: 'var(--as-text-primary)' }}>Set team for all rows:</label>
          <select id="bulk-team" defaultValue="" onChange={(e) => { applyTeamToAll(e.target.value); e.target.value = ''; }} style={bulkInputStyle}>
            <option value="">Select team…</option>
            {teamNames.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          {someTeamMissing && (
            <span style={{ fontSize: 12, color: 'var(--as-text-secondary)' }}>
              Parser couldn't infer the team from your paste. Pick it once here.
            </span>
          )}
        </div>
      )}

      {narrow
        ? <PreviewMobileCards rows={rows} teamNames={teamNames} onUpdateRow={onUpdateRow} onRemoveRow={onRemoveRow} />
        : <PreviewDesktopTable rows={rows} teamNames={teamNames} onUpdateRow={onUpdateRow} onRemoveRow={onRemoveRow} />}

      {/* Sticky commit footer — must clear the AppShell BottomNav
          (80px tall + safe-area-inset-bottom). zIndex 40 keeps it
          above content but below BottomNav (z-50). */}
      <div style={{ position: 'fixed', bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))', left: 0, right: 0, padding: '12px 16px', backgroundColor: 'var(--as-bg-card)', borderTop: '1px solid var(--as-border-default)', boxShadow: '0 -2px 6px rgba(0,0,0,0.08)', zIndex: 40, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCommit} disabled={!canCommit || committing} className="as-press"
          style={{ minHeight: 44, padding: '0 24px', borderRadius: 10, border: 'none', backgroundColor: canCommit ? 'var(--as-accent)' : 'var(--as-bg-tertiary)', color: canCommit ? 'var(--as-text-inverse)' : 'var(--as-text-tertiary)', fontSize: 15, fontWeight: 600, cursor: canCommit ? 'pointer' : 'not-allowed' }}>
          {committing ? 'Committing…' : `Commit ${dedup.new + dedup.updated} events`}
        </button>
      </div>
    </div>
  );
}
