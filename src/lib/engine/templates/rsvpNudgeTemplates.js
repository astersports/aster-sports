// Wave 4.0 — rsvp_nudge starter templates.
// Body fields consumed by composeRsvpNudge (resolvers/rsvpNudge.js):
//   { coach_note?, parent_shoutout? }   -> each renders as a stats_narrative
// (Previously seeded headline_override / custom_message / ask_comment_field,
// which composeRsvpNudge never read — dead no-op fields, removed.)

export default [
  {
    id: 'rn-blank',
    name: 'Blank starter',
    description: 'Empty fields — clean nudge with default headline',
    body: { coach_note: '', parent_shoutout: '' },
    preview_summary: 'Default headline · no custom copy',
  },
  {
    id: 'rn-friendly',
    name: 'Friendly nudge',
    description: 'Warm intro line above the event card',
    body: {
      coach_note: 'Quick favor — need a yes/no/maybe so we can plan attendance.',
      parent_shoutout: '',
    },
    preview_summary: 'Friendly intro · default headline',
  },
];
