// PROGRAM_TYPE_REGISTRY — the single declarative source for every per-type rule
// (L99 programs architecture, ratified 2026-06-07). Replaces the scattered
// switches the impl-prep audit found (statusForProgramType, divisionsApplyTo,
// defaultTeamTypeSlugForProgram, PROGRAM_NOUN, programBadge, ProgramTypeChooser
// TYPES+HELPER, the TeamFormSheet competitive warning, the AdminProgramsPage
// filters). Each consumer reads its field from here — one source, no divergence.
//
// Three orthogonal axes (the dominant model): TYPE is this closed/curated set;
// STATUS is a closed universal 3-value lifecycle (draft -> active -> archived,
// see lib/programSetup.statusForProgramType); WINDOWS (reg_opens_at/closes_at)
// are open per-type. Type-specific *life states* belong on windows, never on
// status.
//
// `competitive` = "defaults to a competitive team type" — it drives the
// team-type smart default + the TeamFormSheet override warning ONLY. The actual
// records/standings/bracket EXCLUSION stays team-level via
// teamTypes.isCompetitiveTeam(team) (team_types.slug) — do NOT move it here.
//
// Adding an archetype = one enum value (migration) + one row here + it shows in
// the chooser automatically; the parity test (programRegistry.parity.test) fails
// CI if the enum, these keys, and the chooser entries ever drift apart.
//
// `competitive` is stored (not derived) to avoid a teamTypes import cycle, but
// the parity test asserts competitive === isCompetitiveSlug(defaultTeamType) for
// every row, so it can't drift from the team-type default.

// Canonical program_type set — MUST equal the DB `program_type` enum
// (migrations: programs_table_and_program_type_enum + program_type_add_other).
// The parity test asserts REGISTRY keys === this === ProgramTypeChooser entries.
export const PROGRAM_TYPE_KEYS = [
  'season', 'camp', 'clinic', 'tryout', 'evaluation', 'interest_list', 'other',
];

// status default on create (Fork 1 / GO D1): camp + clinic go live immediately;
// everything else is born `draft` (pre-launch) and promoted via activate().
// season's draft-on-create + the single-active-season DB index together replace
// the old "create archived" guard.
export const PROGRAM_TYPE_REGISTRY = {
  season: {
    label: 'Season', noun: 'teams', badgeVariant: 'info',
    defaultStatus: 'draft', hasDivisions: true, singleActive: true,
    defaultTeamType: 'game_team', competitive: true,
    chooserHelper: 'Divisions and per-division fees. Created as a draft — activate it from Seasons when it starts.',
  },
  camp: {
    label: 'Camp', noun: 'camp', badgeVariant: 'academy',
    defaultStatus: 'active', hasDivisions: false, singleActive: false,
    defaultTeamType: 'clinic_camp', competitive: false,
    chooserHelper: 'Time-bounded, flat fee, no divisions. Created active so it’s live right away.',
  },
  clinic: {
    label: 'Clinic', noun: 'clinic', badgeVariant: 'academy',
    defaultStatus: 'active', hasDivisions: false, singleActive: false,
    defaultTeamType: 'clinic_camp', competitive: false,
    chooserHelper: 'Time-bounded, flat fee, no divisions. Created active so it’s live right away.',
  },
  tryout: {
    label: 'Tryout', noun: 'tryout', badgeVariant: 'academy',
    defaultStatus: 'draft', hasDivisions: false, singleActive: false,
    defaultTeamType: 'game_team', competitive: true,
    chooserHelper: 'Pre-season tryout. No divisions. Created as a draft until you open it.',
  },
  evaluation: {
    label: 'Evaluation', noun: 'evaluation', badgeVariant: 'academy',
    defaultStatus: 'draft', hasDivisions: false, singleActive: false,
    defaultTeamType: 'game_team', competitive: true,
    chooserHelper: 'Player evaluation. No divisions. Created as a draft until you open it.',
  },
  interest_list: {
    label: 'Interest list', noun: 'interest list', badgeVariant: 'academy',
    defaultStatus: 'draft', hasDivisions: false, singleActive: false,
    defaultTeamType: 'game_team', competitive: true,
    chooserHelper: 'Collect signups before a program exists. No divisions. Created as a draft.',
  },
  other: {
    label: 'Other', noun: 'program', badgeVariant: 'neutral',
    defaultStatus: 'draft', hasDivisions: false, singleActive: false,
    defaultTeamType: 'training_only', competitive: false,
    chooserHelper: 'A one-off program that doesn’t fit the other types. No divisions. Created as a draft.',
  },
};

// Lookup with a safe fallback (an unlisted type is impossible — type is enum-
// closed AND the parity test fails if a key is missing — but never throw).
export function programRule(type) {
  return PROGRAM_TYPE_REGISTRY[type] || PROGRAM_TYPE_REGISTRY.other;
}

// Does this program type default to a competitive team type? Drives the
// team-type smart default + the TeamFormSheet override warning ONLY — records
// exclusion stays team-level via teamTypes.isCompetitiveTeam.
export function programDefaultsCompetitive(type) {
  return programRule(type).competitive;
}
