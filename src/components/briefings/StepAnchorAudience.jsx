// Wave 3.11 follow-up — step 2 host. Anchor + audience pickers
// stacked vertically.
//
// Wave 4.1b §1 — Bug A: when anchor_kind requires an id (event /
// tournament / team) but anchor_id is null, surface an inline helper.
// Wave 4.1b §2 — Bug B: audience metadata flows in from composer parent.
//
// Audience one-control fix (item 1a) — the audience section is now ONE
// control (AudienceControl): a single chip showing the kind's smart
// default + a "Change" affordance that opens a filter-picker BottomSheet.
// This replaces the old sprawling button-grid + Recent/Favorites strip +
// inline TeamGroupedPicker + separate locked caption. Locked kinds render
// the chip disabled with a one-line reason inside AudienceControl. The
// team sub-selection (team_ids/team_id backward-compat) now lives in the
// sheet. Send-side SET_AUDIENCE contract is unchanged.

import AnchorPicker from './AnchorPicker';
import LockedAnchorChip from './LockedAnchorChip';
import PilotTestScopePicker from './PilotTestScopePicker';
import AudienceControl from './audience/AudienceControl';
import { ANCHOR_KINDS_REQUIRING_ID } from './composerReducer';
import { useOrgTeams } from '../../hooks/useOrgTeams';

const labelStyle = { fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--as-text-tertiary)', display: 'block', marginBottom: 8 };
const helperStyle = { fontSize: 13, color: 'var(--as-warning)', marginTop: 8, lineHeight: 1.4 };

const ANCHOR_NOUN = { event: 'event', tournament: 'tournament', team: 'team' };

export default function StepAnchorAudience({ state, dispatch, audience, recipientsLoading, pilotTestRecipientEmail }) {
  const { teams } = useOrgTeams();
  const needsId = ANCHOR_KINDS_REQUIRING_ID.has(state.anchor_kind) && !state.anchor_id;
  const noun = ANCHOR_NOUN[state.anchor_kind] || 'anchor';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <section>
        <span style={labelStyle}>Anchor</span>
        {state.anchor_id ? (
          <LockedAnchorChip anchorKind={state.anchor_kind} anchorId={state.anchor_id} onUnlock={() => dispatch({ type: 'CLEAR_ANCHOR' })} />
        ) : (
          <AnchorPicker
            kind={state.kind} anchorKind={state.anchor_kind} anchorId={state.anchor_id}
            onPick={(anchor_kind, anchor_id) => dispatch({ type: 'SET_ANCHOR', anchor_kind, anchor_id })} />
        )}
        {needsId && <div style={helperStyle} role="status">Pick a specific {noun} to continue.</div>}
      </section>
      <section>
        <span style={labelStyle}>Audience</span>
        <AudienceControl
          kind={state.kind} audienceType={state.audience_type} audienceFilter={state.audience_filter}
          audience={audience} recipientsLoading={recipientsLoading}
          onPick={(audience_type, audience_filter) => dispatch({ type: 'SET_AUDIENCE', audience_type, audience_filter })} />
      </section>
      <PilotTestScopePicker
        teams={teams} pilotTestRecipientEmail={pilotTestRecipientEmail}
        value={state.pilot_test_scope_team_id}
        onChange={(value) => dispatch({ type: 'SET_PILOT_TEST_SCOPE', value })} />
    </div>
  );
}
