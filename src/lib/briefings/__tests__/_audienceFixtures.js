// Shared fixtures for audience.* test files. Extracted from audience.test.js
// when it was split for the 150-line cap (CLAUDE.md anti-pattern #6).
// Underscore prefix keeps vitest from picking this up as a test file.

export const team10UBlue = 'team-10u-blue';
export const team10UBlack = 'team-10u-black';

export const PILOT_RECIPIENTS = [
  { guardian_id: 'g1', team_ids: ['team-11u-girls', 'team-8u-boys'] },
  { guardian_id: 'g2', team_ids: ['team-8u-boys'] },
];

export const FULL_RECIPIENTS = [
  ...PILOT_RECIPIENTS,
  { guardian_id: 'g3', team_ids: [team10UBlue] },
  { guardian_id: 'g4', team_ids: [team10UBlue] },
  { guardian_id: 'g5', team_ids: [team10UBlack, 'team-11u-girls'] },
];
