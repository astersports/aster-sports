// Wave 3.11 follow-up — audience picker. Segmented control over 5
// built-in modes; emits (audience_type, audience_filter). Custom mode
// (cherry-pick) deferred to wave 4.0.
//
// Wave 4.1b §2 — Bug B. Audience copy is now driven by `audience`
// (output of computeAudience). Pilot mode states get a yellow chip
// + an explanation line; standard mode keeps the existing copy.

import { KIND_METADATA } from '../../lib/briefings/kindMetadata';
import { audienceCopy } from '../../lib/briefings/audience';
import PilotModeChip from './PilotModeChip';

const segWrap = { display: 'flex', flexWrap: 'wrap', gap: 6 };
const segBtn = (active) => ({
  flex: '1 1 auto', minHeight: 40, padding: '0 12px', borderRadius: 8,
  fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer',
  border: active ? '1.5px solid var(--as-accent)' : '1.5px solid var(--as-border-default)',
  backgroundColor: active ? 'var(--as-accent-soft)' : 'var(--as-bg-card)',
  color: active ? 'var(--as-text-primary)' : 'var(--as-text-secondary)',
});

const MODES = [
  { type: 'team', label: 'Single team' },
  { type: 'multi_team', label: 'Multi-team' },
  { type: 'tournament_attendees', label: 'Tournament' },
  { type: 'event_attendees', label: 'Event RSVPs' },
  { type: 'player_specific', label: 'Specific player(s)' },
  { type: 'org_all', label: 'All families' },
];

// D-2(γ-UI) — labels for audience types that aren't first-class modes
// but can be prepended as the kind's semantic default (coach_self for
// coach_roundup, family_specific for family_guide; multi_event_attendees
// surfaces here only via audienceLocked which goes through this map too).
const NON_MODE_LABELS = {
  coach_self: 'Coach only',
  family_specific: 'This family',
  multi_event_attendees: "Selected games' families",
};

function labelFor(type) {
  return MODES.find((m) => m.type === type)?.label || NON_MODE_LABELS[type] || type;
}

function modesAvailableFor(kind) {
  const meta = KIND_METADATA[kind] || {};
  if (meta.audienceLocked) return [{ type: meta.defaultAudienceType, label: labelFor(meta.defaultAudienceType) }];
  let modes;
  if (kind === 'weekly_digest') modes = MODES.filter((m) => ['org_all', 'team', 'multi_team'].includes(m.type));
  else if (kind === 'announcement') modes = MODES.filter((m) => ['team', 'org_all'].includes(m.type));
  else if (kind === 'game_recap' || kind === 'rsvp_nudge') modes = MODES.filter((m) => ['event_attendees', 'team'].includes(m.type));
  else if (kind === 'tournament_prelim' || kind === 'tournament_recap') modes = MODES.filter((m) => ['tournament_attendees'].includes(m.type));
  else if (kind === 'academy_callup_notice') modes = MODES.filter((m) => ['player_specific'].includes(m.type));
  // 5d-b-1: player_specific deferred (no wizard picker built yet);
  // academy_callup_notice still uses player_specific via the dedicated
  // EventDetailPage AcademyCallupCompose UI (audienceLocked path).
  else if (kind === 'custom_message') modes = MODES.filter((m) => m.type !== 'player_specific');
  else modes = MODES;

  // D-2(γ-UI) — if kindMetadata.defaultAudienceType isn't in the filtered
  // mode list (e.g. coach_self for coach_roundup, family_specific for
  // family_guide), prepend it so the admin sees the semantic default as
  // an active option. Without this, the picker silently coerces those
  // kinds to team/multi_team — the BUG B B4.1 mechanism that produced 21
  // wrong-but-CHECK-allowed rows in production for coach_roundup /
  // family_guide before the D-2(α) widening.
  const def = meta.defaultAudienceType;
  if (def && !modes.some((m) => m.type === def)) {
    modes = [{ type: def, label: labelFor(def) }, ...modes];
  }

  return modes;
}

export default function AudiencePicker({ kind, audienceType, audienceFilter, audience, recipientsLoading, onPick }) {
  const meta = KIND_METADATA[kind] || {};
  const locked = meta.audienceLocked;
  const modes = modesAvailableFor(kind);
  const a = audience || { filtered: null, total: null, mode: 'standard', pilotModeOn: false };
  // Wave 4.1d-2 §2.3 — when recipients haven't finished loading, force
  // "Computing audience…" instead of showing a 0-families flash.
  const showLoading = recipientsLoading && a.filtered === 0;
  const copy = showLoading ? 'Computing audience…' : audienceCopy(a);
  const showChip = a.pilotModeOn && (a.mode === 'pilot_zero' || a.mode === 'pilot_partial');
  const lineColor = a.mode === 'pilot_zero' ? 'var(--as-warning)' : 'var(--as-text-tertiary)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={segWrap}>
        {modes.map((m) => (
          <button key={m.type} type="button" disabled={locked} className="as-press"
            style={segBtn(m.type === audienceType)}
            onClick={() => !locked && onPick(m.type, audienceType === m.type ? audienceFilter : null)}>
            {m.label}
          </button>
        ))}
      </div>
      {showChip && <div><PilotModeChip /></div>}
      <div style={{ fontSize: 13, color: lineColor }}>
        {copy}
      </div>
    </div>
  );
}
