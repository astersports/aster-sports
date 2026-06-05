// Audience one-control fix (item 1a) — the "Change audience" sheet.
// A filter-picker BottomSheet (§6 / anti-pattern #15 compliant: it picks
// a filter, it is not a 3+-field form). Lists ONLY the valid modes for
// the current kind + Recent/Favorites. Picking a non-team mode applies
// and closes; team/multi_team reveals the in-sheet TeamGroupedPicker so
// the admin completes the selection before confirming.

import { useState } from 'react';
import { Check } from 'lucide-react';
import BottomSheet from '../../shared/BottomSheet';
import TeamGroupedPicker from './TeamGroupedPicker';
import RecentAndFavorites from './RecentAndFavorites';
import { modesForKind } from '../../../lib/briefings/audienceModes';
import { useOrgTeams } from '../../../hooks/useOrgTeams';

const sheetTitle = { fontSize: 15, fontWeight: 600, color: 'var(--as-text-primary)', margin: '4px 0 12px' };
const sectionLabel = { fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--as-text-tertiary)', margin: '12px 0 8px' };
const list = { display: 'flex', flexDirection: 'column', gap: 8 };
const optBtn = (active) => ({
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
  width: '100%', minHeight: 44, padding: '0 14px', borderRadius: 10,
  fontSize: 14, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left',
  border: active ? '1.5px solid var(--as-accent)' : '1.5px solid var(--as-border-default)',
  backgroundColor: active ? 'var(--as-accent-soft)' : 'var(--as-bg-card)',
  color: active ? 'var(--as-text-primary)' : 'var(--as-text-secondary)',
});
const doneBtn = {
  width: '100%', minHeight: 44, marginTop: 16, borderRadius: 10, border: 'none',
  fontSize: 15, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
  backgroundColor: 'var(--as-accent)', color: 'var(--as-text-inverse)',
};
const emptyHint = { fontSize: 13, color: 'var(--as-text-tertiary)', padding: '8px 4px', lineHeight: 1.4 };

const NEEDS_SUBPICK = new Set(['team', 'multi_team']);

function teamIdsFromFilter(filter) {
  if (Array.isArray(filter?.team_ids) && filter.team_ids.length) return filter.team_ids;
  if (filter?.team_id) return [filter.team_id];
  return [];
}

export default function AudienceSheet({ open, onClose, kind, audienceType, audienceFilter, onApply }) {
  const { teams } = useOrgTeams();
  const modes = modesForKind(kind);
  // Draft selection lives in local state so the team sub-picker can be
  // completed before the admin confirms — applying only on Done / direct tap.
  const [draftType, setDraftType] = useState(audienceType);
  const [draftTeamIds, setDraftTeamIds] = useState(teamIdsFromFilter(audienceFilter));

  const applyAndClose = (type, filter) => { onApply(type, filter); onClose(); };

  const pickMode = (type) => {
    if (NEEDS_SUBPICK.has(type)) {
      // Reveal the sub-picker; keep prior team_ids when staying in a team mode.
      setDraftType(type);
      setDraftTeamIds((prev) => (NEEDS_SUBPICK.has(draftType) ? prev : []));
      return;
    }
    applyAndClose(type, null);
  };

  const confirmTeams = () => applyAndClose(draftType, { team_ids: draftTeamIds });
  const showSubPicker = NEEDS_SUBPICK.has(draftType);

  return (
    <BottomSheet open={open} onClose={onClose} initialHeight="70%" expandedHeight="90%">
      <div role="group" aria-label="Choose audience">
        <h2 style={sheetTitle}>Who should get this?</h2>

        <div style={sectionLabel}>Audience</div>
        <div style={list}>
          {modes.map((m) => {
            const active = m.type === draftType;
            return (
              <button key={m.type} type="button" className="as-press" style={optBtn(active)}
                aria-pressed={active} aria-label={`Send to ${m.label}`} onClick={() => pickMode(m.type)}>
                <span>{m.label}</span>
                {active && <Check size={18} strokeWidth={1.75} color="var(--as-accent)" aria-hidden="true" />}
              </button>
            );
          })}
        </div>

        {showSubPicker && (
          <>
            <div style={sectionLabel}>{draftType === 'multi_team' ? 'Pick teams' : 'Pick a team'}</div>
            {teams.length === 0 ? (
              <div style={emptyHint}>No teams yet — add a team first, then you can send to it.</div>
            ) : (
              <TeamGroupedPicker teams={teams} value={draftTeamIds} mode={draftType} onChange={setDraftTeamIds} />
            )}
            <button type="button" className="as-press" style={doneBtn}
              disabled={draftTeamIds.length === 0}
              aria-label="Apply team selection"
              onClick={confirmTeams}>
              Done
            </button>
          </>
        )}

        {/* RecentAndFavorites renders its own Recent/Favorites headers and
            returns null when both are empty — so no orphan label here. */}
        <div style={{ marginTop: 16 }}>
          <RecentAndFavorites onApply={(type, filter) => applyAndClose(type, filter)} />
        </div>
      </div>
    </BottomSheet>
  );
}
