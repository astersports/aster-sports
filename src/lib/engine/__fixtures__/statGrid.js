// Fixture for renderer #2 — 4-up stat grid. Mirrors the Saturday-results
// stat row a coach would see after Day 1 of a tournament.

export default {
  kind: 'stat_grid',
  cells: [
    { value: '1-1',  label: 'Record',    tone: 'neutral' },
    { value: '29.0', label: 'Pts/Game' },
    { value: '+2.5', label: 'Diff',      tone: 'positive' },
    { value: '4',    label: 'Games' },
  ],
};
