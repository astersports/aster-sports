// Wave 3.12 — page hero. Title + dynamic count subtitle + Compose CTA.
// Wave 4.1b §2 — pilot mode chip surfaces under the title when org
// pilot mode is enabled.

import { Mail } from 'lucide-react';
import PilotModeChip from '../PilotModeChip';

const wrap = { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, padding: '12px 0' };
const titleStyle = { fontSize: 24, fontWeight: 700, color: 'var(--em-text-primary)', margin: 0, letterSpacing: '-0.01em' };
const subtitleStyle = { fontSize: 14, color: 'var(--em-text-secondary)', marginTop: 2 };
const chipRow = { marginTop: 8 };
const ctaStyle = { minHeight: 40, padding: '0 14px', borderRadius: 9999, border: 'none', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', backgroundColor: 'var(--em-accent)', color: 'var(--em-text-inverse)', display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0 };

export default function BriefingsHero({ activeCount, onCompose, pilotModeEnabled }) {
  const subtitle = activeCount > 0
    ? `${activeCount} item${activeCount === 1 ? '' : 's'} need${activeCount === 1 ? 's' : ''} your attention`
    : 'All caught up.';
  return (
    <header style={wrap}>
      <div>
        <h1 style={titleStyle}>Briefings</h1>
        <div style={subtitleStyle}>{subtitle}</div>
        {pilotModeEnabled && <div style={chipRow}><PilotModeChip /></div>}
      </div>
      <button type="button" onClick={onCompose} className="sf-press" style={ctaStyle}>
        <Mail size={14} strokeWidth={1.75} /> Compose
      </button>
    </header>
  );
}
