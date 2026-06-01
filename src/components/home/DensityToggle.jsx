// src/components/home/DensityToggle.jsx
// Phase 1 Step 5E-1: Density toggle chip for SectionShell.titleAction slot.
// Cycles minimal → medium → maximum and persists to user_preferences.card_density
// JSONB via useDensity(sectionKey).
//
// Visual: adaptive bar icon (4/3/2 lines for min/med/max) + uppercase label.
// Pattern matches the 11px uppercase-tertiary aesthetic of section titles.
// 44px tap target with smaller visible chip; pad area is transparent hitbox.
//
// Usage:
//   <SectionShell title="NEXT UP" titleAction={<DensityToggle sectionKey="parent-now" />}>
//     {children}
//   </SectionShell>

import { useDensity } from '../../hooks/useDensity';

const LABELS = { minimal: 'Compact', maximum: 'Detailed' };
const NEXT_DENSITY = { minimal: 'maximum', maximum: 'minimal' };

function DensityIcon({ density }) {
  const lineCount = density === 'minimal' ? 4 : density === 'medium' ? 3 : 2;
  const top = 3;
  const bottom = 13;
  const span = bottom - top;
  const step = lineCount > 1 ? span / (lineCount - 1) : 0;

  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      aria-hidden="true"
    >
      {Array.from({ length: lineCount }).map((_, i) => {
        const y = top + step * i;
        return <line key={i} x1="3" y1={y} x2="13" y2={y} />;
      })}
    </svg>
  );
}

export default function DensityToggle({ sectionKey = 'default' }) {
  const { density, cycleDensity, loading } = useDensity(sectionKey);
  const label = LABELS[density] || LABELS.medium;
  const nextLabel = LABELS[NEXT_DENSITY[density]] || LABELS.medium;

  const handleClick = () => {
    if (loading) return;
    cycleDensity().catch(() => {
      // Failure is non-blocking; useDensity logs internally.
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      aria-label={`Density ${label}. Tap to switch to ${nextLabel}.`}
      className="as-press"
      style={{
        // 44px tap target with smaller visible chip
        minHeight: 44,
        minWidth: 44,
        padding: 0,
        background: 'none',
        border: 'none',
        cursor: loading ? 'default' : 'pointer',
        opacity: loading ? 0.5 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        fontFamily: 'inherit',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '4px 8px',
          minHeight: 24,
          borderRadius: 6,
          backgroundColor: 'var(--as-bg-secondary)',
          border: '1px solid var(--as-border-subtle)',
          color: 'var(--as-text-tertiary)',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.05em',
        }}
      >
        <DensityIcon density={density} />
        {label}
      </span>
    </button>
  );
}
