import { TEAM_TYPE_OPTIONS } from '../../../lib/teamTypes';

// Static option sets + the empty-form shape for TeamFormSheet, split out so the
// sheet stays ≤150 LOC (F15). Pure data — no component code here.
export const AGE_GROUPS = ['8U', '9U', '10U', '11U', '12U', 'Mixed'].map((a) => ({ key: a, label: a }));
export const TEAM_TYPES = TEAM_TYPE_OPTIONS.map((o) => ({ key: o.slug, label: o.label }));
export const GENDERS = [
  { key: 'male',   label: 'Male'   },
  { key: 'female', label: 'Female' },
  { key: 'coed',   label: 'Coed'   },
];
// circuit is aau | league_play ONLY (matches the teams.circuit CHECK; F10).
export const CIRCUITS = [
  { key: 'aau',         label: 'AAU'         },
  { key: 'league_play', label: 'League Play' },
];
export const DAYS = [
  { key: 'mon', label: 'Mon' }, { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' }, { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' }, { key: 'sat', label: 'Sat' },
  { key: 'sun', label: 'Sun' },
];

// Columns the form edits. Everything else on the row (id, org_id, season_id,
// timestamps) is owned by the server and stripped before save.
export const EMPTY = {
  name: '', age_group: '10U', gender: 'male', circuit: 'aau',
  circuit_name: '', team_color: '#2563EB', practice_day: '',
  practice_location: '', sort_order: 0,
};

export const hintStyle = { fontSize: 12, color: 'var(--as-text-tertiary)', margin: '-6px 0 12px' };
export const warnStyle = {
  fontSize: 12, color: 'var(--as-warning)', backgroundColor: 'var(--as-warning-soft)',
  borderRadius: 8, padding: '8px 10px', margin: '-2px 0 12px',
};
