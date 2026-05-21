// DutyBadge — icon + label for a volunteer duty slot or group.
//
// Extracted per L99 platform audit P2.5 D4. Renders an icon chosen by
// duty type (scorekeeper, snacks, scoreboard, etc.) + the duty label.
// Icons are best-effort: unknown duty types fall back to a clipboard
// glyph. All colors are token-driven (var(--em-*)) per CLAUDE.md §3.
//
// Surface today: EventDutiesTab group headers. Future callers welcome.

import { Apple, Camera, Clipboard, ClipboardList, Timer, Truck } from 'lucide-react';

// Lowercased duty_name match keys — duty_name is free-text in the DB,
// so we normalise once and look up. Unknown → ClipboardList fallback.
const ICON_MAP = {
  scorekeeper: ClipboardList,
  scoreboard: Timer,
  snacks: Apple,
  snack: Apple,
  photos: Camera,
  photographer: Camera,
  timekeeper: Timer,
  setup: Truck,
  breakdown: Truck,
};

export default function DutyBadge({ dutyType, label, compact = false }) {
  if (!dutyType) return null;

  const key = String(dutyType).trim().toLowerCase();
  const Icon = ICON_MAP[key] || Clipboard;
  const display = label || dutyType;

  const iconSize = compact ? 12 : 14;
  const fontSize = compact ? 12 : 13;
  const gap = compact ? 4 : 6;

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap, fontSize, color: 'var(--em-text-secondary)' }}>
      <Icon size={iconSize} strokeWidth={1.75} color="var(--em-text-tertiary)" aria-hidden="true" />
      <span style={{ fontWeight: 500 }}>{display}</span>
    </span>
  );
}
