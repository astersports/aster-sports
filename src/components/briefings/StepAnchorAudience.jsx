// Wave 3.11 follow-up — step 2 host. Anchor + audience pickers
// stacked vertically.
//
// Wave 4.1b §1 — Bug A: when anchor_kind requires an id (event /
// tournament / team) but anchor_id is null, surface an inline helper.
// Wave 4.1b §2 — Bug B: audience metadata flows in from composer parent.
//
// Wave 4.4-B Session 5d-b-1:
//   - When kind has audienceLocked=true: hide the AudiencePicker
//     entirely and show a static "Audience: X (locked)" caption.
//   - When audience_type is 'team' or 'multi_team': render the new
//     TeamGroupedPicker below the segmented picker for sub-selection.
//   - team_ids/team_id backward-compat shim — old singular field still
//     works for in-flight drafts saved pre-5d-b-1.

import AnchorPicker from './AnchorPicker';
import AudiencePicker from './AudiencePicker';
import LockedAnchorChip from './LockedAnchorChip';
import PilotTestScopePicker from './PilotTestScopePicker';
import TeamGroupedPicker from './audience/TeamGroupedPicker';
import RecentAndFavorites from './audience/RecentAndFavorites';
import { ANCHOR_KINDS_REQUIRING_ID } from './composerReducer';
import { KIND_METADATA } from '../../lib/briefings/kindMetadata';
import { useOrgTeams } from '../../hooks/useOrgTeams';

const labelStyle = { fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--as-text-tertiary)', display: 'block', marginBottom: 8 };
const helperStyle = { fontSize: 13, color: 'var(--as-warning)', marginTop: 8, lineHeight: 1.4 };
const lockedCaption = { fontSize: 13, color: 'var(--as-text-secondary)', padding: '10px 12px', borderRadius: 10, backgroundColor: 'var(--as-bg-tertiary)', border: '1px solid var(--as-border-default)' };
const inlineHint = { fontSize: 12, color: 'var(--as-text-tertiary)', padding: '8px 4px' };

const ANCHOR_NOUN = { event: 'event', tournament: 'tournament', team: 'team' };
const AUDIENCE_LABEL = {
  team: 'Team', multi_team: 'Multiple teams',
  tournament_attendees: 'Tournament attendees',
  event_attendees: 'Event attendees',
  player_specific: 'Specific player(s)',
  multi_event_attendees: 'Selected games’ families',
  org_all: 'All families',
  // D-2(γ-UI) — labels for kindMetadata defaults that previously fell
  // through to raw enum text in the locked-caption render path.
  coach_self: 'Coach only',
  family_specific: 'This family',
};

// 5d-b-1 backward-compat: prefer .team_ids[] (new), fall back to .team_id
// (legacy singular) so drafts saved pre-5d-b-1 still hydrate cleanly.
function teamIdsFromFilter(filter) {
  if (Array.isArray(filter?.team_ids) && filter.team_ids.length) return filter.team_ids;
  if (filter?.team_id) return [filter.team_id];
  return [];
}

function renderAudienceSubPicker(state, dispatch, teams) {
  const t = state.audience_type;
  if (t === 'team' || t === 'multi_team') {
    const value = teamIdsFromFilter(state.audience_filter);
    return (
      <TeamGroupedPicker
        teams={teams} value={value} mode={t}
        onChange={(team_ids) => dispatch({ type: 'SET_AUDIENCE', audience_type: t, audience_filter: { team_ids } })}
      />
    );
  }
  if (t === 'org_all') return <div style={inlineHint}>All families in your organization will receive this briefing.</div>;
  if (t === 'event_attendees') return <div style={inlineHint}>Recipients are derived from the anchor event's team at send time.</div>;
  if (t === 'tournament_attendees') return <div style={inlineHint}>Recipients are derived from the anchor tournament's rosters at send time.</div>;
  return null;
}

export default function StepAnchorAudience({ state, dispatch, audience, recipientsLoading, pilotTestRecipientEmail }) {
  const { teams } = useOrgTeams();
  const meta = KIND_METADATA[state.kind] || {};
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
        {meta.audienceLocked ? (
          <div style={lockedCaption} data-testid="audience-locked-caption">
            {AUDIENCE_LABEL[state.audience_type] || state.audience_type} (locked)
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* 5d-b-2: Recent + Favorite audiences above the segmented
                picker. One-tap apply (stays on Step 2; admin reviews
                the selection in TeamGroupedPicker below before Next). */}
            <RecentAndFavorites onApply={(audience_type, audience_filter) => dispatch({ type: 'SET_AUDIENCE', audience_type, audience_filter })} />
            <AudiencePicker
              kind={state.kind} audienceType={state.audience_type} audienceFilter={state.audience_filter}
              audience={audience} recipientsLoading={recipientsLoading}
              onPick={(audience_type, audience_filter) => dispatch({ type: 'SET_AUDIENCE', audience_type, audience_filter })} />
            {renderAudienceSubPicker(state, dispatch, teams)}
          </div>
        )}
      </section>
      <PilotTestScopePicker
        teams={teams} pilotTestRecipientEmail={pilotTestRecipientEmail}
        value={state.pilot_test_scope_team_id}
        onChange={(value) => dispatch({ type: 'SET_PILOT_TEST_SCOPE', value })} />
    </div>
  );
}
