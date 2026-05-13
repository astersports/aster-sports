// Shared fixtures for sendWeeklyDigestFromWizard.* test files.
// Extracted when the file was split for the 150-line cap (CLAUDE.md anti-pattern #6).

export const baseState = (overrides = {}) => ({
  kind: 'weekly_digest', anchor_kind: 'org', anchor_id: 'o-1',
  audience_type: 'org_all', audience_filter: null,
  body: { body_notes: 'have a great week', ops_notes: 'sticker run' },
  signoff_message: 'Go team.', test_only: false, ...overrides,
});

export const period = { start: new Date('2026-05-11T00:00:00Z'), end: new Date('2026-05-17T23:59:59Z') };
export const recip = (gid, tids) => ({ guardian_id: gid, email: `${gid}@x`, team_ids: tids });
export const ev = (id, team_id) => ({ id, team_id });
export const COACHES = [{ display_name: 'Frank' }];
