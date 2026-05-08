// Search input + jersey/name/grade sort toggle. Local UI only — state
// lives in the parent (TeamDetailPage) so the filter/sort results stay
// in sync with the player list there.
export default function RosterControls({ search, setSearch, sortBy, setSortBy, role }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        backgroundColor: 'var(--em-bg-secondary)',
        borderRadius: 10,
        padding: '0 12px',
        minHeight: 44,
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--em-text-tertiary)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
        </svg>
        <input
          type="text"
          placeholder="Search players..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            background: 'none',
            border: 'none',
            outline: 'none',
            fontSize: 15,
            color: 'var(--em-text-primary)',
            marginLeft: 8,
            minHeight: 44,
          }}
        />
      </div>
      <div style={{ display: 'flex', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--em-border-default)' }}>
        {((role === 'admin' || role === 'coach')
          ? [{ key: 'jersey', label: '#' }, { key: 'name', label: 'A-Z' }, { key: 'grade', label: 'Gr' }, { key: 'age', label: 'Age' }, { key: 'attendance', label: 'Att' }]
          : [{ key: 'jersey', label: '#' }, { key: 'name', label: 'A-Z' }]
        ).map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => { setSortBy(opt.key); navigator.vibrate?.(10); }}
            style={{
              minWidth: 40, minHeight: 44, padding: '0 6px', border: 'none',
              backgroundColor: sortBy === opt.key ? 'var(--em-accent)' : 'var(--em-bg-card)',
              color: sortBy === opt.key ? 'var(--em-text-inverse)' : 'var(--em-text-secondary)',
              fontSize: 13, fontWeight: 600,
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
