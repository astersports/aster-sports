import { MapPin, ExternalLink } from 'lucide-react';
import LocationRowMenu from './LocationRowMenu';

function mapsUrl(address, lat, lon, googleMapsUrl) {
  if (googleMapsUrl) return googleMapsUrl;
  if (lat && lon) return `https://maps.google.com/?q=${lat},${lon}`;
  return `https://maps.google.com/?q=${encodeURIComponent(address || '')}`;
}

// Single location row on LocationsPage. Displays name (with optional
// ARCHIVED badge), address line, parking/notes block, and a Maps link.
// Staff see a row menu for edit/archive/unarchive; parents see none.
export default function LocationCard({ location, isStaff, showArchived, onEdit, onArchive, onUnarchive }) {
  const l = location;
  return (
    <div className="sf-press" style={{
      backgroundColor: 'var(--em-bg-card)',
      border: '1px solid var(--em-border-default)',
      borderRadius: 10, padding: 14, marginBottom: 10,
      boxShadow: 'var(--em-shadow-sm)',
      display: 'flex', flexDirection: 'column', gap: 8,
      opacity: showArchived ? 0.7 : 1,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--em-text-primary)', lineHeight: 1.3 }}>
            {l.name}
            {showArchived && (
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '1px',
                padding: '2px 6px', borderRadius: 4, marginLeft: 6,
                backgroundColor: 'var(--em-neutral-soft)', color: 'var(--em-text-tertiary)',
              }}>
                ARCHIVED
              </span>
            )}
          </div>
          {l.address && (
            <div style={{ fontSize: 13, color: 'var(--em-text-secondary)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
              <MapPin size={12} strokeWidth={1.75} />{l.address}
            </div>
          )}
        </div>
        {isStaff && (
          <LocationRowMenu
            showArchived={showArchived}
            onEdit={onEdit}
            onArchive={onArchive}
            onUnarchive={onUnarchive}
          />
        )}
      </div>

      {(l.parking_notes || l.notes) && (
        <div style={{ fontSize: 12, color: 'var(--em-text-secondary)', whiteSpace: 'pre-wrap' }}>
          {l.parking_notes && <div><strong>Parking:</strong> {l.parking_notes}</div>}
          {l.notes && <div style={{ marginTop: l.parking_notes ? 4 : 0 }}>{l.notes}</div>}
        </div>
      )}

      {isStaff && l.admin_notes && (
        <div
          aria-label="Internal staff notes, not visible to parents"
          style={{
            padding: 12, background: 'var(--em-bg-secondary)',
            borderLeft: '4px solid var(--em-accent)', borderRadius: 8,
          }}
        >
          <span style={{
            display: 'inline-block', fontSize: 11, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: 0.5,
            color: 'var(--em-accent)', marginBottom: 4,
          }}>
            Internal Notes (admin only)
          </span>
          <p style={{ fontSize: 14, color: 'var(--em-text-primary)', margin: 0, whiteSpace: 'pre-wrap' }}>
            {l.admin_notes}
          </p>
        </div>
      )}

      <a
        href={mapsUrl(l.address, l.lat, l.lon, l.google_maps_url)}
        target="_blank" rel="noopener noreferrer"
        aria-label={`Open ${l.name} in Google Maps`}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 36,
          padding: '0 12px', borderRadius: 8, fontSize: 13, fontWeight: 500,
          textDecoration: 'none', alignSelf: 'flex-start',
          backgroundColor: 'var(--em-accent-soft)', color: 'var(--em-accent)',
        }}
      >
        Open in Maps <ExternalLink size={12} strokeWidth={2} />
      </a>
    </div>
  );
}
