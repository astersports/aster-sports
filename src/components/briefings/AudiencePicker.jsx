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
  border: active ? '1.5px solid var(--em-accent)' : '1.5px solid var(--em-border-default)',
  backgroundColor: active ? 'var(--em-accent-soft)' : 'var(--em-bg-card)',
  color: active ? 'var(--em-text-primary)' : 'var(--em-text-secondary)',
});

const MODES = [
  { type: 'team', label: 'Single team' },
  { type: 'multi_team', label: 'Multi-team' },
  { type: 'tournament_attendees', label: 'Tournament' },
  { type: 'event_attendees', label: 'Event RSVPs' },
  { type: 'player_specific', label: 'Specific player(s)' },
  { type: 'org_all', label: 'All families' },
];

function modesAvailableFor(kind) {
  const meta = KIND_METADATA[kind] || {};
  if (meta.audienceLocked) return [{ type: meta.defaultAudienceType, label: MODES.find((m) => m.type === meta.defaultAudienceType)?.label || meta.defaultAudienceType }];
  if (kind === 'weekly_digest') return MODES.filter((m) => ['org_all', 'team', 'multi_team'].includes(m.type));
  if (kind === 'announcement') return MODES.filter((m) => ['team', 'org_all'].includes(m.type));
  if (kind === 'game_recap' || kind === 'rsvp_nudge') return MODES.filter((m) => ['event_attendees', 'team'].includes(m.type));
  if (kind === 'tournament_prelim' || kind === 'tournament_recap') return MODES.filter((m) => ['tournament_attendees'].includes(m.type));
  if (kind === 'academy_callup_notice') return MODES.filter((m) => ['player_specific'].includes(m.type));
  // 5d-b-1: player_specific deferred (no wizard picker built yet);
  // academy_callup_notice still uses player_specific via the dedicated
  // EventDetailPage AcademyCallupCompose UI (audienceLocked path).
  if (kind === 'custom_message') return MODES.filter((m) => m.type !== 'player_specific');
  return MODES;
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
  const lineColor = a.mode === 'pilot_zero' ? 'var(--em-warning)' : 'var(--em-text-tertiary)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={segWrap}>
        {modes.map((m) => (
          <button key={m.type} type="button" disabled={locked} className="em-press"
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
