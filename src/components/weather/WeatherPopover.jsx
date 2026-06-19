import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useWeatherContext } from '../../context/WeatherContext';
import { formatEventTitle } from '../../lib/eventTitle';

// R-1/R-2/R-3 (architect render + Manus PR-2 spec): a lightweight inline
// weather popover — a READ-ONLY disclosure, not a form (AP#15), so it borrows
// BottomSheet's a11y mechanics (portal, Escape, outside-tap, focus return)
// but renders as a small anchored card, no backdrop. Pure render of the
// already-matched `hour`; the day's rain% is fetched on OPEN only (per
// interaction, never per-row) via the context. Renders nothing when there is
// no matched hour (never fabricate). ≤150 LOC, var(--as-*) tokens only.
export default function WeatherPopover({ event, hour }) {
  const { fetchDaily } = useWeatherContext();
  const [open, setOpen] = useState(false);
  const [rain, setRain] = useState(null);
  const [pos, setPos] = useState(null);
  const triggerRef = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') { setOpen(false); triggerRef.current?.focus(); } };
    const onDown = (e) => {
      if (!cardRef.current?.contains(e.target) && !triggerRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', onDown); };
  }, [open]);

  if (!hour) return null;

  const { prefix, body } = formatEventTitle(event);
  const label = `Weather for ${`${prefix}${body}`.trim()}: ${hour.label}, ${hour.temp} degrees`;

  const openPopover = () => {
    const r = triggerRef.current?.getBoundingClientRect();
    if (r) {
      const below = r.bottom < window.innerHeight - 180;
      setPos({
        top: below ? Math.round(r.bottom + 6) : undefined,
        bottom: below ? undefined : Math.round(window.innerHeight - r.top + 6),
        left: Math.round(Math.max(8, Math.min(r.left, window.innerWidth - 168))),
      });
    }
    const day = String(event.start_at).slice(0, 10);
    fetchDaily(day, day).then((rows) => setRain(rows?.[0]?.rn ?? null)).catch(() => setRain(null));
    setOpen(true);
  };

  return (
    <span style={{ position: 'relative', display: 'inline-flex', marginTop: 5 }}>
      <button
        ref={triggerRef} type="button"
        onClick={() => (open ? setOpen(false) : openPopover())}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') e.stopPropagation(); }}
        aria-label={label} aria-haspopup="dialog" aria-expanded={open}
        style={{ position: 'relative', border: 'none', background: 'none', padding: 0, cursor: 'pointer', fontSize: 11, lineHeight: 1, color: 'var(--as-text-tertiary)' }}
      >
        {/* invisible ≥44px hit area, centred on the glyph, no layout shift */}
        <span aria-hidden="true" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 44, height: 44 }} />
        {`${hour.icon} ${hour.temp}°`}
      </button>
      {open && pos && createPortal(
        <div
          ref={cardRef} role="dialog" aria-label={label}
          style={{ position: 'fixed', top: pos.top, bottom: pos.bottom, left: pos.left, zIndex: 60, minWidth: 152, padding: 12, backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)', borderRadius: 10, boxShadow: 'var(--as-shadow-lg)', textAlign: 'left' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--as-text-primary)' }}>
            <span aria-hidden="true" style={{ fontSize: 17 }}>{hour.icon}</span>{hour.label}
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--as-text-primary)', marginTop: 3 }}>{hour.temp}°</div>
          {rain && <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--as-info)', marginTop: 3 }}>{rain}</div>}
        </div>,
        document.body,
      )}
    </span>
  );
}
