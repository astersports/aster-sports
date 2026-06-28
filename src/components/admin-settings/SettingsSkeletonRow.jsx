import { ROW } from './settingsStyles';

// Shape-matched loading skeleton for a settings row (§16.11 "Loading states:
// SectionSkeleton shape-matched"). Replaces the bare "Loading…" summary text
// with a calm placeholder that matches the real row's two-line layout, so the
// page doesn't jump when data arrives. Pulses via the existing as-pulse
// animation (already behind prefers-reduced-motion in index.css). Token-only.
const BAR = { backgroundColor: 'var(--as-bg-tertiary)', borderRadius: 6 };

export default function SettingsSkeletonRow() {
  return (
    <li role="listitem" aria-hidden="true" style={{ listStyle: 'none' }}>
      <div style={{ ...ROW, cursor: 'default' }} className="as-pulse">
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ ...BAR, display: 'block', height: 13, width: '45%' }} />
          <span style={{ ...BAR, display: 'block', height: 11, width: '65%', marginTop: 8 }} />
        </span>
      </div>
    </li>
  );
}
