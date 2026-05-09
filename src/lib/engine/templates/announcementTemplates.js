// Wave 3.16 — announcement starter templates.
// Body fields consumed by AnnouncementBody:
//   { headline, body_text }

export default [
  {
    id: 'an-blank',
    name: 'Blank starter',
    description: 'Empty headline + body — write from scratch',
    body: { headline: '', body_text: '' },
    preview_summary: 'Empty body',
  },
  {
    id: 'an-volunteer-ask',
    name: 'Volunteer ask',
    description: 'Headline + body skeleton for a volunteer recruit ask',
    body: {
      headline: 'We need volunteers',
      body_text: 'We need a few hands for [event] on [date]. If you can help, reply to this email or text Coach Kenny.\n\nThanks for everything you do for this program.',
    },
    preview_summary: 'Volunteer recruit ask',
  },
];
