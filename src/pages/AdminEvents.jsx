import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const FILTER_TYPES = ['all', 'practice', 'game', 'tournament', 'other'];
const EVENT_TYPES = ['practice', 'game', 'tournament', 'other'];
const TYPE_LABELS = { all: 'All', practice: 'Practice', game: 'Game', tournament: 'Tournament', other: 'Other' };
const STATUS_OPTIONS = ['scheduled', 'cancelled', 'postponed'];
const STATUS_LABELS = { all: 'All', scheduled: 'Scheduled', cancelled: 'Cancelled', postponed: 'Postponed' };
const STATUS_ICONS = { scheduled: { icon: '\u2713', cls: 'text-emerald-600' }, postponed: { icon: '\u23F8', cls: 'text-amber-500' }, cancelled: { icon: '\u2715', cls: 'text-red-500' } };
const FILTER_STATUSES = ['all', 'scheduled', 'cancelled', 'postponed'];

const INPUT_CLS = 'w-full border border-(--color-border-tertiary) rounded px-3 py-2 text-sm bg-(--color-background) text-(--color-text-primary) focus:outline-none focus:ring-2 focus:ring-[var(--sf-accent)]';
const LABEL_CLS = 'block text-sm font-medium text-(--color-text-primary) mb-1';
const BTN_SECONDARY = 'px-4 py-2 text-sm font-medium rounded border border-(--color-border-tertiary) text-(--color-text-primary) hover:bg-(--color-background-secondary)';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}
function toLocalInput(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
function toTimeInput(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(11, 16);
}

// --- Pill button used in filters ---
function Pill({ active, onClick, children, ariaProps }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
      style={active
        ? { backgroundColor: 'var(--sf-accent)', color: 'var(--sf-text-on-dark)' }
        : { backgroundColor: 'var(--color-background-secondary)', color: 'var(--color-text-secondary)' }}
      {...ariaProps}
    >
      {children}
    </button>
  );
}

// --- Sortable table header ---
function SortHeader({ label, field, sortField, sortAsc, onSort, className }) {
  const active = sortField === field;
  return (
    <th
      className={`py-2 pr-4 font-semibold text-(--color-text-secondary) cursor-pointer select-none hover:text-(--color-text-primary) ${className || ''}`}
      onClick={() => onSort(field)}
      aria-sort={active ? (sortAsc ? 'ascending' : 'descending') : 'none'}
    >
      {label}{active ? (sortAsc ? ' \u25B2' : ' \u25BC') : ''}
    </th>
  );
}

// --- Team color dot ---
function TeamDot({ color }) {
  if (!color) return null;
  return <span className="inline-block w-2.5 h-2.5 rounded-full mr-1.5 shrink-0" style={{ backgroundColor: color }} />;
}

// =================================================================
// EVENT MODAL (Add / Edit / Duplicate)
// =================================================================
function EventModal({ event, teams, allEvents, locations, opponents, onSave, onClose }) {
  const { session, organization } = useAuth();
  const isEdit = Boolean(event?.id);
  const [newOpponent, setNewOpponent] = useState('');
  const [addingNewOpponent, setAddingNewOpponent] = useState(false);

  const defaultForm = {
    team_id: teams[0]?.id || '',
    event_type: 'practice',
    status: 'scheduled',
    title: '',
    start_at: '',
    end_at: '',
    is_multi_day: false,
    end_date: '',
    location: '',
    location_address: '',
    indoor: false,
    arrival_minutes_before: '',
    jersey: '',
    opponent: '',
    enable_rides: false,
    rsvp_deadline: '',
    duties: [],
    attachments: [],
    notes: '',
    coach_notes: '',
  };

  const [form, setForm] = useState(() => {
    if (event) {
      return {
        team_id: event.team_id,
        event_type: event.event_type,
        status: event.status || 'scheduled',
        title: event.title,
        start_at: event.id ? toLocalInput(event.start_at) : '', // blank for duplicates
        end_at: event.id ? toLocalInput(event.end_at) : '',
        is_multi_day: event.is_multi_day || false,
        end_date: event.end_date || '',
        location: event.location || '',
        location_address: event.location_address || '',
        indoor: event.indoor || false,
        arrival_minutes_before: event.arrival_minutes_before ?? '',
        jersey: event.jersey || '',
        opponent: event.opponent || '',
        enable_rides: event.enable_rides || false,
        rsvp_deadline: event.id ? toLocalInput(event.rsvp_deadline) : '',
        duties: event._duties || [],
        attachments: event.attachments || [],
        notes: event.notes || '',
        coach_notes: event.coach_notes || '',
      };
    }
    return { ...defaultForm };
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [conflict, setConflict] = useState(null);

  function update(field, value) {
    setForm((f) => {
      const next = { ...f, [field]: value };
      // Auto-suggest title
      if ((field === 'team_id' || field === 'event_type') && !isEdit) {
        const team = teams.find((t) => t.id === (field === 'team_id' ? value : f.team_id));
        const type = TYPE_LABELS[field === 'event_type' ? value : f.event_type];
        if (team && type) next.title = `${team.name} ${type}`;
      }
      // Default enable_rides on for tournaments
      if (field === 'event_type' && value === 'tournament') next.enable_rides = true;
      // Multi-day: set default end_date and enforce end >= start
      if (field === 'is_multi_day' && value && next.start_at) {
        const startDate = next.start_at.slice(0, 10);
        const nextDay = new Date(startDate + 'T12:00:00');
        nextDay.setDate(nextDay.getDate() + 1);
        next.end_date = nextDay.toISOString().slice(0, 10);
      }
      if (field === 'start_at' && next.is_multi_day && value) {
        const startDate = value.slice(0, 10);
        const nextDay = new Date(startDate + 'T12:00:00');
        nextDay.setDate(nextDay.getDate() + 1);
        if (!next.end_date || next.end_date < startDate) {
          next.end_date = nextDay.toISOString().slice(0, 10);
        }
      }
      return next;
    });
  }

  // Date validation helper
  function isValidDatetime(val) {
    if (!val) return true; // empty is ok for optional fields
    const d = new Date(val);
    return !isNaN(d.getTime()) && d.getFullYear() >= 2024 && d.getFullYear() <= 2030;
  }
  function isValidDate(val) {
    if (!val) return true;
    const d = new Date(val + 'T12:00:00');
    return !isNaN(d.getTime()) && d.getFullYear() >= 2024 && d.getFullYear() <= 2030;
  }

  const dateErrors = {
    start_at: !isValidDatetime(form.start_at),
    end_at: !isValidDatetime(form.end_at),
    end_date: !isValidDate(form.end_date),
    rsvp_deadline: !isValidDatetime(form.rsvp_deadline),
  };
  const hasDateError = Object.values(dateErrors).some(Boolean);

  // Duration helper
  const duration = (() => {
    if (!form.start_at || (!form.is_multi_day && !form.end_at)) return null;
    if (form.is_multi_day) return null;
    const start = new Date(form.start_at).getTime();
    const end = new Date(form.end_at).getTime();
    if (isNaN(start) || isNaN(end) || end <= start) return null;
    const mins = Math.round((end - start) / 60000);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`;
  })();

  // Duties list management
  function addDuty() { setForm((f) => ({ ...f, duties: [...f.duties, { duty_name: '', slots_needed: 1 }] })); }
  function removeDuty(i) { setForm((f) => ({ ...f, duties: f.duties.filter((_, j) => j !== i) })); }
  function updateDuty(i, field, value) {
    setForm((f) => ({ ...f, duties: f.duties.map((d, j) => j === i ? { ...d, [field]: value } : d) }));
  }

  // Attachments list management
  function addAttachment() { setForm((f) => ({ ...f, attachments: [...f.attachments, { name: '', url: '' }] })); }
  function removeAttachment(i) { setForm((f) => ({ ...f, attachments: f.attachments.filter((_, j) => j !== i) })); }
  function updateAttachment(i, field, value) {
    setForm((f) => ({ ...f, attachments: f.attachments.map((a, j) => j === i ? { ...a, [field]: value } : a) }));
  }

  function checkConflicts(payload) {
    const start = new Date(payload.start_at).getTime();
    const end = payload.end_at ? new Date(payload.end_at).getTime() : start + 3600000;
    return allEvents.filter((e) => {
      if (isEdit && e.id === event.id) return false;
      const eStart = new Date(e.start_at).getTime();
      const eEnd = e.end_at ? new Date(e.end_at).getTime() : eStart + 3600000;
      if (eEnd <= start || eStart >= end) return false;
      return e.team_id === payload.team_id || (payload.location && e.location === payload.location);
    });
  }

  async function handleSubmit(e, force = false) {
    e?.preventDefault();
    if (hasDateError) { setError('Please fix invalid date values before saving.'); return; }
    setSaving(true);
    setError(null);

    const payload = {
      team_id: form.team_id,
      event_type: form.event_type,
      status: form.status,
      title: form.title.trim(),
      start_at: new Date(form.start_at).toISOString(),
      end_at: !form.is_multi_day && form.end_at ? new Date(form.end_at).toISOString() : null,
      is_multi_day: form.is_multi_day,
      end_date: form.is_multi_day && form.end_date ? form.end_date : null,
      location: form.location.trim() || null,
      location_address: form.location_address.trim() || null,
      indoor: form.indoor,
      arrival_minutes_before: form.arrival_minutes_before !== '' ? Number(form.arrival_minutes_before) : null,
      jersey: form.event_type === 'game' ? (form.jersey || null) : null,
      opponent: form.event_type === 'game' ? (form.opponent.trim() || null) : null,
      enable_rides: form.enable_rides,
      rsvp_deadline: form.rsvp_deadline ? new Date(form.rsvp_deadline).toISOString() : null,
      attachments: form.attachments.filter((a) => a.name && a.url),
      notes: form.notes.trim() || null,
      coach_notes: form.coach_notes.trim() || null,
    };

    // Conflict detection
    if (!force) {
      const conflicts = checkConflicts(payload);
      if (conflicts.length > 0) {
        setConflict(conflicts);
        setSaving(false);
        return;
      }
    }

    let result;
    if (isEdit) {
      // Build change log
      const changes = [];
      const timestampFields = new Set(['start_at', 'end_at', 'rsvp_deadline']);
      const trackFields = ['team_id', 'event_type', 'status', 'title', 'start_at', 'end_at', 'location', 'location_address', 'opponent', 'jersey', 'indoor', 'enable_rides', 'notes', 'coach_notes', 'arrival_minutes_before', 'is_multi_day', 'end_date'];
      for (const f of trackFields) {
        let oldVal = String(event[f] ?? '');
        let newVal = String(payload[f] ?? '');
        // Normalize timestamps to epoch ms to avoid format-only diffs
        if (timestampFields.has(f) && oldVal && newVal) {
          const oldMs = new Date(oldVal).getTime();
          const newMs = new Date(newVal).getTime();
          if (!isNaN(oldMs) && !isNaN(newMs) && oldMs === newMs) continue;
        }
        if (oldVal !== newVal) {
          changes.push({ event_id: event.id, changed_by: session?.user?.id, field_name: f, old_value: oldVal || null, new_value: newVal || null });
        }
      }
      result = await supabase.from('events').update(payload).eq('id', event.id);
      if (!result.error && changes.length > 0) {
        await supabase.from('event_changes').insert(changes);
      }
      // Queue notifications for visible changes
      if (!result.error && organization?.id) {
        const visibleFields = ['status', 'title', 'start_at', 'end_at', 'location', 'location_address', 'opponent'];
        const visibleChanges = changes.filter((c) => visibleFields.includes(c.field_name));
        if (payload.status === 'cancelled' && event.status !== 'cancelled') {
          await supabase.from('notifications_queue').insert({
            org_id: organization.id, event_id: event.id, notification_type: 'cancellation',
            recipient_type: 'team', payload: { title: payload.title, team_id: payload.team_id, start_at: payload.start_at },
          });
        } else if (visibleChanges.length > 0) {
          await supabase.from('notifications_queue').insert({
            org_id: organization.id, event_id: event.id, notification_type: 'schedule_change',
            recipient_type: 'team', payload: { title: payload.title, team_id: payload.team_id, changes: visibleChanges.map((c) => ({ field: c.field_name, from: c.old_value, to: c.new_value })) },
          });
        }
      }
    } else {
      result = await supabase.from('events').insert(payload).select().single();
    }

    if (result.error) {
      setError(result.error.message);
      setSaving(false);
      return;
    }

    // Save duties for new events
    const eventId = isEdit ? event.id : result.data?.id;
    if (eventId && form.duties.length > 0) {
      if (isEdit) {
        await supabase.from('event_duties').delete().eq('event_id', eventId);
      }
      const dutyRows = form.duties.filter((d) => d.duty_name.trim()).map((d) => ({
        event_id: eventId, duty_name: d.duty_name.trim(), slots_needed: Number(d.slots_needed) || 1,
      }));
      if (dutyRows.length > 0) await supabase.from('event_duties').insert(dutyRows);
    }

    onSave();
  }

  // Conflict warning overlay
  if (conflict) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="rounded-lg shadow-lg w-full max-w-md p-6" style={{ backgroundColor: 'var(--color-background-primary, #ffffff)' }}>
          <h2 className="text-lg font-bold text-(--color-text-primary) mb-2">Schedule Conflict</h2>
          <p className="text-sm text-(--color-text-secondary) mb-3">This event overlaps with:</p>
          <ul className="text-sm text-(--color-text-primary) mb-4 space-y-1">
            {conflict.map((c) => (
              <li key={c.id}><strong>{c.title}</strong> — {formatDate(c.start_at)} {formatTime(c.start_at)}{c.teams?.name ? ` (${c.teams.name})` : ''}</li>
            ))}
          </ul>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => { setConflict(null); }} className={BTN_SECONDARY}>Go Back</button>
            <button type="button" onClick={() => { setConflict(null); handleSubmit(null, true); }} className="px-4 py-2 text-sm font-medium rounded bg-amber-500 text-white hover:bg-amber-600">Save Anyway</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center px-0 sm:px-4 overflow-y-auto" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div
        className="sm:rounded-lg shadow-lg w-full sm:max-w-lg sm:max-h-[90vh] min-h-screen sm:min-h-0 overflow-y-auto p-6 sm:my-8"
        style={{ backgroundColor: 'var(--color-background-primary, #ffffff)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-(--color-text-primary) mb-4">
          {isEdit ? 'Edit Event' : 'Add Event'}
        </h2>

        {error && <div role="alert" className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Team */}
          <div>
            <label htmlFor="ev-team" className={LABEL_CLS}>Team</label>
            <select id="ev-team" required value={form.team_id} onChange={(e) => update('team_id', e.target.value)} className={INPUT_CLS}>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          {/* Type + Status row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="ev-type" className={LABEL_CLS}>Event Type</label>
              <select id="ev-type" value={form.event_type} onChange={(e) => update('event_type', e.target.value)} className={INPUT_CLS}>
                {EVENT_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="ev-status" className={LABEL_CLS}>Status</label>
              <select id="ev-status" value={form.status} onChange={(e) => update('status', e.target.value)} className={INPUT_CLS}>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="ev-title" className={LABEL_CLS}>Title</label>
            <input id="ev-title" type="text" required value={form.title} onChange={(e) => update('title', e.target.value)} className={INPUT_CLS} />
          </div>

          {/* Start / End */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="ev-start" className={LABEL_CLS}>Start</label>
              <input id="ev-start" type="datetime-local" required value={form.start_at} onChange={(e) => update('start_at', e.target.value)} className={`${INPUT_CLS} ${dateErrors.start_at ? 'border-red-500 focus:ring-red-500' : ''}`} />
              {dateErrors.start_at && <p className="text-xs text-red-500 mt-1">Invalid date</p>}
            </div>
            {form.is_multi_day ? (
              <div>
                <label htmlFor="ev-end-date" className={LABEL_CLS}>End Date</label>
                <input id="ev-end-date" type="date" value={form.end_date} onChange={(e) => update('end_date', e.target.value)} min={form.start_at ? form.start_at.slice(0, 10) : ''} className={`${INPUT_CLS} ${dateErrors.end_date ? 'border-red-500 focus:ring-red-500' : ''}`} />
                {dateErrors.end_date && <p className="text-xs text-red-500 mt-1">Invalid date</p>}
              </div>
            ) : (
              <div>
                <label htmlFor="ev-end" className={LABEL_CLS}>End (optional)</label>
                <input id="ev-end" type="datetime-local" value={form.end_at} onChange={(e) => update('end_at', e.target.value)} className={`${INPUT_CLS} ${dateErrors.end_at ? 'border-red-500 focus:ring-red-500' : ''}`} />
                {dateErrors.end_at && <p className="text-xs text-red-500 mt-1">Invalid date</p>}
                {duration && <p className="text-xs text-(--color-text-secondary) mt-1">{duration}</p>}
              </div>
            )}
          </div>

          {/* Multi-day toggle */}
          <label className="flex items-center gap-2 text-sm text-(--color-text-primary)">
            <input type="checkbox" checked={form.is_multi_day} onChange={(e) => update('is_multi_day', e.target.checked)} className="rounded" />
            Multi-day event (e.g. tournament)
          </label>

          {/* Location */}
          <div>
            <label htmlFor="ev-location" className={LABEL_CLS}>Location</label>
            <select
              id="ev-location"
              value={locations.find((l) => l.name === form.location)?.id || '__custom'}
              onChange={(e) => {
                if (e.target.value === '__custom') {
                  setForm((f) => ({ ...f, location: '', location_address: '', _sub_location: '' }));
                } else {
                  const loc = locations.find((l) => l.id === e.target.value);
                  if (loc) setForm((f) => ({ ...f, location: loc.name, location_address: loc.address || '', _sub_location: '' }));
                }
              }}
              className={INPUT_CLS}
            >
              {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              <option value="__custom">Custom location...</option>
            </select>
          </div>
          {(() => {
            const selLoc = locations.find((l) => l.name === form.location);
            if (selLoc?.sub_locations?.length > 0) return (
              <div>
                <label className={LABEL_CLS}>Sub-location</label>
                <select value={form._sub_location || ''} onChange={(e) => {
                  const sub = e.target.value;
                  setForm((f) => ({
                    ...f,
                    _sub_location: sub,
                    location: sub ? `${selLoc.name} — ${sub}` : selLoc.name,
                  }));
                }} className={INPUT_CLS}>
                  <option value="">None</option>
                  {selLoc.sub_locations.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            );
            return null;
          })()}
          {!locations.find((l) => l.name === form.location) && (
            <>
              <div>
                <label className={LABEL_CLS}>Location name</label>
                <input type="text" value={form.location} onChange={(e) => update('location', e.target.value)} className={INPUT_CLS} placeholder="Venue name" />
              </div>
              <div>
                <label htmlFor="ev-address" className={LABEL_CLS}>Address</label>
                <input id="ev-address" type="text" value={form.location_address} onChange={(e) => update('location_address', e.target.value)} className={INPUT_CLS} placeholder="Full address for map links and directions" />
              </div>
            </>
          )}
          {locations.find((l) => l.name === form.location) && form.location_address && (
            <p className="text-xs text-(--color-text-secondary) -mt-2">{form.location_address}</p>
          )}

          {/* Indoor + Arrival */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center gap-2 text-sm text-(--color-text-primary)">
              <input type="checkbox" checked={form.indoor} onChange={(e) => update('indoor', e.target.checked)} className="rounded" />
              Indoor venue
            </label>
            <div>
              <label htmlFor="ev-arrival" className={LABEL_CLS}>Arrive early</label>
              {(() => {
                const presets = [15, 20, 25, 30, 45, 60];
                const val = form.arrival_minutes_before;
                const isCustom = val !== '' && !presets.includes(Number(val));
                return (
                  <div className="flex gap-2">
                    <select
                      id="ev-arrival"
                      value={isCustom ? 'custom' : String(val)}
                      onChange={(e) => {
                        if (e.target.value === 'custom') update('arrival_minutes_before', '');
                        else if (e.target.value === '') update('arrival_minutes_before', '');
                        else update('arrival_minutes_before', Number(e.target.value));
                      }}
                      className={INPUT_CLS}
                    >
                      <option value="">None</option>
                      {presets.map((m) => <option key={m} value={m}>{m} min</option>)}
                      <option value="custom">Custom...</option>
                    </select>
                    {isCustom && <input type="number" min="1" max="120" value={val} onChange={(e) => update('arrival_minutes_before', e.target.value)} className={`${INPUT_CLS} w-20`} placeholder="min" />}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Game-specific: Jersey + Opponent */}
          {form.event_type === 'game' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="ev-jersey" className={LABEL_CLS}>Jersey</label>
                <select id="ev-jersey" value={form.jersey} onChange={(e) => update('jersey', e.target.value)} className={INPUT_CLS}>
                  <option value="">—</option>
                  <option value="home">Home</option>
                  <option value="away">Away</option>
                </select>
              </div>
              <div>
                <label htmlFor="ev-opponent" className={LABEL_CLS}>Opponent</label>
                <select id="ev-opponent" value={addingNewOpponent ? '__new' : (opponents.find((o) => o.name === form.opponent) ? form.opponent : form.opponent ? '__custom' : '')} onChange={(e) => {
                  if (e.target.value === '__new') {
                    setAddingNewOpponent(true);
                    setNewOpponent('');
                  } else if (e.target.value === '__custom') {
                    setAddingNewOpponent(false);
                  } else {
                    setAddingNewOpponent(false);
                    update('opponent', e.target.value);
                  }
                }} className={INPUT_CLS}>
                  <option value="">—</option>
                  {opponents.map((o) => <option key={o.id} value={o.name}>{o.name}</option>)}
                  {form.opponent && !opponents.find((o) => o.name === form.opponent) && (
                    <option value="__custom">{form.opponent}</option>
                  )}
                  <option value="__new">+ Add new...</option>
                </select>
              </div>
            </div>
          )}
          {form.event_type === 'game' && addingNewOpponent && (
            <div className="flex gap-2">
              <input type="text" value={newOpponent} onChange={(e) => setNewOpponent(e.target.value)} placeholder="New opponent name" className={`${INPUT_CLS} flex-1`} autoFocus />
              <button type="button" onClick={async () => {
                if (!newOpponent.trim() || !organization?.id) return;
                await supabase.from('opponents').insert({ org_id: organization.id, name: newOpponent.trim() });
                update('opponent', newOpponent.trim());
                setNewOpponent('');
                setAddingNewOpponent(false);
              }} className="px-3 py-2 text-sm font-medium rounded" style={{ backgroundColor: 'var(--sf-accent)', color: 'var(--sf-text-on-dark)' }}>Add</button>
            </div>
          )}

          {/* Enable rides */}
          <label className="flex items-center gap-2 text-sm text-(--color-text-primary)">
            <input type="checkbox" checked={form.enable_rides} onChange={(e) => update('enable_rides', e.target.checked)} className="rounded" />
            Enable ride board
          </label>

          {/* RSVP deadline */}
          <div>
            <label htmlFor="ev-rsvp-deadline" className={LABEL_CLS}>RSVP deadline (optional)</label>
            <div className="flex gap-2">
              <input id="ev-rsvp-deadline" type="datetime-local" value={form.rsvp_deadline} onChange={(e) => update('rsvp_deadline', e.target.value)} className={`${INPUT_CLS} ${dateErrors.rsvp_deadline ? 'border-red-500 focus:ring-red-500' : ''}`} />
              {form.start_at && isValidDatetime(form.start_at) && (
                <select
                  value=""
                  onChange={(e) => {
                    const days = Number(e.target.value);
                    if (!days) return;
                    const deadline = new Date(new Date(form.start_at).getTime() - days * 86400000);
                    update('rsvp_deadline', toLocalInput(deadline.toISOString()));
                  }}
                  className={`${INPUT_CLS} w-auto`}
                >
                  <option value="">Quick set...</option>
                  <option value="1">1 day before</option>
                  <option value="2">2 days before</option>
                  <option value="3">3 days before</option>
                </select>
              )}
            </div>
            {dateErrors.rsvp_deadline && <p className="text-xs text-red-500 mt-1">Invalid date</p>}
          </div>

          {/* Attachments */}
          <fieldset>
            <legend className={LABEL_CLS}>Attachments</legend>
            {form.attachments.map((a, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input type="text" value={a.name} onChange={(e) => updateAttachment(i, 'name', e.target.value)} placeholder="Name" className={`${INPUT_CLS} flex-1`} />
                <input type="url" value={a.url} onChange={(e) => updateAttachment(i, 'url', e.target.value)} placeholder="URL" className={`${INPUT_CLS} flex-1`} />
                <button type="button" onClick={() => removeAttachment(i)} className="text-red-500 text-sm font-medium px-2">Remove</button>
              </div>
            ))}
            <button type="button" onClick={addAttachment} className="text-sm font-medium hover:underline" style={{ color: 'var(--sf-accent)' }}>+ Add attachment</button>
          </fieldset>

          {/* Notes */}
          <div>
            <label htmlFor="ev-notes" className={LABEL_CLS}>Notes</label>
            <textarea id="ev-notes" rows={2} value={form.notes} onChange={(e) => update('notes', e.target.value)} className={INPUT_CLS} />
          </div>

          {/* Duty slots — after Notes for prominence */}
          <fieldset>
            <legend className={LABEL_CLS}>Volunteer Duties</legend>
            <p className="text-xs text-(--color-text-secondary) mb-2">Add volunteer duties like snack duty or scorekeeping. Parents can claim slots from the schedule.</p>
            {form.duties.map((d, i) => (
              <div key={i} className="flex items-end gap-2 mb-2">
                <div className="flex-1">
                  {i === 0 && <label className="block text-xs text-(--color-text-secondary) mb-1">Duty name</label>}
                  <input type="text" value={d.duty_name} onChange={(e) => updateDuty(i, 'duty_name', e.target.value)} placeholder="e.g. Snacks, Scorebook" className={INPUT_CLS} />
                </div>
                <div className="w-20">
                  {i === 0 && <label className="block text-xs text-(--color-text-secondary) mb-1">Slots</label>}
                  <input type="number" min="1" value={d.slots_needed} onChange={(e) => updateDuty(i, 'slots_needed', e.target.value)} className={INPUT_CLS} />
                </div>
                <button type="button" onClick={() => removeDuty(i)} className="text-red-500 text-sm font-medium px-2 py-2">Remove</button>
              </div>
            ))}
            <button type="button" onClick={addDuty} className="text-sm font-medium hover:underline" style={{ color: 'var(--sf-accent)' }}>+ Add duty</button>
          </fieldset>

          <div>
            <label htmlFor="ev-coach-notes" className={LABEL_CLS}>Coach notes <span className="font-normal text-(--color-text-secondary)">(not visible to parents)</span></label>
            <textarea id="ev-coach-notes" rows={2} value={form.coach_notes} onChange={(e) => update('coach_notes', e.target.value)} className={INPUT_CLS} />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className={BTN_SECONDARY}>Cancel</button>
            <button type="submit" disabled={saving || hasDateError} aria-busy={saving} className="px-4 py-2 text-sm font-medium rounded disabled:opacity-50" style={{ backgroundColor: 'var(--sf-accent)', color: 'var(--sf-text-on-dark)' }}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =================================================================
// RECURRING EVENT CREATOR
// =================================================================
function RecurringModal({ teams, allEvents, onSave, onClose }) {
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const [form, setForm] = useState({
    team_id: teams[0]?.id || '',
    event_type: 'practice',
    title: '',
    location: '',
    location_address: '',
    indoor: false,
    arrival_minutes_before: '',
    day_of_week: 1,
    start_time: '18:00',
    end_time: '',
    first_date: '',
    num_weeks: 8,
    duties: [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [conflicts, setConflicts] = useState([]);

  function update(field, value) {
    setForm((f) => {
      const next = { ...f, [field]: value };
      if ((field === 'team_id' || field === 'event_type') && next.team_id && next.event_type) {
        const team = teams.find((t) => t.id === (field === 'team_id' ? value : f.team_id));
        const type = TYPE_LABELS[field === 'event_type' ? value : f.event_type];
        if (team && type) next.title = `${team.name} ${type}`;
      }
      return next;
    });
  }

  const generatedDates = useMemo(() => {
    if (!form.first_date || !form.num_weeks) return [];
    const dates = [];
    const first = new Date(form.first_date + 'T12:00:00');
    // Adjust to the right day of week
    const targetDay = Number(form.day_of_week);
    let d = new Date(first);
    while (d.getDay() !== targetDay) d.setDate(d.getDate() + 1);
    for (let i = 0; i < form.num_weeks; i++) {
      dates.push(new Date(d));
      d = new Date(d);
      d.setDate(d.getDate() + 7);
    }
    return dates;
  }, [form.first_date, form.day_of_week, form.num_weeks]);

  function buildPayloads() {
    return generatedDates.map((date) => {
      const dateStr = date.toISOString().slice(0, 10);
      const startIso = new Date(`${dateStr}T${form.start_time}`).toISOString();
      const endIso = form.end_time ? new Date(`${dateStr}T${form.end_time}`).toISOString() : null;
      return {
        team_id: form.team_id,
        event_type: form.event_type,
        status: 'scheduled',
        title: form.title.trim(),
        start_at: startIso,
        end_at: endIso,
        location: form.location.trim() || null,
        location_address: form.location_address.trim() || null,
        indoor: form.indoor,
        arrival_minutes_before: form.arrival_minutes_before !== '' ? Number(form.arrival_minutes_before) : null,
        enable_rides: false,
        is_multi_day: false,
        attachments: [],
      };
    });
  }

  // Check conflicts for preview
  useEffect(() => {
    if (generatedDates.length === 0) { setConflicts([]); return; }
    const payloads = buildPayloads();
    const found = [];
    for (const p of payloads) {
      const start = new Date(p.start_at).getTime();
      const end = p.end_at ? new Date(p.end_at).getTime() : start + 3600000;
      for (const e of allEvents) {
        const eStart = new Date(e.start_at).getTime();
        const eEnd = e.end_at ? new Date(e.end_at).getTime() : eStart + 3600000;
        if (eEnd <= start || eStart >= end) continue;
        if (e.team_id === p.team_id || (p.location && e.location === p.location)) {
          found.push({ date: p.start_at, existing: e });
        }
      }
    }
    setConflicts(found);
  }, [generatedDates, form.team_id, form.location, form.start_time, form.end_time]);

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payloads = buildPayloads();
    if (payloads.length === 0) { setError('No dates generated.'); setSaving(false); return; }

    const { data, error: insertErr } = await supabase.from('events').insert(payloads).select('id');
    if (insertErr) { setError(insertErr.message); setSaving(false); return; }

    // Insert duties for each event
    if (data && form.duties.length > 0) {
      const dutyRows = data.flatMap((ev) =>
        form.duties.filter((d) => d.duty_name.trim()).map((d) => ({
          event_id: ev.id, duty_name: d.duty_name.trim(), slots_needed: Number(d.slots_needed) || 1,
        }))
      );
      if (dutyRows.length > 0) await supabase.from('event_duties').insert(dutyRows);
    }

    onSave();
  }

  function addDuty() { setForm((f) => ({ ...f, duties: [...f.duties, { duty_name: '', slots_needed: 1 }] })); }
  function removeDuty(i) { setForm((f) => ({ ...f, duties: f.duties.filter((_, j) => j !== i) })); }
  function updateDuty(i, field, value) {
    setForm((f) => ({ ...f, duties: f.duties.map((d, j) => j === i ? { ...d, [field]: value } : d) }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center px-0 sm:px-4 overflow-y-auto" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="sm:rounded-lg shadow-lg w-full sm:max-w-lg sm:max-h-[90vh] min-h-screen sm:min-h-0 overflow-y-auto p-6 sm:my-8" style={{ backgroundColor: 'var(--color-background-primary, #ffffff)' }} onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-(--color-text-primary) mb-4">Create Recurring Event</h2>
        {error && <div role="alert" className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded mb-4">{error}</div>}

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label htmlFor="rc-team" className={LABEL_CLS}>Team</label>
            <select id="rc-team" required value={form.team_id} onChange={(e) => update('team_id', e.target.value)} className={INPUT_CLS}>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="rc-type" className={LABEL_CLS}>Event Type</label>
            <select id="rc-type" value={form.event_type} onChange={(e) => update('event_type', e.target.value)} className={INPUT_CLS}>
              {EVENT_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="rc-title" className={LABEL_CLS}>Title</label>
            <input id="rc-title" type="text" required value={form.title} onChange={(e) => update('title', e.target.value)} className={INPUT_CLS} />
          </div>
          <div>
            <label htmlFor="rc-location" className={LABEL_CLS}>Location</label>
            <input id="rc-location" type="text" value={form.location} onChange={(e) => update('location', e.target.value)} className={INPUT_CLS} />
          </div>
          <div>
            <label htmlFor="rc-address" className={LABEL_CLS}>Address</label>
            <input id="rc-address" type="text" value={form.location_address} onChange={(e) => update('location_address', e.target.value)} className={INPUT_CLS} placeholder="Full address for map links" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center gap-2 text-sm text-(--color-text-primary)">
              <input type="checkbox" checked={form.indoor} onChange={(e) => update('indoor', e.target.checked)} className="rounded" />
              Indoor
            </label>
            <div>
              <label htmlFor="rc-arrival" className={LABEL_CLS}>Arrive early (min)</label>
              <input id="rc-arrival" type="number" min="0" value={form.arrival_minutes_before} onChange={(e) => update('arrival_minutes_before', e.target.value)} className={INPUT_CLS} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="rc-day" className={LABEL_CLS}>Day of Week</label>
              <select id="rc-day" required value={form.day_of_week} onChange={(e) => update('day_of_week', e.target.value)} className={INPUT_CLS}>
                {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="rc-first" className={LABEL_CLS}>First Occurrence</label>
              <input id="rc-first" type="date" required value={form.first_date} onChange={(e) => update('first_date', e.target.value)} className={INPUT_CLS} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="rc-start-time" className={LABEL_CLS}>Start Time</label>
              <input id="rc-start-time" type="time" required value={form.start_time} onChange={(e) => update('start_time', e.target.value)} className={INPUT_CLS} />
            </div>
            <div>
              <label htmlFor="rc-end-time" className={LABEL_CLS}>End Time</label>
              <input id="rc-end-time" type="time" value={form.end_time} onChange={(e) => update('end_time', e.target.value)} className={INPUT_CLS} />
            </div>
            <div>
              <label htmlFor="rc-weeks" className={LABEL_CLS}>Weeks</label>
              <input id="rc-weeks" type="number" min="1" max="52" required value={form.num_weeks} onChange={(e) => update('num_weeks', e.target.value)} className={INPUT_CLS} />
            </div>
          </div>

          {/* Duties */}
          <fieldset>
            <legend className={LABEL_CLS}>Duty Slots (applied to all events)</legend>
            {form.duties.map((d, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input type="text" value={d.duty_name} onChange={(e) => updateDuty(i, 'duty_name', e.target.value)} placeholder="e.g. Snack duty" className={`${INPUT_CLS} flex-1`} />
                <input type="number" min="1" value={d.slots_needed} onChange={(e) => updateDuty(i, 'slots_needed', e.target.value)} className={`${INPUT_CLS} w-16`} />
                <button type="button" onClick={() => removeDuty(i)} className="text-red-500 text-sm font-medium px-2">Remove</button>
              </div>
            ))}
            <button type="button" onClick={addDuty} className="text-sm font-medium hover:underline" style={{ color: 'var(--sf-accent)' }}>+ Add duty</button>
          </fieldset>

          {/* Preview */}
          {generatedDates.length > 0 && (
            <div className="bg-(--color-background-secondary) rounded p-3">
              <p className="text-sm font-medium text-(--color-text-primary) mb-1">This will create {generatedDates.length} events:</p>
              <p className="text-sm text-(--color-text-secondary)">{generatedDates.map((d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })).join(', ')}</p>
              {conflicts.length > 0 && (
                <p className="text-sm text-amber-600 mt-2">
                  {conflicts.length} conflict{conflicts.length > 1 ? 's' : ''} detected — events will still be created.
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className={BTN_SECONDARY}>Cancel</button>
            <button type="submit" disabled={saving || generatedDates.length === 0} aria-busy={saving} className="px-4 py-2 text-sm font-medium rounded disabled:opacity-50" style={{ backgroundColor: 'var(--sf-accent)', color: 'var(--sf-text-on-dark)' }}>
              {saving ? 'Creating...' : `Create ${generatedDates.length} Events`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =================================================================
// DELETE DIALOG (single or bulk)
// =================================================================
function DeleteDialog({ events, onConfirm, onClose }) {
  const [deleting, setDeleting] = useState(false);
  const isBulk = events.length > 1;

  async function handleDelete() {
    setDeleting(true);
    await onConfirm(events.map((e) => e.id));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="rounded-lg shadow-lg w-full max-w-sm p-6" style={{ backgroundColor: 'var(--color-background-primary, #ffffff)' }} onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-(--color-text-primary) mb-2">Delete {isBulk ? `${events.length} Events` : 'Event'}</h2>
        {isBulk ? (
          <div className="text-sm text-(--color-text-secondary) mb-4">
            <p className="mb-2">This cannot be undone:</p>
            <ul className="list-disc pl-4 space-y-0.5">
              {events.map((ev) => <li key={ev.id}>{ev.title} — {formatDate(ev.start_at)}</li>)}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-(--color-text-secondary) mb-6">
            Delete <strong>{events[0].title}</strong> on {formatDate(events[0].start_at)}? This cannot be undone.
          </p>
        )}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className={BTN_SECONDARY}>Cancel</button>
          <button type="button" onClick={handleDelete} disabled={deleting} aria-busy={deleting} className="px-4 py-2 text-sm font-medium rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// =================================================================
// BULK ACTION BAR
// =================================================================
function BulkBar({ count, onDelete, onChangeStatus, onChangeLocation, onReschedule }) {
  const [locInput, setLocInput] = useState('');
  const [showLoc, setShowLoc] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');

  return (
    <div className="bg-(--color-background-secondary) border border-(--color-border-tertiary) rounded-lg p-3 mb-4 flex flex-wrap items-center gap-3">
      <span className="text-sm font-medium text-(--color-text-primary)">{count} selected</span>
      <button onClick={() => onChangeStatus('cancelled')} className="text-sm font-medium text-amber-600 hover:underline">Cancel</button>
      <button onClick={() => onChangeStatus('postponed')} className="text-sm font-medium text-amber-600 hover:underline">Postpone</button>
      {showReschedule ? (
        <div className="flex gap-2 items-center">
          <input type="datetime-local" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} className={`${INPUT_CLS} w-auto`} />
          <button onClick={() => { if (rescheduleDate) { onReschedule(rescheduleDate); setShowReschedule(false); setRescheduleDate(''); } }} disabled={!rescheduleDate} className="text-sm font-medium hover:underline disabled:opacity-50" style={{ color: 'var(--sf-accent)' }}>Apply</button>
          <button onClick={() => { setShowReschedule(false); setRescheduleDate(''); }} className="text-sm font-medium text-(--color-text-secondary) hover:underline">Cancel</button>
        </div>
      ) : (
        <button onClick={() => setShowReschedule(true)} className="text-sm font-medium text-emerald-600 hover:underline">Reschedule</button>
      )}
      {showLoc ? (
        <div className="flex gap-2">
          <input type="text" value={locInput} onChange={(e) => setLocInput(e.target.value)} placeholder="New location" className={`${INPUT_CLS} w-40`} />
          <button onClick={() => { onChangeLocation(locInput); setShowLoc(false); setLocInput(''); }} className="text-sm font-medium hover:underline" style={{ color: 'var(--sf-accent)' }}>Apply</button>
        </div>
      ) : (
        <button onClick={() => setShowLoc(true)} className="text-sm font-medium hover:underline" style={{ color: 'var(--sf-accent)' }}>Change location</button>
      )}
      <button onClick={onDelete} className="text-sm font-medium text-red-600 hover:underline ml-auto">Delete</button>
    </div>
  );
}

// =================================================================
// MAIN COMPONENT
// =================================================================
export default function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [locations, setLocations] = useState([]);
  const [opponents, setOpponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [pendingNotifications, setPendingNotifications] = useState(0);

  // Modals
  const [modalEvent, setModalEvent] = useState(undefined); // undefined=closed, null=new, object=edit/dup
  const [deleteEvents, setDeleteEvents] = useState(null);
  const [showRecurring, setShowRecurring] = useState(false);

  // Filters
  const [teamFilter, setTeamFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showPast, setShowPast] = useState(false);

  // Sort
  const [sortField, setSortField] = useState('date');
  const [sortAsc, setSortAsc] = useState(true);

  // Bulk selection
  const [selected, setSelected] = useState(new Set());

  function handleSort(field) {
    if (sortField === field) setSortAsc((v) => !v);
    else { setSortField(field); setSortAsc(true); }
  }

  async function loadData() {
    setLoading(true);
    setError(null);
    setSelected(new Set());

    const seasonRes = await supabase.from('seasons').select('id').eq('status', 'active').single();
    if (seasonRes.error) { setEvents([]); setTeams([]); setLoading(false); return; }

    const [eventsRes, teamsRes] = await Promise.all([
      supabase.from('events').select('*, teams(id, name, sort_order, team_color), event_duties(id, duty_name, slots_needed)').order('start_at', { ascending: false }),
      supabase.from('teams').select('id, name, sort_order, team_color').eq('season_id', seasonRes.data.id).order('sort_order', { ascending: true }),
    ]);

    if (eventsRes.error) { setError('Failed to load events.'); console.error(eventsRes.error); }
    else setEvents(eventsRes.data);
    if (!teamsRes.error) setTeams(teamsRes.data);

    // Fetch locations, opponents, and pending notification count
    const [locsRes, oppsRes, { count }] = await Promise.all([
      supabase.from('locations').select('*').order('name'),
      supabase.from('opponents').select('*').order('name'),
      supabase.from('notifications_queue').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);
    if (locsRes.data) setLocations(locsRes.data);
    if (oppsRes.data) setOpponents(oppsRes.data);
    setPendingNotifications(count || 0);

    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  const now = new Date().toISOString();

  const displayed = useMemo(() => {
    let list = events.filter((e) => {
      if (teamFilter !== 'all' && e.team_id !== teamFilter) return false;
      if (typeFilter !== 'all' && e.event_type !== typeFilter) return false;
      if (statusFilter !== 'all' && e.status !== statusFilter) return false;
      if (showPast) { if (e.start_at >= now) return false; }
      else { if (e.start_at < now) return false; }
      return true;
    });
    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'date') cmp = a.start_at < b.start_at ? -1 : a.start_at > b.start_at ? 1 : 0;
      else if (sortField === 'team') cmp = (a.teams?.name || '').localeCompare(b.teams?.name || '');
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [events, teamFilter, typeFilter, statusFilter, showPast, sortField, sortAsc, now]);

  function toggleSelect(id) {
    setSelected((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }
  function toggleSelectAll() {
    if (selected.size === displayed.length) setSelected(new Set());
    else setSelected(new Set(displayed.map((e) => e.id)));
  }

  async function handleDelete(ids) {
    await supabase.from('events').delete().in('id', ids);
    setDeleteEvents(null);
    loadData();
  }

  async function bulkChangeStatus(status) {
    await supabase.from('events').update({ status }).in('id', [...selected]);
    loadData();
  }

  async function bulkReschedule(newDateTime) {
    const newStart = new Date(newDateTime).toISOString();
    await supabase.from('events').update({ start_at: newStart, status: 'scheduled' }).in('id', [...selected]);
    loadData();
  }

  async function bulkChangeLocation(location) {
    await supabase.from('events').update({ location }).in('id', [...selected]);
    loadData();
  }

  function handleDuplicate(ev) {
    // Clone event without id — modal treats it as new
    setModalEvent({ ...ev, id: undefined, _duties: ev.event_duties || [] });
  }

  function handleSave() {
    setModalEvent(undefined);
    setShowRecurring(false);
    loadData();
  }

  const selectedEvents = events.filter((e) => selected.has(e.id));

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Events</h1>
          {pendingNotifications > 0 && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{pendingNotifications} notification{pendingNotifications !== 1 ? 's' : ''} queued</span>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowRecurring(true)} className={BTN_SECONDARY}>Create Recurring</button>
          <button onClick={() => setModalEvent(null)} className="px-4 py-2 text-sm font-medium rounded" style={{ backgroundColor: 'var(--sf-accent)', color: 'var(--sf-text-on-dark)' }}>+ Add Event</button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-start gap-3 mb-4">
        <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)} aria-label="Filter by team" className={INPUT_CLS + ' w-auto'}>
          <option value="all">All Teams</option>
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>

        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Filter by event type">
          {FILTER_TYPES.map((type) => <Pill key={type} active={typeFilter === type} onClick={() => setTypeFilter(type)} ariaProps={{ role: 'radio', 'aria-checked': typeFilter === type }}>{TYPE_LABELS[type]}</Pill>)}
        </div>

        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Filter by status">
          {FILTER_STATUSES.map((s) => <Pill key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)} ariaProps={{ role: 'radio', 'aria-checked': statusFilter === s }}>{STATUS_LABELS[s]}</Pill>)}
        </div>

        <Pill active={showPast} onClick={() => setShowPast((v) => !v)} ariaProps={{ 'aria-pressed': showPast }}>
          {showPast ? 'Past Events' : 'Upcoming'}
        </Pill>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <BulkBar
          count={selected.size}
          onDelete={() => setDeleteEvents(selectedEvents)}
          onChangeStatus={bulkChangeStatus}
          onChangeLocation={bulkChangeLocation}
          onReschedule={bulkReschedule}
        />
      )}

      {/* Loading / Error / Empty */}
      {loading && <p className="text-(--color-text-secondary) py-8 text-center" role="status" aria-live="polite">Loading events...</p>}
      {error && <p role="alert" className="text-red-600 py-8 text-center">{error}</p>}
      {!loading && !error && displayed.length === 0 && (
        <div className="text-center py-12">
          <p className="text-(--color-text-secondary) text-lg mb-1">{events.length === 0 ? 'No events yet' : showPast ? 'No past events' : 'No upcoming events'}</p>
          <p className="text-(--color-text-secondary) text-sm">{events.length === 0 ? 'Add your first event to get started.' : 'Try adjusting your filters.'}</p>
        </div>
      )}

      {/* Desktop table */}
      {!loading && !error && displayed.length > 0 && (
        <>
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-(--color-border-tertiary) text-left">
                  <th className="py-2 pr-2"><input type="checkbox" checked={selected.size === displayed.length && displayed.length > 0} onChange={toggleSelectAll} aria-label="Select all" /></th>
                  <th className="py-2 pr-2 font-semibold text-(--color-text-secondary) w-8"></th>
                  <SortHeader label="Date" field="date" sortField={sortField} sortAsc={sortAsc} onSort={handleSort} />
                  <th className="py-2 pr-4 font-semibold text-(--color-text-secondary)">Time</th>
                  <SortHeader label="Team" field="team" sortField={sortField} sortAsc={sortAsc} onSort={handleSort} />
                  <th className="py-2 pr-4 font-semibold text-(--color-text-secondary)">Type</th>
                  <th className="py-2 pr-4 font-semibold text-(--color-text-secondary)">Title</th>
                  <th className="py-2 pr-4 font-semibold text-(--color-text-secondary)">Location</th>
                  <th className="py-2 pr-4 font-semibold text-(--color-text-secondary)">Opponent</th>
                  <th className="py-2 font-semibold text-(--color-text-secondary)"></th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((ev) => {
                  const si = STATUS_ICONS[ev.status] || STATUS_ICONS.scheduled;
                  return (
                    <tr key={ev.id} className={`border-b border-(--color-border-tertiary) ${selected.has(ev.id) ? 'bg-(--color-background-secondary)' : ''}`}>
                      <td className="py-2 pr-2"><input type="checkbox" checked={selected.has(ev.id)} onChange={() => toggleSelect(ev.id)} aria-label={`Select ${ev.title}`} /></td>
                      <td className="py-2 pr-2"><span className={si.cls} title={STATUS_LABELS[ev.status]}>{si.icon}</span></td>
                      <td className="py-2 pr-4 text-(--color-text-primary) whitespace-nowrap">{formatDate(ev.start_at)}</td>
                      <td className="py-2 pr-4 text-(--color-text-primary) whitespace-nowrap">{formatTime(ev.start_at)}</td>
                      <td className="py-2 pr-4 text-(--color-text-primary) whitespace-nowrap"><TeamDot color={ev.teams?.team_color} />{ev.teams?.name || '—'}</td>
                      <td className="py-2 pr-4 text-(--color-text-secondary)">{TYPE_LABELS[ev.event_type] || ev.event_type}</td>
                      <td className="py-2 pr-4 text-(--color-text-primary) font-medium">{ev.title}</td>
                      <td className="py-2 pr-4 text-(--color-text-secondary)">{ev.location || '—'}</td>
                      <td className="py-2 pr-4 text-(--color-text-secondary)">{ev.opponent || '—'}</td>
                      <td className="py-2 whitespace-nowrap">
                        <button onClick={() => setModalEvent(ev)} className="text-sm font-medium mr-2 hover:underline" style={{ color: 'var(--sf-accent)' }}>Edit</button>
                        <button onClick={() => handleDuplicate(ev)} className="text-sm font-medium mr-2 text-(--color-text-secondary) hover:underline">Dup</button>
                        <button onClick={() => setDeleteEvents([ev])} className="text-sm font-medium text-red-600 hover:underline">Del</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden flex flex-col gap-3">
            {displayed.map((ev) => {
              const si = STATUS_ICONS[ev.status] || STATUS_ICONS.scheduled;
              return (
                <div key={ev.id} className={`bg-(--color-background) rounded-lg shadow-sm border border-(--color-border-tertiary) p-4 ${selected.has(ev.id) ? 'ring-2 ring-[var(--sf-accent)]' : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={selected.has(ev.id)} onChange={() => toggleSelect(ev.id)} aria-label={`Select ${ev.title}`} />
                      <span className={si.cls}>{si.icon}</span>
                      <span className="text-sm font-semibold text-(--color-text-primary)">{formatDate(ev.start_at)}</span>
                      <span className="text-sm text-(--color-text-secondary)">{formatTime(ev.start_at)}</span>
                    </div>
                  </div>
                  <h3 className="font-medium text-(--color-text-primary)">{ev.title}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-(--color-text-secondary)">
                    <span className="flex items-center"><TeamDot color={ev.teams?.team_color} />{ev.teams?.name}</span>
                    <span>{TYPE_LABELS[ev.event_type]}</span>
                    {ev.location && <span>{ev.location}</span>}
                    {ev.opponent && <span>vs. {ev.opponent}</span>}
                  </div>
                  <div className="flex gap-4 mt-3 pt-2 border-t border-(--color-border-tertiary)">
                    <button onClick={() => setModalEvent(ev)} className="text-sm font-medium hover:underline" style={{ color: 'var(--sf-accent)' }}>Edit</button>
                    <button onClick={() => handleDuplicate(ev)} className="text-sm font-medium text-(--color-text-secondary) hover:underline">Duplicate</button>
                    <button onClick={() => setDeleteEvents([ev])} className="text-sm font-medium text-red-600 hover:underline">Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Modals */}
      {modalEvent !== undefined && (
        <EventModal event={modalEvent} teams={teams} allEvents={events} locations={locations} opponents={opponents} onSave={handleSave} onClose={() => setModalEvent(undefined)} />
      )}
      {showRecurring && (
        <RecurringModal teams={teams} allEvents={events} onSave={handleSave} onClose={() => setShowRecurring(false)} />
      )}
      {deleteEvents && (
        <DeleteDialog events={deleteEvents} onConfirm={handleDelete} onClose={() => setDeleteEvents(null)} />
      )}
    </div>
  );
}
