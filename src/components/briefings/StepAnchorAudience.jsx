// Wave 3.11 follow-up — step 2 host. Anchor + audience pickers
// stacked vertically.

import { useMemo } from 'react';
import AnchorPicker from './AnchorPicker';
import AudiencePicker from './AudiencePicker';
import { useDigestRecipients } from '../../hooks/useDigestRecipients';
import { useAuth } from '../../context/AuthContext';
import { useOrgSettings } from '../../hooks/useOrgSettings';

const labelStyle = { fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--em-text-tertiary)', display: 'block', marginBottom: 8 };

function audienceCount({ audienceType, audienceFilter, recipients, anchorId }) {
  if (!recipients) return null;
  if (audienceType === 'org_all') return recipients.length;
  if (audienceType === 'team') {
    const teamId = audienceFilter?.team_id || anchorId;
    return recipients.filter((r) => (r.team_ids || []).includes(teamId)).length;
  }
  if (audienceType === 'multi_team') {
    const ids = audienceFilter?.team_ids || (anchorId ? [anchorId] : []);
    if (!ids.length) return null;
    return recipients.filter((r) => (r.team_ids || []).some((t) => ids.includes(t))).length;
  }
  if (audienceType === 'tournament_attendees' || audienceType === 'event_attendees') {
    return null; // server-derived at dispatch; preview shown when sample resolves
  }
  return null;
}

export default function StepAnchorAudience({ state, dispatch }) {
  const { orgId } = useAuth();
  const { pilotModeEnabled } = useOrgSettings(orgId);
  const { recipients } = useDigestRecipients({ orgId, pilotOnly: pilotModeEnabled });
  const count = useMemo(() => audienceCount({
    audienceType: state.audience_type, audienceFilter: state.audience_filter,
    recipients, anchorId: state.anchor_id,
  }), [state.audience_type, state.audience_filter, recipients, state.anchor_id]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <section>
        <span style={labelStyle}>Anchor</span>
        <AnchorPicker
          kind={state.kind} anchorKind={state.anchor_kind} anchorId={state.anchor_id}
          onPick={(anchor_kind, anchor_id) => dispatch({ type: 'SET_ANCHOR', anchor_kind, anchor_id })} />
      </section>
      <section>
        <span style={labelStyle}>Audience</span>
        <AudiencePicker
          kind={state.kind} audienceType={state.audience_type} audienceFilter={state.audience_filter}
          anchorId={state.anchor_id} recipientCount={count}
          onPick={(audience_type, audience_filter) => dispatch({ type: 'SET_AUDIENCE', audience_type, audience_filter })} />
      </section>
    </div>
  );
}
