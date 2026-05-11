// Wave 4.4-B Session 5d-b-1 — grouped team picker for Step 2 audience.
// Replaces the deadend audience picker that captured audience_type but
// never let admin pick WHICH teams. Supports mode='team' (single
// select, the audience defaults to defaultAudienceType='team') and
// mode='multi_team' (multi-select with select-all-by-bucket).
//
// Group axes: age_group (default) / circuit / division. Selection
// persists across axis switches. Null-safe bucketing for division
// (some teams have division=null per the 5d-a live data).
//
// Props:
//   teams       — array from useOrgTeams: { id, name, age_group, division,
//                 circuit, team_type_id, sort_order, team_color }
//   value       — array of selected team_ids
//   onChange    — (newTeamIds: string[]) => void
//   mode        — 'team' (single) | 'multi_team' (multi)

import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';

const AXES = [
  { key: 'age_group', label: 'Age group' },
  { key: 'circuit',   label: 'Circuit' },
  { key: 'division',  label: 'Division' },
];
const FALLBACK_DOT = '#94a3b8';
const UNSPECIFIED = '__unspecified__';

const wrap = { display: 'flex', flexDirection: 'column', gap: 12 };
const searchWrap = { position: 'relative' };
const searchInput = { width: '100%', minHeight: 44, padding: '0 12px 0 38px', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', backgroundColor: 'var(--em-bg-tertiary)', border: '1.5px solid var(--em-border-default)', color: 'var(--em-text-primary)' };
const searchIcon = { position: 'absolute', left: 12, top: 14, color: 'var(--em-text-tertiary)', pointerEvents: 'none' };
const tabRow = { display: 'flex', gap: 6, padding: 4, backgroundColor: 'var(--em-bg-tertiary)', borderRadius: 8 };
const tabBtn = (active) => ({ flex: 1, minHeight: 32, padding: '0 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', border: 'none', backgroundColor: active ? 'var(--em-bg-card)' : 'transparent', color: active ? 'var(--em-text-primary)' : 'var(--em-text-secondary)' });
const bucketHead = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 4px', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--em-text-tertiary)' };
const selectAllBtn = { background: 'none', border: 'none', color: 'var(--em-accent)', fontSize: 11, fontWeight: 600, cursor: 'pointer', padding: '4px 6px', minHeight: 24 };
const chipRow = (selected) => ({ display: 'flex', alignItems: 'center', gap: 10, minHeight: 44, padding: '8px 12px', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', cursor: 'pointer', border: '1px solid', borderColor: selected ? 'var(--em-accent)' : 'var(--em-border-default)', backgroundColor: selected ? 'var(--em-accent)' : 'var(--em-bg-card)', color: selected ? 'var(--em-text-inverse)' : 'var(--em-text-primary)', textAlign: 'left', width: '100%' });
const dotStyle = (color) => ({ width: 8, height: 8, borderRadius: 4, backgroundColor: color || FALLBACK_DOT, flexShrink: 0 });
const footer = { fontSize: 12, color: 'var(--em-text-tertiary)', paddingTop: 4 };

function bucketize(teams, axis) {
  const buckets = new Map();
  for (const t of teams) {
    const key = t[axis] || UNSPECIFIED;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(t);
  }
  return [...buckets.entries()].sort(([a], [b]) => {
    if (a === UNSPECIFIED) return 1;
    if (b === UNSPECIFIED) return -1;
    return a.localeCompare(b);
  });
}

export default function TeamGroupedPicker({ teams = [], value = [], onChange, mode = 'team' }) {
  const [query, setQuery] = useState('');
  const [axis, setAxis] = useState('age_group');
  const selected = useMemo(() => new Set(value), [value]);
  const isMulti = mode === 'multi_team';

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return teams;
    return teams.filter((t) => (t.name || '').toLowerCase().includes(q));
  }, [teams, query]);

  const buckets = useMemo(() => bucketize(filtered, axis), [filtered, axis]);

  const toggleChip = (tid) => {
    if (!isMulti) { onChange([tid]); return; }
    if (selected.has(tid)) onChange(value.filter((x) => x !== tid));
    else onChange([...value, tid]);
  };

  const toggleBucket = (ids) => {
    const allIn = ids.every((id) => selected.has(id));
    if (allIn) onChange(value.filter((x) => !ids.includes(x)));
    else onChange([...new Set([...value, ...ids])]);
  };

  return (
    <div style={wrap}>
      <div style={searchWrap}>
        <Search size={16} strokeWidth={1.75} style={searchIcon} />
        <input type="text" placeholder="Search teams..." value={query} onChange={(e) => setQuery(e.target.value)} style={searchInput} aria-label="Search teams" />
      </div>
      <div role="tablist" aria-label="Group teams by" style={tabRow}>
        {AXES.map((a) => (
          <button key={a.key} type="button" role="tab" aria-selected={axis === a.key} onClick={() => setAxis(a.key)} className="sf-press" style={tabBtn(axis === a.key)}>{a.label}</button>
        ))}
      </div>
      <div data-testid="bucket-list" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {buckets.map(([key, items]) => {
          const ids = items.map((t) => t.id);
          const allIn = isMulti && ids.length > 0 && ids.every((id) => selected.has(id));
          return (
            <div key={key} data-bucket={key}>
              <div style={bucketHead}>
                <span>{key === UNSPECIFIED ? 'Unspecified' : key}</span>
                {isMulti && (
                  <button type="button" onClick={() => toggleBucket(ids)} style={selectAllBtn} aria-label={`${allIn ? 'Clear' : 'Select all'} ${key === UNSPECIFIED ? 'Unspecified' : key}`}>
                    {allIn ? 'Clear' : 'Select all'}
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {items.map((t) => {
                  const isSel = selected.has(t.id);
                  return (
                    <button key={t.id} type="button" role="checkbox" aria-checked={isSel} data-team-id={t.id} onClick={() => toggleChip(t.id)} className="sf-press" style={chipRow(isSel)}>
                      <span style={dotStyle(t.team_color)} aria-hidden="true" />
                      <span>{t.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
        {!buckets.length && <div style={{ ...footer, textAlign: 'center', padding: 20 }}>No teams match.</div>}
      </div>
      <div style={footer} data-testid="picker-footer">
        {value.length} of {teams.length} teams selected
      </div>
    </div>
  );
}
