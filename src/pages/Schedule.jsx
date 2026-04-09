import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { RsvpSection, RideBoard, CommentsThread, DutySignups, useWeather, WeatherBadge } from '../components/EventInteractions';

// ─── Constants ───────────────────────────────────────────────
const EVENT_TYPES = ['all', 'practice', 'game', 'tournament'];
const TYPE_LABELS = { all: 'All', practice: 'Practice', game: 'Game', tournament: 'Tournament', other: 'Other' };
const TYPE_BADGE_CLS = { practice: 'bg-emerald-100 text-emerald-800', game: 'bg-blue-100 text-blue-800', tournament: 'bg-purple-100 text-purple-800', other: 'bg-slate-100 text-slate-700' };
const STATUS_ICONS = { scheduled: { icon: '\u2713', cls: 'text-emerald-600' }, postponed: { icon: '\u23F8', cls: 'text-amber-500' }, cancelled: { icon: '\u2715', cls: 'text-red-500' } };
const PILL_ACTIVE = { backgroundColor: 'var(--sf-accent)', color: 'var(--sf-text-on-dark)' };
const PILL_INACTIVE = { backgroundColor: 'var(--color-background-secondary)', color: 'var(--color-text-secondary)' };
const LS_KEY = 'schedule_last_visited';

// ─── Helpers ─────────────────────────────────────────────────
function fmtDate(d) { return new Date(d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }); }
function fmtDateShort(d) { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
function fmtTime(d) { return new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }); }

function getMonday(d) { const dt = new Date(d); const day = dt.getDay(); dt.setDate(dt.getDate() - ((day + 6) % 7)); dt.setHours(0, 0, 0, 0); return dt; }
function getSunday(mon) { const s = new Date(mon); s.setDate(s.getDate() + 6); s.setHours(23, 59, 59, 999); return s; }

function relativeTime(iso) {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) return null;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `in ${mins} minute${mins !== 1 ? 's' : ''}`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `in ${hrs} hour${hrs !== 1 ? 's' : ''}`;
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  if (new Date(iso).toDateString() === tomorrow.toDateString()) return `Tomorrow at ${fmtTime(iso)}`;
  return `${new Date(iso).toLocaleDateString('en-US', { weekday: 'long' })} at ${fmtTime(iso)}`;
}

function changeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

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

// ─── Sub-components ──────────────────────────────────────────
function TypeBadge({ type }) {
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_BADGE_CLS[type] || TYPE_BADGE_CLS.other}`}>{TYPE_LABELS[type] || type}</span>;
}

function TeamPill({ name, color }) {
  return <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: color || 'var(--sf-accent)', color: '#fff' }}>{name}</span>;
}

function Pill({ active, onClick, children, ...rest }) {
  return <button onClick={onClick} className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors" style={active ? PILL_ACTIVE : PILL_INACTIVE} {...rest}>{children}</button>;
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
    <div className="mb-4 print:hidden">
      <p className="text-xs text-(--color-text-secondary) mb-1">Week {elapsed} of {totalWeeks} — {season.name}</p>
      <div className="h-1.5 rounded-full bg-(--color-background-secondary) overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: 'var(--sf-accent)' }} />
      </div>
    </div>
  );
}

// ─── This Week Summary ───────────────────────────────────────
function WeekSummary({ events }) {
  const mon = getMonday(new Date());
  const sun = getSunday(mon);
  const thisWeek = events.filter((e) => { const d = new Date(e.start_at); return d >= mon && d <= sun; });
  if (thisWeek.length === 0) return <p className="text-sm text-(--color-text-secondary) mb-3 print:hidden">No events this week</p>;
  const counts = {};
  for (const e of thisWeek) counts[e.event_type] = (counts[e.event_type] || 0) + 1;
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm mb-3 print:hidden">
      <span className="text-(--color-text-secondary) font-medium">This week:</span>
      {Object.entries(counts).map(([type, count]) => (
        <span key={type} className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_BADGE_CLS[type] || TYPE_BADGE_CLS.other}`}>
          {count} {TYPE_LABELS[type]?.toLowerCase() || type}{count > 1 ? 's' : ''}
        </span>
      ))}
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
  return (
    <button onClick={() => onScrollTo(next.id)} className="w-full text-left rounded-lg p-3 mb-4 flex items-center gap-3 border border-(--color-border-tertiary) bg-(--color-background) hover:shadow-sm transition-shadow print:hidden" style={{ borderLeftWidth: '4px', borderLeftColor: next.teams?.team_color || 'var(--sf-accent)' }}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-(--color-text-primary) truncate">Next up: {next.title}</p>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div className="bg-(--color-background) rounded-lg shadow-lg w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-(--color-text-primary) mb-2">Subscribe to Calendar</h2>
        <p className="text-sm text-(--color-text-secondary) mb-4">Download the .ics file and import it into Google Calendar (Add by URL), Apple Calendar (File → Import), or Outlook.</p>
        <div className="flex gap-3">
          {url && <a href={url} download={`${calName}.ics`} className="px-4 py-2 text-sm font-medium rounded" style={{ backgroundColor: 'var(--sf-accent)', color: 'var(--sf-text-on-dark)' }}>Download .ics</a>}
          <button onClick={handleCopy} className="px-4 py-2 text-sm font-medium rounded border border-(--color-border-tertiary) text-(--color-text-primary) hover:bg-(--color-background-secondary)">
            {copied ? 'Copied!' : 'Copy URL'}
          </button>
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded border border-(--color-border-tertiary) text-(--color-text-primary) hover:bg-(--color-background-secondary) ml-auto">Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── Expandable Event Card ───────────────────────────────────
function EventCard({ event, expanded, onToggle, isNew, isUpdated, userRole, isStaff, weather, isPublic }) {
  const team = event.teams;
  const isCancelled = event.status === 'cancelled';
  const isPostponed = event.status === 'postponed';
  const borderColor = isPostponed ? '#f59e0b' : team?.team_color || 'var(--sf-accent)';
  const si = STATUS_ICONS[event.status] || STATUS_ICONS.scheduled;

  // Arrival time
  const arrivalTime = event.arrival_minutes_before ? fmtTime(new Date(new Date(event.start_at).getTime() - event.arrival_minutes_before * 60000).toISOString()) : null;

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
  const dateRange = isMultiDay ? `${fmtDateShort(event.start_at)}–${fmtDateShort(event.end_date + 'T12:00:00')}` : null;

  // Sub-events
  const subEvents = event._children || [];

  const showCoachNotes = event.coach_notes && (userRole === 'admin' || isStaff);

  return (
    <div
      id={`event-${event.id}`}
      className={`bg-(--color-background) rounded-lg shadow-sm border border-(--color-border-tertiary) overflow-hidden cursor-pointer transition-all ${isCancelled ? 'opacity-60' : ''}`}
      style={{ borderLeftWidth: '4px', borderLeftColor: borderColor }}
      onClick={onToggle}
    >
      {/* Collapsed */}
      <div className="p-4">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-(--color-text-primary)">
            {isMultiDay ? dateRange : (<>{fmtTime(event.start_at)}{event.end_at && !event.is_multi_day && ` – ${fmtTime(event.end_at)}`}</>)}
          </span>
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
      </div>

      {/* Expanded */}
      <div className={`overflow-hidden transition-[max-height] duration-300 ease-in-out ${expanded ? 'max-h-[2000px]' : 'max-h-0'}`}>
        <div className="px-4 pb-4 space-y-3 border-t border-(--color-border-tertiary) pt-3" onClick={(e) => e.stopPropagation()}>
          {/* Game day info block */}
          {event.event_type === 'game' && (
            <div className="bg-(--color-background-secondary) rounded-lg p-3 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-(--color-text-secondary)">Game Day</p>
              {event.opponent && <p className="text-sm font-medium text-(--color-text-primary)">vs. {event.opponent}</p>}
              {event.jersey && <p className="text-sm text-(--color-text-primary)">Wear <strong>{event.jersey.toUpperCase()}</strong> jersey</p>}
              {arrivalTime && <p className="text-sm text-(--color-text-primary)">Arrive by {arrivalTime}</p>}
              {event.location && <p className="text-sm text-(--color-text-primary)">{event.location}</p>}
              {event.location_address && (
                <a href={mapsUrl(event.location_address)} target="_blank" rel="noopener noreferrer" className="inline-block text-sm font-medium hover:underline mt-1" style={{ color: 'var(--sf-accent)' }}>Directions &rarr;</a>
              )}
            </div>
          )}

          {/* Non-game details */}
          {event.event_type !== 'game' && (
            <>
              {arrivalTime && <p className="text-sm text-(--color-text-primary)">Arrive by {arrivalTime}</p>}
              {event.location && <p className="text-sm text-(--color-text-primary)">{event.location}</p>}
              {event.location_address && (
                <div>
                  <p className="text-xs text-(--color-text-secondary)">{event.location_address}</p>
                  <a href={mapsUrl(event.location_address)} target="_blank" rel="noopener noreferrer" className="inline-block text-sm font-medium hover:underline mt-1" style={{ color: 'var(--sf-accent)' }}>Directions &rarr;</a>
                </div>
              )}
            </>
          )}

          {/* Notes */}
          {event.notes && <p className="text-sm text-(--color-text-secondary)">{event.notes}</p>}

          {/* Attachments */}
          {event.attachments?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {event.attachments.map((a, i) => (
                <a key={i} href={a.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline" style={{ color: 'var(--sf-accent)' }}>{a.name}</a>
              ))}
            </div>
          )}

          {/* What changed */}
          {recentChanges.length > 0 && (
            <details className="text-sm">
              <summary className="text-(--color-text-secondary) cursor-pointer hover:underline">What changed ({recentChanges.length})</summary>
              <ul className="mt-1 space-y-0.5 pl-4 text-(--color-text-secondary)">
                {recentChanges.map((c) => (
                  <li key={c.id}>{c.field_name} changed{c.old_value ? ` from "${c.old_value}"` : ''}{c.new_value ? ` to "${c.new_value}"` : ''} — {changeAgo(c.changed_at)}</li>
                ))}
              </ul>
            </details>
          )}

          {/* RSVP */}
          <RsvpSection event={event} userRole={userRole} isPublic={isPublic || false} />

          {/* Duties */}
          <DutySignups event={event} userRole={userRole} isPublic={isPublic || false} />

          {/* Rides */}
          {event.enable_rides && <RideBoard event={event} userRole={userRole} isPublic={isPublic || false} />}

          {/* Coach notes (admin/staff only) */}
          {showCoachNotes && (
            <div className="bg-amber-50 rounded p-2 text-sm text-amber-800">
              <p className="text-xs font-semibold uppercase tracking-wide mb-0.5">Coach Notes</p>
              {event.coach_notes}
            </div>
          )}

          {/* Comments */}
          <CommentsThread event={event} userRole={userRole} isPublic={isPublic || false} />

          {/* Sub-events (multi-day tournament children) */}
          {subEvents.length > 0 && (
            <div className="space-y-2 pl-2 border-l-2 border-(--color-border-tertiary)">
              {subEvents.map((sub) => (
                <div key={sub.id} className="text-sm">
                  <span className="font-medium text-(--color-text-primary)">{fmtTime(sub.start_at)}</span>
                  {sub.opponent && <span className="text-(--color-text-secondary)"> — vs. {sub.opponent}</span>}
                  <span className="text-(--color-text-secondary)"> {sub.title}</span>
                </div>
              ))}
            </div>
          )}

          {/* Add to calendar */}
          <a href={gcalUrl(event)} target="_blank" rel="noopener noreferrer" className="inline-block text-xs font-medium hover:underline" style={{ color: 'var(--sf-accent)' }}>Add to Google Calendar</a>
        </div>
      </div>
    </div>
  );
}

// ─── Print table ─────────────────────────────────────────────
function PrintTable({ events }) {
  return (
    <div className="hidden print:block">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b-2 border-black text-left">
            <th className="py-1 pr-3">Date</th><th className="py-1 pr-3">Time</th><th className="py-1 pr-3">Team</th><th className="py-1 pr-3">Type</th><th className="py-1 pr-3">Title</th><th className="py-1 pr-3">Location</th><th className="py-1">Opponent</th>
          </tr>
        </thead>
        <tbody>
          {events.map((ev) => (
            <tr key={ev.id} className="border-b border-gray-300">
              <td className="py-1 pr-3 whitespace-nowrap">{fmtDateShort(ev.start_at)}</td>
              <td className="py-1 pr-3 whitespace-nowrap">{fmtTime(ev.start_at)}</td>
              <td className="py-1 pr-3">{ev.teams?.name || '—'}</td>
              <td className="py-1 pr-3">{TYPE_LABELS[ev.event_type] || ev.event_type}</td>
              <td className="py-1 pr-3 font-medium">{ev.title}</td>
              <td className="py-1 pr-3">{ev.location || '—'}</td>
              <td className="py-1">{ev.opponent || '—'}</td>
            </tr>
          ))}
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
      if (seasonRes.error) { setEvents([]); setTeams([]); setLoading(false); return; }
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
      if (!teamsRes.error) setTeams(teamsRes.data);

      // Check if user is staff on any team
      const { data: staffData } = await supabase.from('team_staff').select('team_id');
      if (staffData) setStaffTeamIds(staffData.map((s) => s.team_id));

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

  const scrollToEvent = useCallback((id) => {
    const el = document.getElementById(`event-${id}`);
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); setExpandedIds((prev) => new Set(prev).add(id)); }
  }, []);

  const scrollToToday = useCallback(() => {
    const today = new Date().toDateString();
    const todayGroup = grouped.find((g) => g.dateStr === today) || grouped[0];
    if (todayGroup) {
      const el = document.getElementById(`date-${todayGroup.dateStr}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [grouped]);

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
        {season && <p className="text-sm">{season.name} — {fmtDateShort(season.start_date)} to {fmtDateShort(season.end_date)}</p>}
      </div>

      <h1 className="text-2xl font-bold mb-4 print:hidden">Schedule</h1>

      <SeasonBar season={season} />
      <WeekSummary events={filtered} />
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
          {showCancelled ? 'Showing cancelled' : 'Show cancelled'}
        </Pill>

        {/* Action buttons */}
        <div className="flex gap-2 ml-auto">
          <button onClick={() => setShowSubscribe(true)} className="text-sm font-medium hover:underline hidden sm:inline" style={{ color: 'var(--sf-accent)' }}>Subscribe</button>
          {userRole === 'admin' && <button onClick={handleShare} className="text-sm font-medium hover:underline hidden sm:inline" style={{ color: 'var(--sf-accent)' }}>{shareCopied ? 'Copied!' : 'Share'}</button>}
          <button onClick={() => window.print()} className="text-sm font-medium hover:underline hidden sm:inline" style={{ color: 'var(--sf-accent)' }}>Print</button>
        </div>
      </div>

      {/* Loading / Error / Empty */}
      {loading && <p className="text-(--color-text-secondary) py-8 text-center" role="status" aria-live="polite">Loading schedule...</p>}
      {error && <p role="alert" className="text-red-600 py-8 text-center">{error}</p>}
      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-(--color-text-secondary) text-lg mb-1">No upcoming events</p>
          <p className="text-(--color-text-secondary) text-sm">{teamFilter !== 'all' || typeFilter !== 'all' ? 'Try adjusting your filters.' : 'Events will appear here once they are scheduled.'}</p>
        </div>
      )}

      {/* Event list */}
      {!loading && !error && grouped.map((group) => (
        <div key={group.dateStr} id={`date-${group.dateStr}`} className="mb-6 print:hidden">
          <h2 className="text-sm font-semibold text-(--color-text-secondary) uppercase tracking-wide mb-3">{fmtDate(group.date)}</h2>
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
                />
              );
            })}
          </div>
        </div>
      ))}

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
export { EventCard, TypeBadge, TeamPill, SeasonBar, fmtDate, fmtTime, fmtDateShort, generateIcs, gcalUrl, mapsUrl, TYPE_LABELS, TYPE_BADGE_CLS, EVENT_TYPES, PILL_ACTIVE, PILL_INACTIVE, STATUS_ICONS, Pill, useWeather };
