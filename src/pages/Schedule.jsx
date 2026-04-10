import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { RsvpSection, RideBoard, CommentsThread, DutySignups, useWeather, WeatherBadge } from '../components/EventInteractions';
import { FILTER_TYPES as EVENT_TYPES, TYPE_LABELS, STATUS_ICONS } from '../lib/constants';
import {
  formatDate,
  formatDateShort,
  formatTime,
  relativeTime,
  changeAgo,
  formatCountdown,
  eventLiveStatus,
} from '../lib/formatters';
import {
  TYPE_BADGE_CLS,
  PILL_ACTIVE,
  PILL_INACTIVE,
  PILL_CLS,
  CARD_CLS,
  MODAL_BACKDROP,
  MODAL_PANEL,
  MODAL_CENTER_CLS,
  MODAL_CENTER_PANEL_MD_CLS,
  BTN_PRIMARY,
  BTN_PRIMARY_STYLE,
  BTN_SECONDARY,
} from '../lib/styles';

const LS_KEY = 'schedule_last_visited';

// ─── Helpers ─────────────────────────────────────────────────
function getMonday(d) { const dt = new Date(d); const day = dt.getDay(); dt.setDate(dt.getDate() - ((day + 6) % 7)); dt.setHours(0, 0, 0, 0); return dt; }
function getSunday(mon) { const s = new Date(mon); s.setDate(s.getDate() + 6); s.setHours(23, 59, 59, 999); return s; }

function mapsUrl(address) { return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`; }

function gcalUrl(ev) {
  const start = new Date(ev.start_at).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const end = ev.end_at ? new Date(ev.end_at).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '') : start;
  const details = [ev.notes, ev.opponent ? `vs. ${ev.opponent}` : '', ev.jersey ? `Wear ${ev.jersey.toUpperCase()} jersey` : '', ev.location_address ? `Directions: ${mapsUrl(ev.location_address)}` : ''].filter(Boolean).join('\n');
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(ev.title)}&dates=${start}/${end}&location=${encodeURIComponent(ev.location || '')}&details=${encodeURIComponent(details)}`;
}

function generateIcs(events, calName) {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Skyfire//Schedule//EN', `X-WR-CALNAME:${calName}`, 'CALSCALE:GREGORIAN'];
  for (const ev of events) {
    const dtFmt = (d) => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const status = ev.status === 'cancelled' ? 'CANCELLED' : ev.status === 'postponed' ? 'TENTATIVE' : 'CONFIRMED';
    const desc = [ev.notes, ev.opponent ? `vs. ${ev.opponent}` : '', ev.jersey ? `Wear ${ev.jersey.toUpperCase()} jersey` : '', ev.location_address ? `Directions: ${mapsUrl(ev.location_address)}` : ''].filter(Boolean).join('\\n');
    lines.push('BEGIN:VEVENT', `UID:${ev.id}@skyfire-app`, `DTSTART:${dtFmt(ev.arrival_minutes_before ? new Date(new Date(ev.start_at).getTime() - ev.arrival_minutes_before * 60000) : ev.start_at)}`);
    if (ev.end_at) lines.push(`DTEND:${dtFmt(ev.end_at)}`);
    lines.push(`SUMMARY:${ev.title}`, `STATUS:${status}`);
    if (ev.location || ev.location_address) lines.push(`LOCATION:${ev.location_address || ev.location}`);
    if (desc) lines.push(`DESCRIPTION:${desc}`);
    if (ev.updated_at) lines.push(`LAST-MODIFIED:${dtFmt(ev.updated_at)}`);
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

// ─── Skeleton card ───────────────────────────────────────────
// Renders during initial load — same dimensions as a real EventCard so the
// page doesn't shift when data lands. Pulses via the sf-pulse animation
// defined in index.css.
function SkeletonCard() {
  return (
    <div
      className="rounded-lg border border-(--color-border-tertiary) bg-(--color-background)"
      style={{ borderLeftWidth: '4px', borderLeftColor: 'var(--color-skeleton)', minHeight: '80px' }}
      aria-hidden="true"
    >
      <div className="p-4">
        <div className="sf-pulse rounded mb-2" style={{ width: '60px', height: '14px', backgroundColor: 'var(--color-skeleton)' }} />
        <div className="sf-pulse rounded-full mb-2" style={{ width: '80px', height: '20px', backgroundColor: 'var(--color-skeleton)' }} />
        <div className="sf-pulse rounded mb-2" style={{ width: '200px', height: '16px', backgroundColor: 'var(--color-skeleton)' }} />
        <div className="sf-pulse rounded" style={{ width: '150px', height: '12px', backgroundColor: 'var(--color-skeleton)' }} />
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────
function TypeBadge({ type }) {
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_BADGE_CLS[type] || TYPE_BADGE_CLS.other}`}>{TYPE_LABELS[type] || type}</span>;
}

function TeamPill({ name, color }) {
  return <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: color || 'var(--sf-accent)', color: '#fff' }}>{name}</span>;
}

function Pill({ active, onClick, children, ...rest }) {
  return <button onClick={onClick} className={PILL_CLS} style={active ? PILL_ACTIVE : PILL_INACTIVE} {...rest}>{children}</button>;
}

// ─── Season Progress Bar ─────────────────────────────────────
function SeasonBar({ season }) {
  if (!season) return null;
  const start = new Date(season.start_date).getTime();
  const end = new Date(season.end_date).getTime();
  const now = Date.now();
  const totalWeeks = Math.max(1, Math.ceil((end - start) / (7 * 86400000)));
  const elapsed = Math.max(0, Math.min(totalWeeks, Math.ceil((now - start) / (7 * 86400000))));
  const pct = Math.min(100, Math.round((elapsed / totalWeeks) * 100));
  return (
    <div className="mb-4 print:hidden sf-fade-in">
      <p className="text-xs font-medium text-(--color-text-secondary) mb-1.5">
        Week <span className="font-bold text-(--color-text-primary)">{elapsed}</span> of {totalWeeks} — {season.name}
      </p>
      {/* 2px filled line — no track background, just the progress and a glow dot at the leading edge. */}
      <div className="relative h-0.5 w-full">
        {pct > 0 && (
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all"
            style={{ width: `${pct}%`, backgroundColor: 'var(--sf-accent)' }}
          />
        )}
        {pct > 0 && pct < 100 && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-1 h-1 rounded-full"
            style={{
              left: `calc(${pct}% - 2px)`,
              backgroundColor: 'var(--sf-accent)',
              boxShadow: '0 0 6px var(--sf-accent)',
            }}
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );
}

// ─── Day Strip ───────────────────────────────────────────────
// Mon-Sun of the current week. Today is highlighted, days that have events
// get a small team-colored dot underneath, and tapping a day with events
// scrolls to that date group in the schedule.
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function DayStrip({ events, onScrollToDate }) {
  const monday = useMemo(() => getMonday(new Date()), []);
  const todayStr = new Date().toDateString();

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      const dateStr = d.toDateString();
      const dayEvents = events.filter((e) => new Date(e.start_at).toDateString() === dateStr);
      return {
        date: d,
        dateStr,
        isToday: dateStr === todayStr,
        label: DAY_LABELS[i],
        hasEvents: dayEvents.length > 0,
        color: dayEvents[0]?.teams?.team_color || null,
        ariaLabel: d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
      };
    });
  }, [monday, events, todayStr]);

  const thisWeekHasEvents = days.some((d) => d.hasEvents);

  return (
    <div className="mb-4 print:hidden sf-fade-in">
      <div
        className="flex gap-2 overflow-x-auto sf-no-scrollbar pb-1"
        style={{ scrollSnapType: 'x mandatory' }}
        aria-label="Days this week"
      >
        {days.map((d, i) => (
          <button
            key={i}
            onClick={() => d.hasEvents && onScrollToDate(d.dateStr)}
            disabled={!d.hasEvents}
            className="flex-shrink-0 w-11 flex flex-col items-center gap-1 sf-press"
            style={{ scrollSnapAlign: 'center' }}
            aria-label={`${d.ariaLabel}${d.hasEvents ? '' : ' (no events)'}`}
          >
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-xs font-semibold transition-colors"
              style={{
                backgroundColor: d.isToday ? 'var(--sf-accent)' : 'var(--color-background-secondary)',
                color: d.isToday
                  ? 'var(--sf-text-on-dark)'
                  : 'var(--color-text-primary)',
                opacity: d.isToday || d.hasEvents ? 1 : 0.4,
              }}
            >
              {d.label}
            </div>
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: d.color || 'transparent' }}
              aria-hidden="true"
            />
          </button>
        ))}
      </div>
      {!thisWeekHasEvents && (
        <p className="text-[13px] text-(--color-text-secondary) mt-1">No events this week</p>
      )}
    </div>
  );
}

// ─── Countdown Banner ────────────────────────────────────────
function CountdownBanner({ events, onScrollTo }) {
  const [, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick((t) => t + 1), 60000); return () => clearInterval(id); }, []);
  const next = events.find((e) => new Date(e.start_at) > new Date() && e.status === 'scheduled');
  if (!next) return null;
  const rel = relativeTime(next.start_at);
  if (!rel) return null;

  const teamColor = next.teams?.team_color || 'var(--sf-accent)';
  const hoursUntil = (new Date(next.start_at).getTime() - Date.now()) / 3600000;
  const isWithin2h = hoursUntil < 2;

  return (
    <button
      onClick={() => onScrollTo(next.id)}
      className="w-full text-left rounded-lg p-3 mb-4 flex items-center gap-3 border border-(--color-border-tertiary) hover:shadow-sm transition-shadow print:hidden sf-fade-in sf-press"
      style={{
        borderLeftWidth: '4px',
        borderLeftColor: teamColor,
        // 5% team-color tint fading to transparent — 0d hex alpha ≈ 5%.
        background: `linear-gradient(to right, ${teamColor}0d, transparent 65%)`,
      }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-(--color-text-primary) truncate flex items-center gap-2">
          {isWithin2h && (
            <span
              className="inline-block w-2 h-2 rounded-full bg-emerald-500 sf-pulse-dot flex-shrink-0"
              aria-hidden="true"
            />
          )}
          <span className="truncate">Next up: {next.title}</span>
        </p>
        <p className="text-xs text-(--color-text-secondary)">{rel}</p>
      </div>
    </button>
  );
}

// ─── Subscribe Modal ─────────────────────────────────────────
function SubscribeModal({ icsBlob, calName, onClose }) {
  const [copied, setCopied] = useState(false);
  const url = useMemo(() => icsBlob ? URL.createObjectURL(icsBlob) : null, [icsBlob]);
  function handleCopy() {
    if (url) { navigator.clipboard.writeText(url).then(() => setCopied(true)); setTimeout(() => setCopied(false), 2000); }
  }
  return (
    <div className={MODAL_CENTER_CLS} style={MODAL_BACKDROP} onClick={onClose}>
      <div className={MODAL_CENTER_PANEL_MD_CLS} style={MODAL_PANEL} onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-(--color-text-primary) mb-2">Subscribe to Calendar</h2>
        <p className="text-sm text-(--color-text-secondary) mb-4">Download the .ics file and import it into Google Calendar (Add by URL), Apple Calendar (File → Import), or Outlook.</p>
        <div className="flex gap-3">
          {url && <a href={url} download={`${calName}.ics`} className={BTN_PRIMARY} style={BTN_PRIMARY_STYLE}>Download .ics</a>}
          <button onClick={handleCopy} className={BTN_SECONDARY}>
            {copied ? 'Copied!' : 'Copy URL'}
          </button>
          <button onClick={onClose} className={`${BTN_SECONDARY} ml-auto`}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── Section header (used inside expanded card) ─────────────
// Tiny presentational helper so every section header in the expanded view
// looks identical: thin border-top divider + uppercase label.
function SectionDivider({ label, children }) {
  return (
    <div className="border-t border-(--color-border-tertiary) mt-3 pt-3">
      <p
        className="mb-2 font-medium text-(--color-text-secondary)"
        style={{ fontSize: '11px', letterSpacing: '0.05em', textTransform: 'uppercase' }}
      >
        {label}
      </p>
      {children}
    </div>
  );
}

// ─── Multi-provider directions button + popover ─────────────
// Tap "Get Directions" → small popover with Google / Apple / Waze rows.
// Each row opens the platform's map app with the encoded address. The
// popover closes on outside click and Escape.
function DirectionsButton({ address }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleDoc(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    function handleKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleDoc);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleDoc);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  if (!address) return null;
  const enc = encodeURIComponent(address);
  const providers = [
    { label: 'Google Maps', url: `https://www.google.com/maps/search/?api=1&query=${enc}` },
    { label: 'Apple Maps',  url: `https://maps.apple.com/?q=${enc}` },
    { label: 'Waze',        url: `https://waze.com/ul?q=${enc}` },
  ];

  return (
    <div className="relative inline-block" ref={wrapRef}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="rounded px-3 py-2 text-sm font-medium"
        style={{ backgroundColor: 'var(--sf-accent)', color: 'var(--sf-text-on-dark)' }}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        Get Directions
      </button>
      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full mt-1 rounded-lg shadow-lg z-10 overflow-hidden border border-(--color-border-tertiary)"
          style={{ backgroundColor: 'var(--color-background-primary, #ffffff)', minWidth: '180px' }}
        >
          {providers.map((p) => (
            <a
              key={p.label}
              role="menuitem"
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => { e.stopPropagation(); setOpen(false); }}
              className="flex items-center px-4 text-sm text-(--color-text-primary) hover:bg-(--color-background-secondary)"
              style={{ height: '44px' }}
            >
              {p.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Share event button ─────────────────────────────────────
// Uses the Web Share API on mobile when available, otherwise falls back to
// copying the URL to the clipboard with a transient "Copied!" label.
function ShareEventButton({ url, title }) {
  const [copied, setCopied] = useState(false);
  async function handleClick(e) {
    e.stopPropagation();
    if (navigator.share) {
      try { await navigator.share({ title, url }); return; } catch { /* user cancelled */ }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Share fallback failed:', err);
    }
  }
  return (
    <button
      type="button"
      onClick={handleClick}
      className="rounded border px-3 py-2 text-sm font-medium border-(--color-border-tertiary) text-(--color-text-secondary) hover:bg-(--color-background-secondary)"
    >
      {copied ? 'Copied!' : 'Share'}
    </button>
  );
}

// ─── Expandable Event Card ───────────────────────────────────
function EventCard({ event, expanded, onToggle, isNew, isUpdated, userRole, isStaff, weather, isPublic, onUpdate }) {
  const team = event.teams;
  const isCancelled = event.status === 'cancelled';
  const isPostponed = event.status === 'postponed';
  const borderColor = isPostponed ? '#f59e0b' : team?.team_color || 'var(--sf-accent)';
  const si = STATUS_ICONS[event.status] || STATUS_ICONS.scheduled;

  // Live tick — only events happening today need a countdown that updates
  // every minute. Other cards skip the interval entirely.
  const isToday = new Date(event.start_at).toDateString() === new Date().toDateString();
  const showLiveCountdown = isToday && event.status === 'scheduled';
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!showLiveCountdown) return;
    const id = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(id);
  }, [showLiveCountdown]);

  const liveStatus = showLiveCountdown ? eventLiveStatus(event.start_at, event.end_at) : null;
  const countdownLabel = liveStatus === 'upcoming' ? formatCountdown(event.start_at) : null;

  // Smooth height transition for expand/collapse — measure the real content
  // height with a ref so the animation runs from 0 → actual scrollHeight
  // instead of relying on a hard-coded max-height cap.
  const contentRef = useRef(null);
  const [measuredHeight, setMeasuredHeight] = useState(0);
  useEffect(() => {
    if (!expanded) return;
    if (contentRef.current) setMeasuredHeight(contentRef.current.scrollHeight);
  }, [expanded, event]);

  // Arrival time
  const arrivalTime = event.arrival_minutes_before ? formatTime(new Date(new Date(event.start_at).getTime() - event.arrival_minutes_before * 60000).toISOString()) : null;

  // Proximity badge
  const hoursUntil = (new Date(event.start_at).getTime() - Date.now()) / 3600000;
  let proximityLabel = null;
  if (hoursUntil > 0 && hoursUntil <= 48) {
    if (new Date(event.start_at).toDateString() === new Date().toDateString()) proximityLabel = 'Today';
    else if (hoursUntil <= 24) proximityLabel = 'Tomorrow';
    else proximityLabel = 'In 2 days';
  }

  // Recent changes (last 48h)
  const recentChanges = (event.event_changes || []).filter((c) => Date.now() - new Date(c.changed_at).getTime() < 48 * 3600000);

  // Multi-day
  const isMultiDay = event.is_multi_day && event.end_date;
  const dateRange = isMultiDay ? `${formatDateShort(event.start_at)}–${formatDateShort(event.end_date + 'T12:00:00')}` : null;

  // Sub-events
  const subEvents = event._children || [];

  const showCoachNotes = event.coach_notes && (userRole === 'admin' || isStaff);

  return (
    <div
      id={`event-${event.id}`}
      className={`${CARD_CLS} ${isCancelled ? 'opacity-60' : ''}`}
      style={{ borderLeftWidth: '4px', borderLeftColor: borderColor }}
      onClick={onToggle}
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) {
          e.preventDefault();
          onToggle();
        }
      }}
    >
      {/* Collapsed */}
      <div className="p-4">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          {liveStatus === 'in_progress' ? (
            <span className="text-sm font-semibold text-emerald-600 inline-flex items-center gap-1.5">
              <span
                className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 sf-pulse-dot"
                aria-hidden="true"
              />
              In progress
            </span>
          ) : liveStatus === 'completed' ? (
            <span className="text-sm font-semibold text-(--color-text-secondary)">
              ✓ Completed
            </span>
          ) : countdownLabel ? (
            <span className="text-sm font-semibold text-(--color-text-primary)">{countdownLabel}</span>
          ) : (
            <span className="text-sm font-semibold text-(--color-text-primary)">
              {isMultiDay ? dateRange : (<>{formatTime(event.start_at)}{event.end_at && !event.is_multi_day && ` – ${formatTime(event.end_at)}`}</>)}
            </span>
          )}
          {team && <TeamPill name={team.name} color={team.team_color} />}
          <TypeBadge type={event.event_type} />
          {isPostponed && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Postponed</span>}
          {!isPostponed && <span className={`text-xs ${si.cls}`} title={event.status}>{si.icon}</span>}
          {isNew && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">New</span>}
          {isUpdated && !isNew && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Updated</span>}
          {proximityLabel && <span className="text-xs font-medium text-(--color-text-secondary)">{proximityLabel}</span>}
          {weather && <WeatherBadge weather={weather} />}
        </div>
        <h3 className={`font-medium text-(--color-text-primary) ${isCancelled ? 'line-through' : ''}`}>{event.title}</h3>
        {!expanded && event.location && <p className="text-sm text-(--color-text-secondary) mt-0.5 truncate">{event.location}</p>}
        {!expanded && (() => {
          const rsvps = event.event_rsvps || [];
          const rCounts = { going: 0, maybe: 0, not_going: 0 };
          for (const r of rsvps) rCounts[r.response] = (rCounts[r.response] || 0) + 1;
          const hasRsvps = rsvps.length > 0 || event.rsvp_deadline;
          const rides = event.event_rides || [];
          const offeredSeats = rides.filter((r) => r.ride_type === 'offering').reduce((s, r) => s + (r.seats || 0), 0);
          const neededSeats = rides.filter((r) => r.ride_type === 'requesting').reduce((s, r) => s + (r.seats || 0), 0);
          const deadlineMs = event.rsvp_deadline ? new Date(event.rsvp_deadline).getTime() - Date.now() : null;
          const deadlineDays = deadlineMs && deadlineMs > 0 ? Math.ceil(deadlineMs / 86400000) : null;
          return (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs text-(--color-text-secondary)">
              {hasRsvps && (
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-0.5"><span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />{rCounts.going}</span>
                  <span className="inline-flex items-center gap-0.5"><span className="inline-block w-2 h-2 rounded-full bg-amber-400" />{rCounts.maybe}</span>
                  <span className="inline-flex items-center gap-0.5"><span className="inline-block w-2 h-2 rounded-full bg-red-500" />{rCounts.not_going}</span>
                </span>
              )}
              {deadlineDays && deadlineDays <= 3 && <span className="text-amber-600 font-medium">RSVP closes in {deadlineDays} day{deadlineDays !== 1 ? 's' : ''}</span>}
              {event.enable_rides && (
                <span>{offeredSeats > 0 || neededSeats > 0 ? `${offeredSeats} ${offeredSeats !== 1 ? 'seats' : 'seat'} · ${neededSeats} needed` : 'No rides yet'}</span>
              )}
              {(event.event_duties || []).length > 0 && (
                <span className="truncate max-w-[250px]">
                  {(event.event_duties || []).map((d) => `${d.duty_name}: ${d.claimed_by_name || 'Open'}`).join(' · ')}
                </span>
              )}
            </div>
          );
        })()}
      </div>

      {/* Expanded — height animates from 0 → measured scrollHeight via the
          ref-based approach in the useEffect above. */}
      <div
        style={{
          height: expanded ? `${measuredHeight}px` : '0px',
          transition: 'height 300ms ease-out',
          overflow: 'hidden',
        }}
      >
        <div
          ref={contentRef}
          className="px-4 pb-4 border-t border-(--color-border-tertiary) pt-3"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Game day block — for game events, with team-color tinted background. */}
          {event.event_type === 'game' && (
            <div>
              <p
                className="mb-2 font-medium text-(--color-text-secondary)"
                style={{ fontSize: '11px', letterSpacing: '0.05em', textTransform: 'uppercase' }}
              >
                Game Day
              </p>
              <div
                className="rounded-lg p-3 space-y-1"
                style={{ backgroundColor: `${team?.team_color || '#000000'}08` }}
              >
                {event.opponent && <p className="text-sm font-medium text-(--color-text-primary)">vs. {event.opponent}</p>}
                {event.jersey && <p className="text-sm text-(--color-text-primary)">Wear <strong>{event.jersey.toUpperCase()}</strong> jersey</p>}
                {arrivalTime && <p className="text-sm text-(--color-text-primary)">Arrive by {arrivalTime}</p>}
                {event.location && <p className="text-sm text-(--color-text-primary)">{event.location}</p>}
                {event.location_address && (
                  <p className="text-xs text-(--color-text-secondary)">{event.location_address}</p>
                )}
                {event.location_address && (
                  <div className="pt-1">
                    <DirectionsButton address={event.location_address} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Details — for non-game events. */}
          {event.event_type !== 'game' && (arrivalTime || event.location || event.location_address) && (
            <SectionDivider label="Details">
              <div className="space-y-1">
                {arrivalTime && <p className="text-sm text-(--color-text-primary)">Arrive by {arrivalTime}</p>}
                {event.location && <p className="text-sm text-(--color-text-primary)">{event.location}</p>}
                {event.location_address && (
                  <p className="text-xs text-(--color-text-secondary)">{event.location_address}</p>
                )}
                {event.location_address && (
                  <div className="pt-1">
                    <DirectionsButton address={event.location_address} />
                  </div>
                )}
              </div>
            </SectionDivider>
          )}

          {/* Notes */}
          {event.notes && (
            <SectionDivider label="Notes">
              <p className="text-sm text-(--color-text-secondary)">{event.notes}</p>
            </SectionDivider>
          )}

          {/* Attachments */}
          {event.attachments?.length > 0 && (
            <SectionDivider label="Attachments">
              <div className="flex flex-wrap gap-2">
                {event.attachments.map((a, i) => (
                  <a
                    key={i}
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium hover:underline"
                    style={{ color: 'var(--sf-accent)' }}
                  >
                    {a.name}
                  </a>
                ))}
              </div>
            </SectionDivider>
          )}

          {/* What changed (last 48h) */}
          {recentChanges.length > 0 && (
            <SectionDivider label="Changes">
              <details className="text-sm">
                <summary className="text-(--color-text-secondary) cursor-pointer hover:underline">
                  What changed ({recentChanges.length})
                </summary>
                <ul className="mt-1 space-y-0.5 pl-4 text-(--color-text-secondary)">
                  {recentChanges.map((c) => (
                    <li key={c.id}>
                      {c.field_name} changed
                      {c.old_value ? ` from "${c.old_value}"` : ''}
                      {c.new_value ? ` to "${c.new_value}"` : ''} — {changeAgo(c.changed_at)}
                    </li>
                  ))}
                </ul>
              </details>
            </SectionDivider>
          )}

          {/* RSVP */}
          <SectionDivider label="Availability">
            <RsvpSection event={event} userRole={userRole} isPublic={isPublic || false} onUpdate={onUpdate} />
          </SectionDivider>

          {/* Duties */}
          {(event.event_duties || []).length > 0 && (
            <SectionDivider label="Duties">
              <DutySignups event={event} userRole={userRole} isPublic={isPublic || false} onUpdate={onUpdate} />
            </SectionDivider>
          )}

          {/* Rides */}
          {event.enable_rides && (
            <SectionDivider label="Rides">
              <RideBoard event={event} userRole={userRole} isPublic={isPublic || false} onUpdate={onUpdate} />
            </SectionDivider>
          )}

          {/* Coach notes (admin/staff only) — distinct amber treatment with
              a small lock label so it's obvious this isn't parent-visible. */}
          {showCoachNotes && (
            <SectionDivider label="Coach Only">
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                <p
                  className="mb-1 font-medium text-amber-700"
                  style={{ fontSize: '11px', letterSpacing: '0.05em', textTransform: 'uppercase' }}
                >
                  🔒 Coach Only
                </p>
                <p className="text-sm text-amber-800 whitespace-pre-wrap">{event.coach_notes}</p>
              </div>
            </SectionDivider>
          )}

          {/* Comments */}
          <SectionDivider label="Discussion">
            <CommentsThread event={event} userRole={userRole} isPublic={isPublic || false} onUpdate={onUpdate} />
          </SectionDivider>

          {/* Sub-events (multi-day tournament children) */}
          {subEvents.length > 0 && (
            <SectionDivider label="Sub-events">
              <div className="space-y-2 pl-2 border-l-2 border-(--color-border-tertiary)">
                {subEvents.map((sub) => (
                  <div key={sub.id} className="text-sm">
                    <span className="font-medium text-(--color-text-primary)">{formatTime(sub.start_at)}</span>
                    {sub.opponent && <span className="text-(--color-text-secondary)"> — vs. {sub.opponent}</span>}
                    <span className="text-(--color-text-secondary)"> {sub.title}</span>
                  </div>
                ))}
              </div>
            </SectionDivider>
          )}

          {/* Actions row — proper buttons for calendar export and share. */}
          <SectionDivider label="Actions">
            <div className="flex flex-wrap gap-2">
              <a
                href={gcalUrl(event)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="rounded border px-3 py-2 text-sm font-medium hover:bg-(--color-background-secondary)"
                style={{ borderColor: 'var(--sf-accent)', color: 'var(--sf-accent)' }}
              >
                Add to Calendar
              </a>
              <ShareEventButton
                title={event.title}
                // Share the current page URL with an event-id hash so the
                // recipient can deep-link to the same event. A proper public
                // /s/[slug]/event/[id] route arrives in B3.
                url={`${window.location.href.split('#')[0]}#event-${event.id}`}
              />
            </div>
          </SectionDivider>
        </div>
      </div>
    </div>
  );
}

// ─── Print table ─────────────────────────────────────────────
function PrintTable({ events }) {
  let prevMonthKey = null;
  return (
    <div className="hidden print:block">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b-2 border-black text-left">
            <th className="py-1 pr-3">Date</th><th className="py-1 pr-3">Time</th><th className="py-1 pr-3">Team</th><th className="py-1 pr-3">Type</th><th className="py-1 pr-3">Title</th><th className="py-1 pr-3">Location</th><th className="py-1">Opponent</th>
          </tr>
        </thead>
        <tbody>
          {events.map((ev) => {
            const d = new Date(ev.start_at);
            const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
            const isNewMonth = prevMonthKey !== null && monthKey !== prevMonthKey;
            prevMonthKey = monthKey;
            return (
              <tr key={ev.id} className={`border-b border-gray-300 break-inside-avoid ${isNewMonth ? 'break-before-page' : ''}`}>
                <td className="py-1 pr-3 whitespace-nowrap">{formatDateShort(ev.start_at)}</td>
                <td className="py-1 pr-3 whitespace-nowrap">{formatTime(ev.start_at)}</td>
                <td className="py-1 pr-3">{ev.teams?.name || '—'}</td>
                <td className="py-1 pr-3">{TYPE_LABELS[ev.event_type] || ev.event_type}</td>
                <td className="py-1 pr-3 font-medium">{ev.title}</td>
                <td className="py-1 pr-3">{ev.location || '—'}</td>
                <td className="py-1">{ev.opponent || '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// =================================================================
// MAIN SCHEDULE COMPONENT
// =================================================================
export default function Schedule() {
  const { userRole, organization } = useAuth();
  const [events, setEvents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [season, setSeason] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teamFilter, setTeamFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showCancelled, setShowCancelled] = useState(false);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const lastVisited = useRef(localStorage.getItem(LS_KEY));

  // Team staff check (for coach_notes visibility)
  const [staffTeamIds, setStaffTeamIds] = useState([]);
  const weatherMap = useWeather(events);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      const seasonRes = await supabase.from('seasons').select('id, name, start_date, end_date').eq('status', 'active').single();
      if (seasonRes.error) {
        console.error('Failed to load season:', seasonRes.error);
        setEvents([]); setTeams([]); setLoading(false); return;
      }
      setSeason(seasonRes.data);

      const [eventsRes, teamsRes] = await Promise.all([
        supabase.from('events').select('*, teams(id, name, sort_order, team_color), event_changes(id, field_name, old_value, new_value, changed_at), event_duties(id, duty_name, slots_needed, guardian_id, claimed_by_name, claimed_at), event_rsvps(id, player_id, response, comment, responded_at), event_rides(id, ride_type, name, phone, seats, pickup_location, departure_time, notes), event_comments(id, author_name, body, pinned, created_at)').gte('start_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()).order('start_at', { ascending: true }),
        supabase.from('teams').select('id, name, sort_order, team_color').eq('season_id', seasonRes.data.id).order('sort_order', { ascending: true }),
      ]);

      if (eventsRes.error) { setError('Failed to load schedule.'); console.error(eventsRes.error); }
      else {
        // Nest child events under parents
        const all = eventsRes.data;
        const parentMap = {};
        for (const ev of all) { if (ev.parent_event_id) { (parentMap[ev.parent_event_id] = parentMap[ev.parent_event_id] || []).push(ev); } }
        for (const ev of all) { ev._children = parentMap[ev.id] || []; }
        setEvents(all.filter((ev) => !ev.parent_event_id));
      }
      if (teamsRes.error) console.error('Failed to load teams:', teamsRes.error);
      else setTeams(teamsRes.data);

      // Check if user is staff on any team
      const { data: staffData, error: staffErr } = await supabase.from('team_staff').select('team_id');
      if (staffErr) console.error('Failed to load team_staff:', staffErr);
      else if (staffData) setStaffTeamIds(staffData.map((s) => s.team_id));

      setLoading(false);
    }
    load();

    return () => { localStorage.setItem(LS_KEY, new Date().toISOString()); };
  }, []);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (teamFilter !== 'all' && e.team_id !== teamFilter) return false;
      if (typeFilter !== 'all' && e.event_type !== typeFilter) return false;
      if (!showCancelled && (e.status === 'cancelled' || e.status === 'postponed')) return false;
      return true;
    });
  }, [events, teamFilter, typeFilter, showCancelled]);

  const grouped = useMemo(() => {
    const groups = [];
    let currentDate = null;
    for (const event of filtered) {
      const date = new Date(event.start_at).toDateString();
      if (date !== currentDate) { currentDate = date; groups.push({ dateStr: date, date: event.start_at, events: [event] }); }
      else groups[groups.length - 1].events.push(event);
    }
    return groups;
  }, [filtered]);

  const refetchEvent = useCallback(async (eventId) => {
    const { data, error } = await supabase
      .from('events')
      .select('*, teams(id, name, sort_order, team_color), event_changes(id, field_name, old_value, new_value, changed_at), event_duties(id, duty_name, slots_needed, guardian_id, claimed_by_name, claimed_at), event_rsvps(id, player_id, response, comment, responded_at), event_rides(id, ride_type, name, phone, seats, pickup_location, departure_time, notes), event_comments(id, author_name, body, pinned, created_at)')
      .eq('id', eventId)
      .single();
    if (error || !data) return;
    setEvents((prev) => prev.map((e) => e.id === eventId ? { ...data, _children: e._children || [] } : e));
  }, []);

  const scrollToEvent = useCallback((id) => {
    const el = document.getElementById(`event-${id}`);
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); setExpandedIds((prev) => new Set(prev).add(id)); }
  }, []);

  // Used by the day strip — scroll to a specific date group by its dateStr key.
  const scrollToDate = useCallback((dateStr) => {
    const el = document.getElementById(`date-${dateStr}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const scrollToToday = useCallback(() => {
    const today = new Date().toDateString();
    const todayGroup = grouped.find((g) => g.dateStr === today) || grouped[0];
    if (todayGroup) scrollToDate(todayGroup.dateStr);
  }, [grouped, scrollToDate]);

  function handleShare() {
    const slug = organization?.slug || 'org';
    const teamSlug = teamFilter !== 'all' ? teams.find((t) => t.id === teamFilter)?.name?.toLowerCase().replace(/\s+/g, '-') : '';
    const url = `${window.location.origin}/s/${slug}${teamSlug ? '/' + teamSlug : ''}`;
    navigator.clipboard.writeText(url).then(() => { setShareCopied(true); setTimeout(() => setShareCopied(false), 2000); });
  }

  const icsBlob = useMemo(() => {
    const teamName = teamFilter !== 'all' ? teams.find((t) => t.id === teamFilter)?.name : 'All Teams';
    const calEvents = teamFilter !== 'all' ? events.filter((e) => e.team_id === teamFilter) : events;
    const ics = generateIcs(calEvents, `${organization?.name || 'Skyfire'} — ${teamName}`);
    return new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  }, [events, teamFilter, teams, organization]);

  const lv = lastVisited.current;

  return (
    <div>
      {/* Print header */}
      <div className="hidden print:block mb-4">
        <h1 className="text-xl font-bold">{organization?.name || 'Schedule'}</h1>
        {season && <p className="text-sm">{season.name} — {formatDateShort(season.start_date)} to {formatDateShort(season.end_date)}</p>}
      </div>

      <h1 className="text-2xl font-bold mb-4 print:hidden">Schedule</h1>

      <SeasonBar season={season} />
      <DayStrip events={filtered} onScrollToDate={scrollToDate} />
      <CountdownBanner events={filtered} onScrollTo={scrollToEvent} />

      {/* Filters */}
      <div className="flex flex-wrap items-start gap-3 mb-6 print:hidden">
        <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)} aria-label="Filter by team" className="border border-(--color-border-tertiary) rounded px-3 py-2 text-sm bg-(--color-background) text-(--color-text-primary) focus:outline-none focus:ring-2 focus:ring-[var(--sf-accent)]">
          <option value="all">All Teams</option>
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>

        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Filter by event type">
          {EVENT_TYPES.map((type) => <Pill key={type} active={typeFilter === type} onClick={() => setTypeFilter(type)} role="radio" aria-checked={typeFilter === type}>{TYPE_LABELS[type]}</Pill>)}
        </div>

        <Pill active={showCancelled} onClick={() => setShowCancelled((v) => !v)} aria-pressed={showCancelled}>
          {showCancelled ? 'Showing cancelled/postponed' : 'Show cancelled/postponed'}
        </Pill>

        {/* Action buttons */}
        <div className="flex gap-2 ml-auto">
          <button onClick={() => setShowSubscribe(true)} className="text-sm font-medium hover:underline hidden sm:inline" style={{ color: 'var(--sf-accent)' }}>Subscribe</button>
          {userRole === 'admin' && <button onClick={handleShare} className="text-sm font-medium hover:underline hidden sm:inline" style={{ color: 'var(--sf-accent)' }}>{shareCopied ? 'Copied!' : 'Share'}</button>}
          <button onClick={() => window.print()} className="text-sm font-medium hover:underline hidden sm:inline" style={{ color: 'var(--sf-accent)' }}>Print</button>
        </div>
      </div>

      {/* Loading / Error / Empty */}
      {loading && (
        <div className="flex flex-col gap-3" role="status" aria-live="polite" aria-label="Loading schedule">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}
      {error && <p role="alert" className="text-red-600 py-8 text-center">{error}</p>}
      {!loading && !error && filtered.length === 0 && (
        <div className="py-12 text-center sf-fade-in">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mx-auto mb-3 text-(--color-text-secondary)"
            aria-hidden="true"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <h2 className="text-lg font-medium text-(--color-text-primary) mb-1">All clear!</h2>
          <p className="text-sm text-(--color-text-secondary)">
            {teamFilter !== 'all' || typeFilter !== 'all'
              ? 'Try adjusting your filters.'
              : 'No upcoming events. Enjoy the downtime.'}
          </p>
        </div>
      )}

      {/* Event list */}
      {!loading && !error && grouped.map((group) => {
        const groupDate = new Date(group.date);
        const isTodayHeader = groupDate.toDateString() === new Date().toDateString();
        const dayOfWeek = groupDate.toLocaleDateString('en-US', { weekday: 'long' });
        const monthDay = groupDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
        const count = group.events.length;
        return (
        <div key={group.dateStr} id={`date-${group.dateStr}`} className="mb-6 print:hidden">
          <div
            className="flex justify-between items-center rounded-lg px-4 py-3 mb-3"
            style={{
              backgroundColor: 'var(--color-background-secondary)',
              borderLeft: isTodayHeader ? '4px solid var(--sf-accent)' : undefined,
            }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="text-sm font-semibold text-(--color-text-primary)">
                {dayOfWeek} <span className="text-[13px] font-normal text-(--color-text-secondary) ml-1">{monthDay}</span>
              </h2>
              {isTodayHeader && (
                <span
                  className="text-[10px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5"
                  style={{ backgroundColor: 'var(--sf-accent)', color: 'var(--sf-text-on-dark)' }}
                >
                  Today
                </span>
              )}
            </div>
            <span className="text-xs text-(--color-text-secondary) flex-shrink-0">
              {count} event{count !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {group.events.map((event) => {
              const isNew = lv && event.created_at > lv;
              const isUpdated = lv && event.updated_at > lv && event.updated_at !== event.created_at;
              return (
                <EventCard
                  key={event.id}
                  event={event}
                  expanded={expandedIds.has(event.id)}
                  onToggle={() => setExpandedIds((prev) => { const next = new Set(prev); if (next.has(event.id)) next.delete(event.id); else next.add(event.id); return next; })}
                  isNew={isNew}
                  isUpdated={isUpdated}
                  userRole={userRole}
                  isStaff={staffTeamIds.includes(event.team_id)}
                  weather={weatherMap[event.id]}
                  isPublic={false}
                  onUpdate={() => refetchEvent(event.id)}
                />
              );
            })}
          </div>
        </div>
        );
      })}

      {/* Print-only table */}
      <PrintTable events={filtered} />

      {/* Today button — mobile floating, desktop hidden (scroll-to-today is near filters on desktop) */}
      {!loading && filtered.length > 0 && (
        <button onClick={scrollToToday} className="sm:hidden fixed bottom-6 right-6 z-40 rounded-full shadow-lg px-4 py-2 text-sm font-medium flex items-center gap-1 print:hidden" style={{ backgroundColor: 'var(--sf-accent)', color: 'var(--sf-text-on-dark)' }}>
          Today <span aria-hidden="true">&darr;</span>
        </button>
      )}

      {/* Subscribe modal */}
      {showSubscribe && <SubscribeModal icsBlob={icsBlob} calName={teamFilter !== 'all' ? teams.find((t) => t.id === teamFilter)?.name || 'schedule' : 'schedule'} onClose={() => setShowSubscribe(false)} />}
    </div>
  );
}

// ─── Shared components for public schedule ───────────────────
export { EventCard, TypeBadge, TeamPill, SeasonBar, generateIcs, gcalUrl, mapsUrl, Pill };
