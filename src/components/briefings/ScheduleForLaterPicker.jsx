// Wave 3.17 — schedule-for-later picker. Two radio options (Send now /
// Schedule for later); when scheduled, exposes a date+time picker
// + a one-line summary. The picker round-trips through America/New_York:
// the admin's date/time inputs are ET wall-clock (the operator's intent),
// not browser-local — so a traveling/non-ET admin can't accidentally store
// a different wall-clock than the ET label promises.
//
// Validation:
//   scheduled_for must be > now() + 5 min  (no near-immediate)
//   scheduled_for must be < now() + 30 days (sanity bound)
// Persists as ISO string (UTC) in state.scheduledFor; pg_cron picks
// it up via comms_messages.scheduled_for <= now().

import { useMemo } from 'react';

const ET_TZ = 'America/New_York';

const MIN_LEAD_MS = 5 * 60 * 1000;
const MAX_LEAD_MS = 30 * 86400 * 1000;

const wrap = { display: 'flex', flexDirection: 'column', gap: 10, padding: 12, borderRadius: 10, border: '1px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-card)' };
const radioRow = { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--as-text-primary)', cursor: 'pointer' };
const fieldRow = { display: 'flex', gap: 10, flexWrap: 'wrap' };
const inputStyle = { minHeight: 44, padding: '0 12px', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', backgroundColor: 'var(--as-bg-tertiary)', border: '1.5px solid var(--as-border-default)', color: 'var(--as-text-primary)', flex: '1 1 140px' };
const summaryStyle = (err) => ({ fontSize: 12, color: err ? 'var(--as-danger)' : 'var(--as-text-tertiary)', marginTop: 4 });

// Split a UTC instant into ET wall-clock { date: 'YYYY-MM-DD', time: 'HH:mm' }.
function toEtParts(iso) {
  if (!iso) return { date: '', time: '' };
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: ET_TZ, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
  const p = Object.fromEntries(fmt.formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  const hh = p.hour === '24' ? '00' : p.hour;
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${hh}:${p.minute}` };
}

// Interpret { date, time } as ET wall-clock and return the UTC ISO instant.
// DST-safe by candidate round-trip: ET is UTC-4 (EDT) or UTC-5 (EST). A single
// noon-UTC offset probe can be an hour off for wall-clock times on the far side
// of the 2am DST switch, so instead try BOTH offsets and keep the candidate
// whose UTC instant formats back to exactly the requested {date,time}. On the
// fall-back duplicated hour (both match) -4 wins (the earlier instant); in the
// spring-forward gap (neither matches — that wall-clock doesn't exist) default
// to the -4 interpretation.
function fromEtParts(date, time) {
  if (!date || !time) return null;
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mi] = time.split(':').map(Number);
  if ([y, m, d, hh, mi].some(Number.isNaN)) return null;
  for (const offsetHours of [4, 5]) {
    const iso = new Date(Date.UTC(y, m - 1, d, hh + offsetHours, mi, 0)).toISOString();
    const back = toEtParts(iso);
    if (back.date === date && back.time === time) return iso;
  }
  return new Date(Date.UTC(y, m - 1, d, hh + 4, mi, 0)).toISOString();
}

function validate(iso) {
  if (!iso) return 'Pick a date and time.';
  const ms = new Date(iso).getTime() - Date.now();
  if (ms < MIN_LEAD_MS) return 'Schedule must be at least 5 minutes from now.';
  if (ms > MAX_LEAD_MS) return 'Schedule must be within 30 days.';
  return null;
}

export default function ScheduleForLaterPicker({ mode, scheduledFor, onChange }) {
  const parts = useMemo(() => toEtParts(scheduledFor), [scheduledFor]);
  const err = mode === 'schedule_for_later' ? validate(scheduledFor) : null;
  const etTodayDate = toEtParts(new Date().toISOString()).date;

  const setMode = (next) => onChange({ mode: next, scheduledFor: next === 'send_now' ? null : scheduledFor });
  const setDate = (date) => onChange({ mode: 'schedule_for_later', scheduledFor: fromEtParts(date, parts.time || '09:00') });
  const setTime = (time) => onChange({ mode: 'schedule_for_later', scheduledFor: fromEtParts(parts.date || etTodayDate, time) });

  const summary = mode === 'schedule_for_later' && scheduledFor && !err
    ? `Will send ${new Date(scheduledFor).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York', timeZoneName: 'short' })}`
    : null;

  return (
    <div style={wrap}>
      <label style={radioRow}>
        <input type="radio" checked={mode === 'send_now' || !mode} onChange={() => setMode('send_now')} />
        Send now
      </label>
      <label style={radioRow}>
        <input type="radio" checked={mode === 'schedule_for_later'} onChange={() => setMode('schedule_for_later')} />
        Schedule for later
      </label>
      {mode === 'schedule_for_later' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
          <div style={fieldRow}>
            <input type="date" value={parts.date} onChange={(e) => setDate(e.target.value)} style={inputStyle} aria-label="Schedule date (Eastern Time)" />
            <input type="time" value={parts.time} onChange={(e) => setTime(e.target.value)} style={inputStyle} aria-label="Schedule time (Eastern Time)" />
            <span style={{ alignSelf: 'center', fontSize: 12, fontWeight: 500, color: 'var(--as-text-tertiary)' }}>ET</span>
          </div>
          <div style={summaryStyle(err)}>{err || summary || 'Pick a date and time.'}</div>
        </div>
      )}
    </div>
  );
}
