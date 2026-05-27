// Cutover Wave PR 6 (PR C) — soft, non-blocking coverage-conflict banner
// in the schedule-import preview (Q4 = soft). For each coach double-
// booked across the import, lists the overlapping games and lets the
// admin reassign an IMPORT game to another coach (Q3 = any org coach).
// Reassigning stages delegated_coach_user_id on the row → detection
// re-runs → the cluster clears. Existing (already-committed) events show
// as read-only context. Mirrors the TournamentFormSheet soft-warning
// treatment (var(--em-warning-soft) left border).

import { AlertTriangle } from 'lucide-react';

const wrap = { marginBottom: 16, padding: 12, backgroundColor: 'var(--em-warning-soft)', borderLeft: '4px solid var(--em-warning)', borderRadius: 6 };
const selStyle = { minHeight: 36, padding: '0 8px', borderRadius: 8, border: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)', fontSize: 13, fontFamily: 'inherit', color: 'var(--em-text-primary)' };

const importIdx = (key) => (key.startsWith('import-') ? Number(key.slice(7)) : null);

export default function CoverageConflictBanner({ conflicts, coachNameMap, coachOptions, rows, onDelegate }) {
  if (!conflicts?.length) return null;
  return (
    <div role="region" aria-label="Coverage conflicts" style={{ maxWidth: 720, margin: '0 auto 8px' }}>
      {conflicts.map((c) => {
        const coachName = coachNameMap?.get(c.coach_user_id) || 'This coach';
        return (
          <div key={c.coach_user_id} style={wrap}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600, color: 'var(--em-text-primary)', marginBottom: 8 }}>
              <AlertTriangle size={16} strokeWidth={1.75} aria-hidden="true" color="var(--em-warning)" />
              Coverage conflict — {coachName}
            </div>
            <div style={{ fontSize: 13, color: 'var(--em-text-secondary)', marginBottom: 10 }}>
              {coachName} is booked for {c.events.length} overlapping games. Reassign one to free the clash.
            </div>
            {c.events.map((ev) => {
              const idx = importIdx(ev.key);
              const current = idx != null ? (rows[idx]?.delegated_coach_user_id || '') : '';
              return (
                <div key={ev.key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, color: 'var(--em-text-primary)', flex: 1, minWidth: 140 }}>{ev.label}</span>
                  {idx != null ? (
                    <select aria-label={`Reassign ${ev.label}`} value={current} style={selStyle}
                      onChange={(e) => onDelegate(idx, e.target.value || null)}>
                      <option value="">Keep {coachName}</option>
                      {(coachOptions || []).filter((o) => o.user_id !== c.coach_user_id).map((o) => (
                        <option key={o.user_id} value={o.user_id}>Move to {o.name}</option>
                      ))}
                    </select>
                  ) : (
                    <span style={{ fontSize: 12, color: 'var(--em-text-tertiary)' }}>existing event</span>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
