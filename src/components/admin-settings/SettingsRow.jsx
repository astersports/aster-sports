import { ChevronRight } from 'lucide-react';
import { ROW } from './settingsStyles';

// One tappable settings row, extracted + enhanced for the L99 pass:
// - leading Lucide icon (visual scanning / grouping clarity)
// - optional status badge ("On"/"Off"/"Active") with semantic token color
// - 44px+ tap target, aria-label combining title + summary for screen readers
// Token-only colors per CLAUDE.md §3. Additive: the page still passes
// title/summary/disabled/onClick exactly as before.
const BADGE_TONE = {
  on: { bg: 'var(--as-success-soft)', fg: 'var(--as-success)' },
  off: { bg: 'var(--as-neutral-soft)', fg: 'var(--as-text-secondary)' },
  warn: { bg: 'var(--as-warning-soft)', fg: 'var(--as-warning)' },
};

export default function SettingsRow({ title, summary, icon: Icon, badge, disabled, onClick }) {
  const tone = badge ? (BADGE_TONE[badge.tone] || BADGE_TONE.off) : null;
  return (
    <li role="listitem" style={{ listStyle: 'none' }}>
      <button
        type="button" className="as-press" style={ROW} disabled={disabled} onClick={onClick}
        aria-label={`${title}. ${summary}${badge ? `. ${badge.label}` : ''}`}
      >
        {Icon ? (
          <Icon size={20} strokeWidth={1.75} aria-hidden="true"
            style={{ color: 'var(--as-text-secondary)', flexShrink: 0 }} />
        ) : null}
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 15, color: 'var(--as-text-primary)', display: 'block' }}>{title}</span>
          <span style={{ fontSize: 13, color: 'var(--as-text-tertiary)', display: 'block', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{summary}</span>
        </span>
        {badge ? (
          <span aria-hidden="true" style={{
            fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 6,
            backgroundColor: tone.bg, color: tone.fg, flexShrink: 0, whiteSpace: 'nowrap',
          }}>{badge.label}</span>
        ) : null}
        <ChevronRight size={20} strokeWidth={1.75} aria-hidden="true" style={{ color: 'var(--as-text-tertiary)', flexShrink: 0 }} />
      </button>
    </li>
  );
}
