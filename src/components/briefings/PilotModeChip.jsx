// Wave 4.1b §2 — Bug B / Polish J. Yellow chip surfacing pilot mode
// status on inbox header + composer Step 2/3 audience summaries.
// Tap → /admin/settings?panel=communications. (Anchor route — Settings
// page is responsible for scrolling/highlighting the panel.)

import { Link } from 'react-router-dom';

const chipStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  minHeight: 28,
  padding: '0 10px',
  borderRadius: 9999,
  fontSize: 12,
  fontWeight: 600,
  backgroundColor: 'var(--em-warning-soft)',
  color: 'var(--em-warning)',
  border: '1px solid var(--em-warning)',
  textDecoration: 'none',
  fontFamily: 'inherit',
  cursor: 'pointer',
};

export default function PilotModeChip({ compact = false }) {
  const label = compact ? 'Pilot Mode' : 'Pilot Mode ON';
  return (
    <Link
      to="/admin/settings?panel=communications"
      className="sf-press"
      style={chipStyle}
      aria-label="Pilot mode is on. Tap to manage in Settings."
    >
      <span aria-hidden="true">🟡</span>
      {label}
    </Link>
  );
}
