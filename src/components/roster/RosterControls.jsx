import { useNow } from '../../hooks/useNow';

// Search input + jersey/name/grade sort toggle. Local UI only — state
// lives in the parent (TeamDetailPage) so the filter/sort results stay
// in sync with the player list there.
// 2026-05-21 (Teams PR C / Q10) — sortBy now flows through the shared
// usePlayerSortOrder hook (instantiated in the page) so Roster + Pulse
// stay in sync. Same prop shape (sortBy/setSortBy); the source moved.
// 2026-05-21 (Teams PR C / Q13) — added subtle "Last updated · tap to
// refresh" affordance below the search row. Reuses useNow so the
// relative timestamp ticks without extra wiring. onRefresh + lastFetchedAt
// optional — RosterControls degrades gracefully when omitted.
export default function RosterControls({ search, setSearch, sortBy, setSortBy, role, lastFetchedAt, onRefresh }) {
  const now = useNow(30_000);
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', gap: 8 }}>
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
        {/* 2026-05-21 (Teams PR A / V1) — dropped 'Gr' chip (redundant with
            Age for AAU age-grouped teams). With Gr gone the staff chip row
            [# A-Z Age Att] fits at iPhone width without clipping. */}
        <div style={{ display: 'flex', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--em-border-default)', flexShrink: 0 }}>
          {((role === 'admin' || role === 'coach')
            ? [{ key: 'jersey', label: '#' }, { key: 'name', label: 'A-Z' }, { key: 'age', label: 'Age' }, { key: 'attendance', label: 'Att' }]
            : [{ key: 'jersey', label: '#' }, { key: 'name', label: 'A-Z' }]
          ).map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => { setSortBy(opt.key); navigator.vibrate?.(10); }}
              style={{
                minWidth: 36, minHeight: 44, padding: '0 8px', border: 'none',
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
      {lastFetchedAt && onRefresh && (
        <button type="button" onClick={() => { navigator.vibrate?.(10); onRefresh(); }}
          aria-label="Refresh roster"
          className="sf-press"
          style={{ marginTop: 6, padding: '4px 4px', minHeight: 44, background: 'none', border: 'none',
            fontSize: 11, color: 'var(--em-text-tertiary)', textAlign: 'left', cursor: 'pointer' }}>
          Last updated {formatRelativeAgo(now - lastFetchedAt)} &middot; tap to refresh
        </button>
      )}
    </div>
  );
}

function formatRelativeAgo(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}
