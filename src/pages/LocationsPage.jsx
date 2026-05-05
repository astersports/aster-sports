import { useState } from 'react';
import { Plus, MapPin, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSeason } from '../context/SeasonContext';
import { useLocations } from '../hooks/useLocations';
import LocationFormSheet from '../components/location/LocationFormSheet';
import ManageSeasonLocationsSheet from '../components/location/ManageSeasonLocationsSheet';
import LocationCard from '../components/location/LocationCard';
import SearchToolbar from '../components/location/SearchToolbar';
import Button from '../components/shared/Button';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import DensityToggle from '../components/home/DensityToggle';
import { useDensity } from '../hooks/useDensity';

export default function LocationsPage() {
  const { role } = useAuth();
  const { activeSeason } = useSeason();
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const { locations, loading, error, archive, unarchive } = useLocations({ search, showArchived });
  const [formOpen, setFormOpen] = useState(false);
  const [seasonSheetOpen, setSeasonSheetOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const { density } = useDensity('locations-list', 'medium');

  const authReady = role !== undefined && role !== null;
  const isStaff = authReady && (role === 'admin' || role === 'coach');

  const openCreate = () => { setEditingLocation(null); setFormOpen(true); };
  const openEdit = (l) => { setEditingLocation(l); setFormOpen(true); };
  const closeForm = () => { setFormOpen(false); setEditingLocation(null); };
  const handleArchive = (l) => {
    setConfirmAction({ type: 'archive', location: l });
  };

  return (
    <div style={{ padding: 16, paddingBottom: 80 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--em-text-primary)', margin: 0 }}>Locations</h1>
          <DensityToggle sectionKey="locations-list" />
        </div>
        {isStaff && (
          <div style={{ display: 'flex', gap: 6 }}>
            {activeSeason && role === 'admin' && (
              <Button size="sm" onClick={() => setSeasonSheetOpen(true)} aria-label="Manage season locations">
                <Calendar size={16} strokeWidth={2} /> Season
              </Button>
            )}
            <Button size="sm" onClick={openCreate} aria-label="New location">
              <Plus size={16} strokeWidth={2} /> New
            </Button>
          </div>
        )}
      </div>

      <SearchToolbar
        search={search}
        setSearch={setSearch}
        showArchived={showArchived}
        setShowArchived={setShowArchived}
        isStaff={isStaff}
      />

      {loading && locations.length === 0 && (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--em-text-secondary)', fontSize: 15 }}>
          Loading…
        </div>
      )}

      {error && (
        <div style={{ padding: 16, color: 'var(--em-danger)', fontSize: 13 }}>
          {error.message || 'Failed to load locations'}
        </div>
      )}

      {!loading && !error && locations.length === 0 && (
        <div style={{ padding: '48px 16px', textAlign: 'center' }}>
          <MapPin size={32} strokeWidth={1.5} color="var(--em-text-tertiary)" style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--em-text-primary)', marginBottom: 4 }}>
            {search ? `No matches for "${search}"` : 'No locations yet'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--em-text-secondary)' }}>
            {isStaff && !search ? 'Tap "+ New" to add your first venue.' : ''}
          </div>
        </div>
      )}

      {locations.map((l) => (
        <LocationCard
          key={l.id}
          location={l}
          isStaff={isStaff}
          showArchived={showArchived}
          density={density}
          onEdit={() => openEdit(l)}
          onArchive={() => handleArchive(l)}
          onUnarchive={() => unarchive(l.id)}
        />
      ))}

      {formOpen && (
        <LocationFormSheet location={editingLocation} onClose={closeForm} />
      )}
      {seasonSheetOpen && activeSeason && (
        <ManageSeasonLocationsSheet seasonId={activeSeason.id} seasonName={activeSeason.name} onClose={() => setSeasonSheetOpen(false)} />
      )}
      {confirmAction?.type === 'archive' && (
        <ConfirmDialog title="Archive Location" message={`Archive "${confirmAction.location.name}"? This hides it from the list but preserves all event references.`} confirmLabel="Archive" destructive onConfirm={async () => { await archive(confirmAction.location.id); setConfirmAction(null); }} onCancel={() => setConfirmAction(null)} />
      )}
    </div>
  );
}
