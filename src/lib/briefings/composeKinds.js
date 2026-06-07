// The 5 MANUAL compose kinds — the only kinds shown in the one-screen composer's
// inline kind chips ("+ New"). The 6 auto-proposed kinds (weekly_digest,
// schedule_change, game_recap, tournament_prelim, tournament_recap, rsvp_nudge)
// arrive as Radar cards, not the picker; academy_callup is EventDetail-
// initiated. Grounded in the auto-draft cron handlers (compose simplification
// audit, 2026-06-04). Lives in lib so component files only export components.

export const MANUAL_KINDS = ['announcement', 'custom_message', 'games_recap', 'coach_roundup', 'family_guide'];

// A2 (Part A) — grouped + usage-ranked kind picker. Architect ruling 2026-06-07:
// Option B grouping (Recaps / Outreach / Guides) + STATIC order within each group
// for the pilot. "Guides" = the recurring single-recipient digests (coach_roundup,
// family_guide), a real class distinct from Outreach's one-off broadcasts. The
// kinds across all groups MUST equal MANUAL_KINDS exactly — locked by the picker
// invariant test (AP#43) so a future manual kind can't silently fall out of the
// picker. Static order is DEFERRED, not decided-against: the data-driven version
// (order by comms_messages send count per kind) is ticketed post-pilot (ledger
// §4) — pilot send volume is too sparse to rank meaningfully today.
export const KIND_GROUPS = [
  { label: 'Recaps', kinds: ['games_recap'] },
  { label: 'Outreach', kinds: ['announcement', 'custom_message'] },
  { label: 'Guides', kinds: ['coach_roundup', 'family_guide'] },
];
