// ─── Event types ─────────────────────────────────────────────
// EVENT_TYPES is the canonical list (no "all"). FILTER_TYPES adds the "all"
// sentinel that filter UIs use as the default option. Keeping both as named
// exports avoids ambiguity at the call site.
export const EVENT_TYPES = ['practice', 'game', 'tournament', 'other'];
export const FILTER_TYPES = ['all', ...EVENT_TYPES];

export const TYPE_LABELS = {
  all: 'All',
  practice: 'Practice',
  game: 'Game',
  tournament: 'Tournament',
  other: 'Other',
};

// ─── Event statuses ──────────────────────────────────────────
export const STATUS_OPTIONS = ['scheduled', 'cancelled', 'postponed'];
export const FILTER_STATUSES = ['all', ...STATUS_OPTIONS];

export const STATUS_LABELS = {
  all: 'All',
  scheduled: 'Scheduled',
  cancelled: 'Cancelled',
  postponed: 'Postponed',
};

export const STATUS_ICONS = {
  scheduled: { icon: '\u2713', cls: 'text-emerald-600' },
  postponed: { icon: '\u23F8', cls: 'text-amber-500' },
  cancelled: { icon: '\u2715', cls: 'text-red-500' },
};

// ─── Roster ─────────────────────────────────────────────────
export const ROSTER_TYPES = ['rostered', 'futures'];

export const RELATIONSHIPS = [
  { value: 'parent', label: 'Parent' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'emergency_contact', label: 'Emergency Contact' },
];

export const GRADE_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];

// ─── Event modal helpers ────────────────────────────────────
export const ARRIVAL_PRESETS = [15, 20, 25, 30, 45, 60];

// Date validation range — used by isValidDatetime/isValidDate
export const MIN_DATE_YEAR = 2024;
export const MAX_DATE_YEAR = 2030;
