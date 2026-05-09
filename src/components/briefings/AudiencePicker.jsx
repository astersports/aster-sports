// Wave 3.11 follow-up — audience picker. Segmented control over 5
// built-in modes; emits (audience_type, audience_filter). Custom mode
// (cherry-pick) deferred to wave 4.0.

import { KIND_METADATA } from '../../lib/briefings/kindMetadata';

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
  { type: 'org_all', label: 'All families' },
];

function modesAvailableFor(kind) {
  const meta = KIND_METADATA[kind] || {};
  if (meta.audienceLocked) return [{ type: meta.defaultAudienceType, label: MODES.find((m) => m.type === meta.defaultAudienceType)?.label || meta.defaultAudienceType }];
  if (kind === 'weekly_digest') return MODES.filter((m) => ['org_all', 'team', 'multi_team'].includes(m.type));
  if (kind === 'announcement') return MODES.filter((m) => ['team', 'org_all'].includes(m.type));
  if (kind === 'game_recap' || kind === 'rsvp_nudge') return MODES.filter((m) => ['event_attendees', 'team'].includes(m.type));
  if (kind === 'tournament_prelim' || kind === 'tournament_recap') return MODES.filter((m) => ['tournament_attendees'].includes(m.type));
  if (kind === 'custom_message') return MODES;
  return MODES;
}

export default function AudiencePicker({ kind, audienceType, audienceFilter, recipientCount, onPick }) {
  const meta = KIND_METADATA[kind] || {};
  const locked = meta.audienceLocked;
  const modes = modesAvailableFor(kind);
  const audienceLabel = recipientCount == null
    ? 'Computing audience…'
    : `Will send to ${recipientCount} ${recipientCount === 1 ? 'family' : 'families'}.`;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={segWrap}>
        {modes.map((m) => (
          <button key={m.type} type="button" disabled={locked} className="sf-press"
            style={segBtn(m.type === audienceType)}
            onClick={() => !locked && onPick(m.type, audienceType === m.type ? audienceFilter : null)}>
            {m.label}
          </button>
        ))}
      </div>
      <div style={{ fontSize: 13, color: 'var(--em-text-tertiary)' }}>
        {audienceLabel}
      </div>
    </div>
  );
}
