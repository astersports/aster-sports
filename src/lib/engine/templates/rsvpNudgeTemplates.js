// Wave 4.0 — rsvp_nudge starter templates.
// Body fields consumed by RsvpNudgeBody:
//   { headline_override?, custom_message?, ask_comment_field? }

export default [
  {
    id: 'rn-blank',
    name: 'Blank starter',
    description: 'Empty fields — clean nudge with default headline',
    body: { headline_override: '', custom_message: '', ask_comment_field: false },
    preview_summary: 'Default headline · no custom copy',
  },
  {
    id: 'rn-friendly',
    name: 'Friendly nudge',
    description: 'Warm intro line above the buttons',
    body: {
      headline_override: '',
      custom_message: 'Quick favor — need a yes/no/maybe so we can plan attendance.',
      ask_comment_field: false,
    },
    preview_summary: 'Friendly intro · default headline',
  },
];
