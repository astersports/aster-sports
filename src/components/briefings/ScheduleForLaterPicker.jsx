// Wave 3.17 — schedule-for-later picker. Two radio options (Send now /
// Schedule for later); when scheduled, exposes a date+time picker
// + a one-line summary in the admin's local timezone.
//
// Validation:
//   scheduled_for must be > now() + 5 min  (no near-immediate)
//   scheduled_for must be < now() + 30 days (sanity bound)
// Persists as ISO string (UTC) in state.scheduledFor; pg_cron picks
// it up via comms_messages.scheduled_for <= now().

import { useMemo } from 'react';

const MIN_LEAD_MS = 5 * 60 * 1000;
const MAX_LEAD_MS = 30 * 86400 * 1000;

const wrap = { display: 'flex', flexDirection: 'column', gap: 10, padding: 12, borderRadius: 10, border: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)' };
const radioRow = { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--em-text-primary)', cursor: 'pointer' };
const fieldRow = { display: 'flex', gap: 10, flexWrap: 'wrap' };
const inputStyle = { minHeight: 44, padding: '0 12px', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', backgroundColor: 'var(--em-bg-tertiary)', border: '1.5px solid var(--em-border-default)', color: 'var(--em-text-primary)', flex: '1 1 140px' };
const summaryStyle = (err) => ({ fontSize: 12, color: err ? 'var(--em-danger)' : 'var(--em-text-tertiary)', marginTop: 4 });

function toLocalParts(iso) {
  if (!iso) return { date: '', time: '' };
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return { date: `${yyyy}-${mm}-${dd}`, time: `${hh}:${mi}` };
}

function fromLocalParts(date, time) {
  if (!date || !time) return null;
  const d = new Date(`${date}T${time}`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function validate(iso) {
  if (!iso) return 'Pick a date and time.';
  const ms = new Date(iso).getTime() - Date.now();
  if (ms < MIN_LEAD_MS) return 'Schedule must be at least 5 minutes from now.';
  if (ms > MAX_LEAD_MS) return 'Schedule must be within 30 days.';
  return null;
}

export default function ScheduleForLaterPicker({ mode, scheduledFor, onChange }) {
  const parts = useMemo(() => toLocalParts(scheduledFor), [scheduledFor]);
  const err = mode === 'schedule_for_later' ? validate(scheduledFor) : null;

  const setMode = (next) => onChange({ mode: next, scheduledFor: next === 'send_now' ? null : scheduledFor });
  const setDate = (date) => onChange({ mode: 'schedule_for_later', scheduledFor: fromLocalParts(date, parts.time || '09:00') });
  const setTime = (time) => onChange({ mode: 'schedule_for_later', scheduledFor: fromLocalParts(parts.date || new Date().toISOString().slice(0, 10), time) });

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
            <input type="date" value={parts.date} onChange={(e) => setDate(e.target.value)} style={inputStyle} aria-label="Schedule date" />
            <input type="time" value={parts.time} onChange={(e) => setTime(e.target.value)} style={inputStyle} aria-label="Schedule time" />
          </div>
          <div style={summaryStyle(err)}>{err || summary || 'Pick a date and time.'}</div>
        </div>
      )}
    </div>
  );
}
