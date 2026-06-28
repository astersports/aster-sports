import { MapPinOff } from 'lucide-react';
import LocationCard from '../location/LocationCard';
import { isMapIncomplete } from './locationMapStatus';

// Additive wrapper around the existing LocationCard. Adds a per-venue
// "needs a map link" flag (§15) for staff so the data-integrity gap is visible
// at the row, not just in the page-level banner. Parents never see it. The
// existing card render is untouched.

export default function LocationListItem(props) {
  const { location, isStaff } = props;
  const incomplete = isStaff && isMapIncomplete(location);

  return (
    <div style={{ position: 'relative' }}>
      {incomplete && (
        <div
          aria-label="This venue has no map link"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 11, fontWeight: 600, letterSpacing: '0.04em',
            color: 'var(--as-warning)', marginBottom: 4,
          }}
        >
          <MapPinOff size={12} strokeWidth={1.75} aria-hidden="true" /> NO MAP LINK
        </div>
      )}
      <LocationCard {...props} />
    </div>
  );
}
