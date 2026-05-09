// Wave 3.16 — weekly_digest starter templates.
// Body fields consumed by WeeklyDigestBody:
//   { body_notes, ops_notes }

export default [
  {
    id: 'wd-blank',
    name: 'Blank starter',
    description: 'Empty intro + bullets — write from scratch',
    body: { body_notes: '', ops_notes: '' },
    preview_summary: 'Empty body + empty bullets',
  },
  {
    id: 'wd-sunday-night',
    name: 'Sunday-night week-ahead',
    description: 'Pre-filled intro + empty bullets — fill in the schedule notes',
    body: {
      body_notes: "Here's what's on deck this week:",
      ops_notes: '',
    },
    preview_summary: 'Intro line · empty bullets',
  },
];
