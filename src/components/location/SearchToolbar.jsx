import { Search, X } from 'lucide-react';

// Search input with inline clear button + Active/Archived toggle chips.
// Toggle only renders when isStaff (parents never see archive concept).

export default function SearchToolbar({ search, setSearch, showArchived, setShowArchived, isStaff }) {
  const chip = (active) => ({
    minHeight: 32, padding: '0 12px', borderRadius: 999,
    border: `1.5px solid ${active ? 'var(--sf-accent)' : 'var(--sf-border-default)'}`,
    backgroundColor: active ? 'var(--sf-accent-soft)' : 'var(--sf-bg-card)',
    color: active ? 'var(--sf-accent)' : 'var(--sf-text-primary)',
    fontSize: 12, fontWeight: active ? 600 : 400, cursor: 'pointer',
  });

  return (
    <>
      <div style={{ position: 'relative', marginBottom: 14 }}>
        <Search size={16} strokeWidth={1.75} style={{ position: 'absolute', left: 12, top: 14, color: 'var(--sf-text-tertiary)' }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search venues"
          aria-label="Search venues"
          style={{
            width: '100%', minHeight: 44, padding: '10px 12px 10px 36px', borderRadius: 10,
            border: '1.5px solid var(--sf-border-default)',
            backgroundColor: 'var(--sf-bg-tertiary)',
            color: 'var(--sf-text-primary)', fontSize: 14, fontFamily: 'Inter, sans-serif',
          }}
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            aria-label="Clear search"
            style={{
              position: 'absolute', right: 8, top: 8,
              width: 28, height: 28, borderRadius: 14,
              border: 'none', backgroundColor: 'var(--sf-bg-card)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={14} strokeWidth={2} color="var(--sf-text-secondary)" />
          </button>
        )}
      </div>

      {isStaff && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          <button
            type="button"
            onClick={() => setShowArchived(false)}
            className="sf-press"
            aria-pressed={!showArchived}
            style={chip(!showArchived)}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => setShowArchived(true)}
            className="sf-press"
            aria-pressed={showArchived}
            style={chip(showArchived)}
          >
            Archived
          </button>
        </div>
      )}
    </>
  );
}
