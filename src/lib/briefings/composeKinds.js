// The 5 MANUAL compose kinds — the only kinds shown in the one-screen composer's
// inline kind chips ("+ New"). The 6 auto-proposed kinds (weekly_digest,
// schedule_change, game_recap, tournament_prelim, tournament_recap, rsvp_nudge)
// arrive as Radar cards, not the picker; academy_callup is EventDetail-
// initiated. Grounded in the auto-draft cron handlers (compose simplification
// audit, 2026-06-04). Lives in lib so component files only export components.

export const MANUAL_KINDS = ['announcement', 'custom_message', 'games_recap', 'coach_roundup', 'family_guide'];
