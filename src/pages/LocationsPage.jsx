import { useState } from 'react';
import { Plus, MapPin, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocations } from '../hooks/useLocations';
import LocationFormSheet from '../components/location/LocationFormSheet';
import LocationRowMenu from '../components/location/LocationRowMenu';
import SearchToolbar from '../components/location/SearchToolbar';

function mapsUrl(address, lat, lon) {
  if (lat && lon) return `https://maps.google.com/?q=${lat},${lon}`;
  return `https://maps.google.com/?q=${encodeURIComponent(address || '')}`;
}

export default function LocationsPage() {
  const { role } = useAuth();
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const { locations, loading, error, archive, unarchive } = useLocations({ search, showArchived });
  const [formOpen, setFormOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);

  const authReady = role !== undefined && role !== null;
  const isStaff = authReady && (role === 'admin' || role === 'coach');

  const openCreate = () => { setEditingLocation(null); setFormOpen(true); };
  const openEdit = (l) => { setEditingLocation(l); setFormOpen(true); };
  const closeForm = () => { setFormOpen(false); setEditingLocation(null); };
  const handleArchive = async (l) => {
    if (!window.confirm(`Archive "${l.name}"? This hides it from the list but preserves all event references.`)) return;
    await archive(l.id);
  };

  return (
    <div style={{ padding: 16, paddingBottom: 80 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--sf-text-primary)', margin: 0 }}>
          Locations
        </h1>
        {isStaff && (
          <button onClick={openCreate} className="sf-press" aria-label="New location" style={{
            minHeight: 40, padding: '0 14px', borderRadius: 10,
            backgroundColor: 'var(--sf-accent)', color: 'var(--sf-text-inverse)',
            fontSize: 13, fontWeight: 600, border: 'none',
            display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
          }}>
            <Plus size={16} strokeWidth={2} /> New
          </button>
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
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--sf-text-secondary)', fontSize: 14 }}>
          Loading…
        </div>
      )}

      {error && (
        <div style={{ padding: 16, color: 'var(--sf-danger)', fontSize: 13 }}>
          {error.message || 'Failed to load locations'}
        </div>
      )}

      {!loading && !error && locations.length === 0 && (
        <div style={{ padding: '48px 16px', textAlign: 'center' }}>
          <MapPin size={32} strokeWidth={1.5} color="var(--sf-text-tertiary)" style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--sf-text-primary)', marginBottom: 4 }}>
            {search ? `No matches for "${search}"` : 'No locations yet'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--sf-text-secondary)' }}>
            {isStaff && !search ? 'Tap "+ New" to add your first venue.' : ''}
          </div>
        </div>
      )}

      {locations.map((l) => (
        <div key={l.id} className="sf-press" style={{
          backgroundColor: 'var(--sf-bg-card)',
          border: '1px solid var(--sf-border-default)',
          borderRadius: 10, padding: 14, marginBottom: 10,
          boxShadow: 'var(--sf-shadow-sm)',
          display: 'flex', flexDirection: 'column', gap: 8,
          opacity: showArchived ? 0.7 : 1,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--sf-text-primary)', lineHeight: 1.3 }}>
                {l.name}
                {showArchived && (
                  <span style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: '1px',
                    padding: '2px 6px', borderRadius: 4, marginLeft: 6,
                    backgroundColor: 'var(--sf-neutral-soft)', color: 'var(--sf-text-tertiary)',
                  }}>
                    ARCHIVED
                  </span>
                )}
              </div>
              {l.address && (
                <div style={{ fontSize: 13, color: 'var(--sf-text-secondary)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <MapPin size={12} strokeWidth={1.75} />{l.address}
                </div>
              )}
            </div>
            {isStaff && (
              <LocationRowMenu
                showArchived={showArchived}
                onEdit={() => openEdit(l)}
                onArchive={() => handleArchive(l)}
                onUnarchive={() => unarchive(l.id)}
              />
            )}
          </div>

          {(l.parking_notes || l.notes) && (
            <div style={{ fontSize: 12, color: 'var(--sf-text-secondary)', whiteSpace: 'pre-wrap' }}>
              {l.parking_notes && <div><strong>Parking:</strong> {l.parking_notes}</div>}
              {l.notes && <div style={{ marginTop: l.parking_notes ? 4 : 0 }}>{l.notes}</div>}
            </div>
          )}

          <a
            href={mapsUrl(l.address, l.lat, l.lon)}
            target="_blank" rel="noopener noreferrer"
            aria-label={`Open ${l.name} in Google Maps`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 36,
              padding: '0 12px', borderRadius: 8, fontSize: 13, fontWeight: 500,
              textDecoration: 'none', alignSelf: 'flex-start',
              backgroundColor: 'var(--sf-accent-soft)', color: 'var(--sf-accent)',
            }}
          >
            Open in Maps <ExternalLink size={12} strokeWidth={2} />
          </a>
        </div>
      ))}

      {formOpen && (
        <LocationFormSheet location={editingLocation} onClose={closeForm} />
      )}
    </div>
  );
}
