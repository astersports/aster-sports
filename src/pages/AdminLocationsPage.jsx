import { useState } from 'react';
import { Calendar, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSeason } from '../context/SeasonContext';
import { useLocations } from '../hooks/useLocations';
import AdminBackHeader from '../components/admin/AdminBackHeader';
import LocationFormSheet from '../components/location/LocationFormSheet';
import ManageSeasonLocationsSheet from '../components/location/ManageSeasonLocationsSheet';
import SearchToolbar from '../components/location/SearchToolbar';
import Button from '../components/shared/Button';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import Toast from '../components/shared/Toast';
import DensityToggle from '../components/home/DensityToggle';
import { useDensity } from '../hooks/useDensity';
import LocationListItem from '../components/admin-locations/LocationListItem';
import LocationListControls from '../components/admin-locations/LocationListControls';
import LocationListStates from '../components/admin-locations/LocationListStates';
import { useDebouncedValue } from '../components/admin-locations/useDebouncedValue';
import { useLocationListExtras } from '../components/admin-locations/useLocationListExtras';
import { countMapIncomplete } from '../components/admin-locations/locationMapStatus';

export default function LocationsPage() {
  const { role } = useAuth();
  const { activeSeason } = useSeason();
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  // Debounce the search term feeding the fetch so we query on a pause, not on
  // every keystroke (perf on long venue lists). The input stays responsive.
  const debouncedSearch = useDebouncedValue(search, 250);
  const { locations, loading, error, archive, unarchive, refetch } = useLocations({ search: debouncedSearch, showArchived });
  const [formOpen, setFormOpen] = useState(false);
  const [seasonSheetOpen, setSeasonSheetOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const { density } = useDensity('locations-list');

  const authReady = role !== undefined && role !== null;
  const isStaff = authReady && (role === 'admin' || role === 'coach');

  const { sort, setSort, sorted, visibleCount, toast, setToast, optimisticArchive, optimisticUnarchive } =
    useLocationListExtras({ locations, archive, unarchive });
  const incompleteCount = countMapIncomplete(sorted);
  const hasList = !loading && !error && sorted.length > 0;

  const openCreate = () => { setEditingLocation(null); setFormOpen(true); };
  const openEdit = (l) => { setEditingLocation(l); setFormOpen(true); };
  const closeForm = () => { setFormOpen(false); setEditingLocation(null); };
  const handleArchive = (l) => {
    setConfirmAction({ type: 'archive', location: l });
  };

  return (
    <div style={{ padding: 16, paddingBottom: 80 }}>
      <AdminBackHeader />
      <div
        style={{
          position: 'sticky', top: 0, zIndex: 3,
          backgroundColor: 'var(--as-bg-page)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          gap: 8, flexWrap: 'wrap', paddingTop: 4, marginBottom: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--as-text-primary)', margin: 0 }}>Locations</h1>
          <DensityToggle sectionKey="locations-list" />
        </div>
        {isStaff && (
          <div style={{ display: 'flex', gap: 6 }}>
            {activeSeason && role === 'admin' && (
              <Button size="sm" onClick={() => setSeasonSheetOpen(true)} aria-label="Manage season locations">
                <Calendar size={16} strokeWidth={2} /> Season
              </Button>
            )}
            <Button size="sm" onClick={openCreate} aria-label="Add a new venue">
              <Plus size={16} strokeWidth={2} /> New
            </Button>
          </div>
        )}
      </div>

      <div onKeyDown={(e) => { if (e.key === 'Escape' && search) setSearch(''); }}>
        <SearchToolbar
          search={search}
          setSearch={setSearch}
          showArchived={showArchived}
          setShowArchived={setShowArchived}
          isStaff={isStaff}
        />
      </div>

      {/* Single shared aria-live region announcing list size + scope (§16.4). */}
      <div aria-live="polite" className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }}>
        {hasList ? `${visibleCount} ${visibleCount === 1 ? 'venue' : 'venues'}${showArchived ? ' archived' : ''}` : ''}
      </div>

      {hasList && (
        <LocationListControls
          count={visibleCount}
          sort={sort}
          setSort={setSort}
          incompleteCount={incompleteCount}
          showArchived={showArchived}
          isStaff={isStaff}
        />
      )}

      <LocationListStates
        loading={loading && locations.length === 0}
        error={error}
        isEmpty={!loading && !error && sorted.length === 0}
        search={debouncedSearch}
        isStaff={isStaff}
        showArchived={showArchived}
        onRetry={refetch}
      />

      {sorted.map((l) => (
        <LocationListItem
          key={l.id}
          location={l}
          isStaff={isStaff}
          showArchived={showArchived}
          density={density}
          onEdit={() => openEdit(l)}
          onArchive={() => handleArchive(l)}
          onUnarchive={() => optimisticUnarchive(l)}
        />
      ))}

      <Toast
        message={toast?.message}
        variant={toast?.variant}
        onDismiss={() => setToast(null)}
      />

      {formOpen && (
        <LocationFormSheet location={editingLocation} onClose={closeForm} />
      )}
      {seasonSheetOpen && activeSeason && (
        <ManageSeasonLocationsSheet seasonId={activeSeason.id} seasonName={activeSeason.name} onClose={() => setSeasonSheetOpen(false)} />
      )}
      {confirmAction?.type === 'archive' && (
        <ConfirmDialog title="Archive Location" message={`Archive "${confirmAction.location.name}"? This hides it from the list but preserves all event references.`} confirmLabel="Archive" destructive onConfirm={async () => { const l = confirmAction.location; setConfirmAction(null); await optimisticArchive(l); }} onCancel={() => setConfirmAction(null)} />
      )}
    </div>
  );
}
