// Audience one-control fix (item 1a) — collapses the old sprawling
// audience button-grid into ONE control: a single chip showing the
// kind's smart default + a "Change" affordance that opens AudienceSheet
// (a filter-picker BottomSheet). Locked kinds (schedule_change,
// games_recap, academy_callup_notice) render a disabled chip with a
// one-line reason instead of "Change".
//
// The recipient-preview line ("Will send to N families.") stays right
// under the chip so the admin always sees who receives it before send.
// This is a UI refactor — the chip/sheet dispatch the same SET_AUDIENCE
// (audience_type, audience_filter) the rest of the composer + send
// pipeline already consume.

import { useMemo, useState } from 'react';
import { Lock, Pencil } from 'lucide-react';
import AudienceSheet from './AudienceSheet';
import PilotModeChip from '../PilotModeChip';
import { useOrgTeams } from '../../../hooks/useOrgTeams';
import { audienceCopy } from '../../../lib/briefings/audience';
import { deriveChipLabel, isAudienceLocked, lockedReasonFor } from '../../../lib/briefings/audienceModes';

const row = { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' };
const chip = (locked) => ({
  display: 'flex', alignItems: 'center', gap: 8, minHeight: 44, padding: '0 14px',
  borderRadius: 10, border: '1.5px solid var(--as-border-default)',
  backgroundColor: locked ? 'var(--as-bg-tertiary)' : 'var(--as-accent-soft)',
  color: 'var(--as-text-primary)', fontSize: 14, fontWeight: 600, fontFamily: 'inherit',
});
const changeBtn = {
  display: 'flex', alignItems: 'center', gap: 6, minHeight: 44, padding: '0 12px',
  borderRadius: 10, border: '1.5px solid var(--as-accent)', backgroundColor: 'var(--as-bg-card)',
  color: 'var(--as-accent)', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
};
const lockedReason = { fontSize: 12, color: 'var(--as-text-secondary)' };
const previewLine = (color) => ({ fontSize: 13, color, marginTop: 2 });

export default function AudienceControl({ kind, audienceType, audienceFilter, audience, recipientsLoading, onPick }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { teams } = useOrgTeams();
  const teamsById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);
  const locked = isAudienceLocked(kind);

  const chipLabel = deriveChipLabel(audienceType, audienceFilter, teamsById);
  const a = audience || { filtered: null, total: null, mode: 'standard', pilotModeOn: false };
  const showLoading = recipientsLoading && a.filtered === 0;
  const copy = showLoading ? 'Computing audience…' : audienceCopy(a);
  const showPilotChip = a.pilotModeOn && (a.mode === 'pilot_zero' || a.mode === 'pilot_partial');
  const lineColor = a.mode === 'pilot_zero' ? 'var(--as-warning)' : 'var(--as-text-tertiary)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={row}>
        <span style={chip(locked)} data-testid="audience-chip" aria-label={`Audience: ${chipLabel}`}>
          {locked && <Lock size={14} strokeWidth={1.75} color="var(--as-text-tertiary)" aria-hidden="true" />}
          {chipLabel}
        </span>
        {locked ? (
          <span style={lockedReason} role="note" data-testid="audience-locked-reason">{lockedReasonFor(kind)}</span>
        ) : (
          <button type="button" className="as-press" style={changeBtn} data-testid="audience-change"
            aria-haspopup="dialog" aria-expanded={sheetOpen}
            aria-label="Change audience" onClick={() => setSheetOpen(true)}>
            <Pencil size={16} strokeWidth={1.75} aria-hidden="true" />
            Change
          </button>
        )}
      </div>

      {showPilotChip && <div><PilotModeChip /></div>}
      <div style={previewLine(lineColor)} role="status" data-testid="audience-recipient-preview">{copy}</div>

      {!locked && sheetOpen && (
        <AudienceSheet
          open={sheetOpen} onClose={() => setSheetOpen(false)}
          kind={kind} audienceType={audienceType} audienceFilter={audienceFilter}
          onApply={(type, filter) => onPick(type, filter)}
        />
      )}
    </div>
  );
}
