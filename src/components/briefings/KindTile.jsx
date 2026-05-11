// Wave 4.4-B Session 5b — single kind-picker tile. Replaces the
// horizontal-row card in the old StepKindPicker with a stacked vertical
// tile that fits a responsive grid (2 cols mobile / 3 cols desktop).
//
// Layout (top → bottom):
//   icon circle (40px, cobalt-soft bg)
//   label (15/600, 1-line truncate)
//   description (12/normal, 2-line clamp)
//   ── (divider, only when usage line shows)
//   "Last sent: 2d" (11/medium, muted)
//
// Tap target: whole tile is a <button> (44px+ min height via padding).
// Hover: bg-card-hover + 1px translateY. Focus: 2px accent outline.
// Disabled: 0.45 opacity, no hover, no click, aria-disabled=true.

import { Bell, CalendarClock, CalendarDays, Flag, Medal, Megaphone, MessageSquare, Trophy, UserPlus } from 'lucide-react';

const ICON_MAP = { Bell, CalendarClock, CalendarDays, Flag, Medal, Megaphone, MessageSquare, Trophy, UserPlus };

function relTime(ms) {
  if (!ms) return null;
  const days = Math.floor((Date.now() - ms) / 86400000);
  if (days < 1) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? '1mo ago' : `${months}mo ago`;
}

const tileBase = {
  display: 'flex', flexDirection: 'column', gap: 8, padding: 14,
  minHeight: 140, width: '100%', borderRadius: 10,
  border: '1px solid var(--em-border-subtle)',
  backgroundColor: 'var(--em-bg-card)', fontFamily: 'inherit', textAlign: 'left',
  transition: 'background-color 120ms ease-out, transform 120ms ease-out',
};
const iconWrap = {
  width: 40, height: 40, borderRadius: 20,
  backgroundColor: 'var(--em-accent-soft)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  alignSelf: 'flex-start',
};
const labelStyle = {
  fontSize: 15, fontWeight: 600, color: 'var(--em-text-primary)',
  lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
};
const descStyle = {
  fontSize: 12, fontWeight: 400, color: 'var(--em-text-secondary)',
  lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical', overflow: 'hidden',
};
const usageWrap = {
  marginTop: 'auto', paddingTop: 8,
  borderTop: '1px solid var(--em-border-subtle)',
  fontSize: 11, fontWeight: 500, letterSpacing: '0.02em',
  color: 'var(--em-text-tertiary)',
};

export default function KindTile({ kind, meta, usage, disabled = false, onClick }) {
  const Icon = ICON_MAP[meta?.icon] || MessageSquare;
  const lastRel = relTime(usage?.lastSentAt);
  const interactive = !disabled;
  const handleClick = () => { if (interactive && onClick) onClick(kind); };
  const style = {
    ...tileBase,
    opacity: disabled ? 0.45 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
  };
  return (
    <button
      type="button"
      data-kind={kind}
      onClick={handleClick}
      disabled={disabled}
      aria-disabled={disabled}
      aria-label={`${meta?.label || kind}: ${meta?.description || ''}`}
      className={interactive ? 'sf-press kind-tile' : 'kind-tile'}
      style={style}
    >
      <span style={iconWrap}>
        <Icon size={20} strokeWidth={1.75} color="var(--em-accent)" />
      </span>
      <span style={labelStyle}>{meta?.label || kind}</span>
      <span style={descStyle}>{meta?.description || ''}</span>
      {lastRel && (
        <span style={usageWrap} data-testid="usage-line">
          {usage?.count ? `Last sent ${lastRel} · ${usage.count} sent` : `Last sent ${lastRel}`}
        </span>
      )}
    </button>
  );
}
