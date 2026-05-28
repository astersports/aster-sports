// §4.O — shared layout wrapper for the admin manager pages
// (Members / Opponents / Locations). Owns: page header, search bar,
// Add CTA, optional tabs slot (Active / Archived), empty state.
// Child pages mount the layout and supply their own list/table rows
// + form sheet + data hooks.
//
// Design locked per §4.N.4 (Monday-opener Action 2 close, 2026-05-19):
// header included in the layout (not per-page). Visible-consistency
// win across the three new admin manager pages; future override prop
// can land if a real custom-header need surfaces.
//
// NOT in scope: pulling AdminSeasonsPage / AdminTeamsPage into this
// wrapper. Sample-of-two is not precedent; old code stays as-is until
// an independent refactor reason emerges (anti-pattern #42).

import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import Button from '../shared/Button';
import EmptyState from '../shared/EmptyState';
import LoadingSkeleton from '../shared/LoadingSkeleton';
import AdminBackHeader from './AdminBackHeader';

export default function AdminManagerLayout({
  title,
  subtitle,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search…',
  addLabel,
  onAdd,
  tabs,
  loading,
  isEmpty,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  children,
}) {
  // Internal-state fallback so callers can omit search wiring if they
  // don't need it; passing searchValue + onSearchChange makes the
  // input controlled.
  const [internalSearch, setInternalSearch] = useState('');
  const isControlled = onSearchChange !== undefined;
  const value = isControlled ? (searchValue || '') : internalSearch;
  const handleChange = (e) => {
    const next = e.target.value;
    if (isControlled) onSearchChange(next);
    else setInternalSearch(next);
  };

  return (
    <div className="px-4 py-4 em-fade-in overflow-x-hidden" style={{ maxWidth: '100%' }}>
      <AdminBackHeader />
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-bold" style={{ color: 'var(--em-text-primary)', fontSize: 20 }}>
            {title}
          </h1>
          {subtitle && (
            <div style={{ color: 'var(--em-text-secondary)', fontSize: 13 }}>{subtitle}</div>
          )}
        </div>
        {onAdd && (
          <Button onClick={onAdd}>
            <Plus size={18} strokeWidth={1.75} /> {addLabel || 'New'}
          </Button>
        )}
      </div>

      {onSearchChange !== undefined || searchValue !== undefined ? (
        <div className="mb-3" style={{ position: 'relative' }}>
          <Search
            size={18}
            strokeWidth={1.75}
            style={{ position: 'absolute', left: 12, top: 13, color: 'var(--em-text-tertiary)', pointerEvents: 'none' }}
          />
          <input
            type="search"
            value={value}
            onChange={handleChange}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="w-full"
            style={{
              height: 44,
              padding: '0 12px 0 40px',
              backgroundColor: 'var(--em-bg-tertiary)',
              border: '1.5px solid var(--em-border-default)',
              borderRadius: 10,
              fontSize: 15,
              color: 'var(--em-text-primary)',
            }}
          />
        </div>
      ) : null}

      {tabs ? <div className="mb-3">{tabs}</div> : null}

      {loading ? (
        <LoadingSkeleton variant="card" count={3} />
      ) : isEmpty ? (
        <EmptyState
          icon={emptyIcon}
          title={emptyTitle || `No ${title?.toLowerCase() || 'items'} yet`}
          description={emptyDescription || 'Add one to get started.'}
        />
      ) : (
        children
      )}
    </div>
  );
}
