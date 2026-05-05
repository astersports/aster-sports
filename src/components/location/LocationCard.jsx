import { MapPin, ExternalLink, Navigation } from 'lucide-react';
import LocationRowMenu from './LocationRowMenu';

function mapsUrl(address, lat, lon, googleMapsUrl) {
  if (googleMapsUrl) return googleMapsUrl;
  if (lat && lon) return `https://maps.google.com/?q=${lat},${lon}`;
  return `https://maps.google.com/?q=${encodeURIComponent(address || '')}`;
}

export default function LocationCard({ location, isStaff, showArchived, onEdit, onArchive, onUnarchive, density = 'medium' }) {
  const l = location;
  const url = mapsUrl(l.address, l.lat, l.lon, l.google_maps_url);

  if (density === 'minimal') {
    return (
      <button type="button" onClick={() => window.open(url, '_blank')} className="sf-press"
        style={{
          display: 'flex', alignItems: 'center', gap: 8, width: '100%',
          padding: '10px 16px', minHeight: 44, marginBottom: 8,
          backgroundColor: 'var(--em-bg-card)', border: '1px solid var(--em-border-default)',
          borderRadius: 10, boxShadow: 'var(--em-shadow-sm)', cursor: 'pointer',
          opacity: showArchived ? 0.7 : 1, fontFamily: 'inherit', textAlign: 'left',
        }}>
        <MapPin size={15} strokeWidth={1.75} color="var(--em-accent)" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--em-text-primary)', flex: 1, minWidth: 0 }}>{l.name}</span>
        <Navigation size={13} strokeWidth={1.75} color="var(--em-text-tertiary)" />
      </button>
    );
  }

  return (
    <div style={{
      backgroundColor: 'var(--em-bg-card)', border: '1px solid var(--em-border-default)',
      borderRadius: 10, padding: 16, marginBottom: 10, boxShadow: 'var(--em-shadow-sm)',
      display: 'flex', flexDirection: 'column', gap: 8, opacity: showArchived ? 0.7 : 1,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--em-text-primary)', lineHeight: 1.3 }}>
            {l.name}
            {showArchived && <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1px', padding: '2px 6px', borderRadius: 4, marginLeft: 6, backgroundColor: 'var(--em-neutral-soft)', color: 'var(--em-text-tertiary)' }}>ARCHIVED</span>}
          </div>
          {l.address && (
            <div style={{ fontSize: 13, color: 'var(--em-text-secondary)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
              <MapPin size={12} strokeWidth={1.75} />{l.address}
            </div>
          )}
        </div>
        {isStaff && <LocationRowMenu showArchived={showArchived} onEdit={onEdit} onArchive={onArchive} onUnarchive={onUnarchive} />}
      </div>

      {(l.parking_notes || l.notes) && (
        <div style={{ fontSize: 13, color: 'var(--em-text-secondary)', whiteSpace: 'pre-wrap' }}>
          {l.parking_notes && <div><strong>Parking:</strong> {l.parking_notes}</div>}
          {l.notes && <div style={{ marginTop: l.parking_notes ? 4 : 0 }}>{l.notes}</div>}
        </div>
      )}

      {density === 'maximum' && isStaff && l.admin_notes && (
        <div aria-label="Internal staff notes" style={{ padding: 12, background: 'var(--em-bg-secondary)', borderLeft: '4px solid var(--em-accent)', borderRadius: 10 }}>
          <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--em-accent)', marginBottom: 4 }}>Internal Notes (admin only)</span>
          <p style={{ fontSize: 15, color: 'var(--em-text-primary)', margin: 0, whiteSpace: 'pre-wrap' }}>{l.admin_notes}</p>
        </div>
      )}

      <button type="button" onClick={() => window.open(url, '_blank')} className="sf-press"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 44, padding: '0 12px', borderRadius: 10, fontSize: 13, fontWeight: 500, alignSelf: 'flex-start', backgroundColor: 'var(--em-accent-soft)', color: 'var(--em-accent)', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
        <Navigation size={13} strokeWidth={1.75} /> Get Directions
      </button>
    </div>
  );
}
