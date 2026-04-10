import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import LocationSelect from '../components/LocationSelect';
import ArrivalSelect from '../components/ArrivalSelect';
import {
  EVENT_TYPES,
  FILTER_TYPES,
  TYPE_LABELS,
  STATUS_OPTIONS,
  FILTER_STATUSES,
  STATUS_LABELS,
  STATUS_ICONS,
} from '../lib/constants';
import {
  formatDateLong,
  formatTime,
  formatDateInput,
  isValidDatetime,
  isValidDate,
} from '../lib/formatters';
import {
  INPUT_CLS,
  LABEL_CLS,
  BTN_SECONDARY,
  BTN_PRIMARY,
  BTN_PRIMARY_STYLE,
  MODAL_BACKDROP,
  MODAL_PANEL,
  MODAL_BACKDROP_CLS,
  MODAL_PANEL_CLS,
  MODAL_CENTER_CLS,
  MODAL_CENTER_PANEL_SM_CLS,
  MODAL_CENTER_PANEL_MD_CLS,
} from '../lib/styles';

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
    location_base: '',
    _sub_location: '',
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
      // Split a saved "Venue — SubLocation" string back into its parts so the
      // LocationSelect dropdowns can match the parent venue.
      const [locBase, locSub] = (event.location || '').split(' — ');
      return {
        team_id: event.team_id,
        event_type: event.event_type,
        status: event.status || 'scheduled',
        title: event.title,
        start_at: event.id ? formatDateInput(event.start_at) : '', // blank for duplicates
        end_at: event.id ? formatDateInput(event.end_at) : '',
        is_multi_day: event.is_multi_day || false,
        end_date: event.end_date || '',
        location_base: locBase || '',
        _sub_location: locSub || '',
        location_address: event.location_address || '',
        indoor: event.indoor || false,
        arrival_minutes_before: event.arrival_minutes_before ?? '',
        jersey: event.jersey || '',
        opponent: event.opponent || '',
        enable_rides: event.enable_rides || false,
        rsvp_deadline: event.id ? formatDateInput(event.rsvp_deadline) : '',
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

    const locationCombined = form.location_base
      ? form._sub_location
        ? `${form.location_base} — ${form._sub_location}`
        : form.location_base
      : null;

    const payload = {
      team_id: form.team_id,
      event_type: form.event_type,
      status: form.status,
      title: form.title.trim(),
      start_at: new Date(form.start_at).toISOString(),
      end_at: !form.is_multi_day && form.end_at ? new Date(form.end_at).toISOString() : null,
      is_multi_day: form.is_multi_day,
      end_date: form.is_multi_day && form.end_date ? form.end_date : null,
      location: locationCombined,
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
        const { error: chErr } = await supabase.from('event_changes').insert(changes);
        if (chErr) console.error('Failed to log event changes:', chErr);
      }
      // Queue notifications for visible changes
      if (!result.error && organization?.id) {
        const visibleFields = ['status', 'title', 'start_at', 'end_at', 'location', 'location_address', 'opponent'];
        const visibleChanges = changes.filter((c) => visibleFields.includes(c.field_name));
        if (payload.status === 'cancelled' && event.status !== 'cancelled') {
          const { error: nqErr } = await supabase.from('notifications_queue').insert({
            org_id: organization.id, event_id: event.id, notification_type: 'cancellation',
            recipient_type: 'team', payload: { title: payload.title, team_id: payload.team_id, start_at: payload.start_at },
          });
          if (nqErr) console.error('Failed to queue cancellation notification:', nqErr);
        } else if (visibleChanges.length > 0) {
          const { error: nqErr } = await supabase.from('notifications_queue').insert({
            org_id: organization.id, event_id: event.id, notification_type: 'schedule_change',
            recipient_type: 'team', payload: { title: payload.title, team_id: payload.team_id, changes: visibleChanges.map((c) => ({ field: c.field_name, from: c.old_value, to: c.new_value })) },
          });
          if (nqErr) console.error('Failed to queue schedule change notification:', nqErr);
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
        const { error: delErr } = await supabase.from('event_duties').delete().eq('event_id', eventId);
        if (delErr) console.error('Failed to clear existing duties:', delErr);
      }
      const dutyRows = form.duties.filter((d) => d.duty_name.trim()).map((d) => ({
        event_id: eventId, duty_name: d.duty_name.trim(), slots_needed: Number(d.slots_needed) || 1,
      }));
      if (dutyRows.length > 0) {
        const { error: dutyErr } = await supabase.from('event_duties').insert(dutyRows);
        if (dutyErr) console.error('Failed to insert duties:', dutyErr);
      }
    }

    onSave();
  }

  // Conflict warning overlay
  if (conflict) {
    return (
      <div className={MODAL_CENTER_CLS} style={MODAL_BACKDROP}>
        <div className={MODAL_CENTER_PANEL_MD_CLS} style={MODAL_PANEL}>
          <h2 className="text-lg font-bold text-(--color-text-primary) mb-2">Schedule Conflict</h2>
          <p className="text-sm text-(--color-text-secondary) mb-3">This event overlaps with:</p>
          <ul className="text-sm text-(--color-text-primary) mb-4 space-y-1">
            {conflict.map((c) => (
              <li key={c.id}><strong>{c.title}</strong> — {formatDateLong(c.start_at)} {formatTime(c.start_at)}{c.teams?.name ? ` (${c.teams.name})` : ''}</li>
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
    <div className={MODAL_BACKDROP_CLS} style={MODAL_BACKDROP} onClick={onClose}>
      <div
        className={MODAL_PANEL_CLS}
        style={MODAL_PANEL}
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
          <LocationSelect
            baseName={form.location_base}
            subLocation={form._sub_location}
            address={form.location_address}
            locations={locations}
            idPrefix="ev"
            onChange={({ baseName, subLocation, address }) =>
              setForm((f) => ({
                ...f,
                location_base: baseName,
                _sub_location: subLocation,
                location_address: address,
              }))
            }
          />

          {/* Indoor + Arrival */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center gap-2 text-sm text-(--color-text-primary)">
              <input type="checkbox" checked={form.indoor} onChange={(e) => update('indoor', e.target.checked)} className="rounded" />
              Indoor venue
            </label>
            <ArrivalSelect
              value={form.arrival_minutes_before}
              onChange={(v) => update('arrival_minutes_before', v)}
              idPrefix="ev"
            />
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
                    update('rsvp_deadline', formatDateInput(deadline.toISOString()));
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
            <button type="submit" disabled={saving || hasDateError} aria-busy={saving} className={BTN_PRIMARY} style={BTN_PRIMARY_STYLE}>
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
function RecurringModal({ teams, allEvents, locations, onSave, onClose }) {
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const [form, setForm] = useState({
    team_id: teams[0]?.id || '',
    event_type: 'practice',
    title: '',
    location_base: '',
    _sub_location: '',
    location_address: '',
    indoor: false,
    enable_rides: false,
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
      // Default enable_rides on for tournaments — match EventModal behavior
      if (field === 'event_type' && value === 'tournament') next.enable_rides = true;
      return next;
    });
  }

  // Date validation — same range as EventModal
  const dateErrors = {
    first_date: !isValidDate(form.first_date),
  };
  const hasDateError = Object.values(dateErrors).some(Boolean);

  // Combine base + sub for the saved location string
  const locationCombined = form.location_base
    ? form._sub_location
      ? `${form.location_base} — ${form._sub_location}`
      : form.location_base
    : null;

  const generatedDates = useMemo(() => {
    if (!form.first_date || !form.num_weeks || !isValidDate(form.first_date)) return [];
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
        location: locationCombined,
        location_address: form.location_address.trim() || null,
        indoor: form.indoor,
        arrival_minutes_before: form.arrival_minutes_before !== '' ? Number(form.arrival_minutes_before) : null,
        enable_rides: form.enable_rides,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generatedDates, form.team_id, locationCombined, form.start_time, form.end_time]);

  async function handleCreate(e) {
    e.preventDefault();
    if (hasDateError) { setError('Please fix invalid date values before saving.'); return; }
    setSaving(true);
    setError(null);
    const payloads = buildPayloads();
    if (payloads.length === 0) { setError('No dates generated.'); setSaving(false); return; }

    const { data, error: insertErr } = await supabase.from('events').insert(payloads).select('id');
    if (insertErr) {
      console.error('Recurring event insert failed:', insertErr);
      setError(insertErr.message);
      setSaving(false);
      return;
    }

    // Insert duties for each event
    if (data && form.duties.length > 0) {
      const dutyRows = data.flatMap((ev) =>
        form.duties.filter((d) => d.duty_name.trim()).map((d) => ({
          event_id: ev.id, duty_name: d.duty_name.trim(), slots_needed: Number(d.slots_needed) || 1,
        }))
      );
      if (dutyRows.length > 0) {
        const { error: dutyErr } = await supabase.from('event_duties').insert(dutyRows);
        if (dutyErr) console.error('Recurring duties insert failed:', dutyErr);
      }
    }

    onSave();
  }

  function addDuty() { setForm((f) => ({ ...f, duties: [...f.duties, { duty_name: '', slots_needed: 1 }] })); }
  function removeDuty(i) { setForm((f) => ({ ...f, duties: f.duties.filter((_, j) => j !== i) })); }
  function updateDuty(i, field, value) {
    setForm((f) => ({ ...f, duties: f.duties.map((d, j) => j === i ? { ...d, [field]: value } : d) }));
  }

  return (
    <div className={MODAL_BACKDROP_CLS} style={MODAL_BACKDROP} onClick={onClose}>
      <div className={MODAL_PANEL_CLS} style={MODAL_PANEL} onClick={(e) => e.stopPropagation()}>
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

          {/* Location — same dropdown pattern as EventModal */}
          <LocationSelect
            baseName={form.location_base}
            subLocation={form._sub_location}
            address={form.location_address}
            locations={locations}
            idPrefix="rc"
            onChange={({ baseName, subLocation, address }) =>
              setForm((f) => ({
                ...f,
                location_base: baseName,
                _sub_location: subLocation,
                location_address: address,
              }))
            }
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center gap-2 text-sm text-(--color-text-primary)">
              <input type="checkbox" checked={form.indoor} onChange={(e) => update('indoor', e.target.checked)} className="rounded" />
              Indoor venue
            </label>
            <ArrivalSelect
              value={form.arrival_minutes_before}
              onChange={(v) => update('arrival_minutes_before', v)}
              idPrefix="rc"
            />
          </div>

          {/* Enable rides — match EventModal */}
          <label className="flex items-center gap-2 text-sm text-(--color-text-primary)">
            <input type="checkbox" checked={form.enable_rides} onChange={(e) => update('enable_rides', e.target.checked)} className="rounded" />
            Enable ride board
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="rc-day" className={LABEL_CLS}>Day of Week</label>
              <select id="rc-day" required value={form.day_of_week} onChange={(e) => update('day_of_week', e.target.value)} className={INPUT_CLS}>
                {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="rc-first" className={LABEL_CLS}>First Occurrence</label>
              <input
                id="rc-first"
                type="date"
                required
                value={form.first_date}
                onChange={(e) => update('first_date', e.target.value)}
                className={`${INPUT_CLS} ${dateErrors.first_date ? 'border-red-500 focus:ring-red-500' : ''}`}
              />
              {dateErrors.first_date && <p className="text-xs text-red-500 mt-1">Invalid date</p>}
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

          {/* Duties — match EventModal sizing pattern: flex-1 name, w-20 slots, labels on first row */}
          <fieldset>
            <legend className={LABEL_CLS}>Duty Slots (applied to all events)</legend>
            <p className="text-xs text-(--color-text-secondary) mb-2">Add duties like snack duty or scorekeeping. Parents can claim slots from the schedule.</p>
            {form.duties.map((d, i) => (
              <div key={i} className="flex items-end gap-2 mb-2">
                <div className="flex-1">
                  {i === 0 && <label className="block text-xs text-(--color-text-secondary) mb-1">Duty name</label>}
                  <input type="text" value={d.duty_name} onChange={(e) => updateDuty(i, 'duty_name', e.target.value)} placeholder="e.g. Snacks, Scorebook" className={INPUT_CLS} aria-label="Duty name" />
                </div>
                <div className="w-20">
                  {i === 0 && <label className="block text-xs text-(--color-text-secondary) mb-1">Slots</label>}
                  <input type="number" min="1" value={d.slots_needed} onChange={(e) => updateDuty(i, 'slots_needed', e.target.value)} className={INPUT_CLS} aria-label="Slots needed" />
                </div>
                <button type="button" onClick={() => removeDuty(i)} className="text-red-500 text-sm font-medium px-2 py-2">Remove</button>
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
            <button type="submit" disabled={saving || hasDateError || generatedDates.length === 0} aria-busy={saving} className={BTN_PRIMARY} style={BTN_PRIMARY_STYLE}>
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
    <div className={MODAL_CENTER_CLS} style={MODAL_BACKDROP} onClick={onClose}>
      <div className={MODAL_CENTER_PANEL_SM_CLS} style={MODAL_PANEL} onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-(--color-text-primary) mb-2">Delete {isBulk ? `${events.length} Events` : 'Event'}</h2>
        {isBulk ? (
          <div className="text-sm text-(--color-text-secondary) mb-4">
            <p className="mb-2">This cannot be undone:</p>
            <ul className="list-disc pl-4 space-y-0.5">
              {events.map((ev) => <li key={ev.id}>{ev.title} — {formatDateLong(ev.start_at)}</li>)}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-(--color-text-secondary) mb-6">
            Delete <strong>{events[0].title}</strong> on {formatDateLong(events[0].start_at)}? This cannot be undone.
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
    if (teamsRes.error) console.error('Failed to load teams:', teamsRes.error);
    else setTeams(teamsRes.data);

    // Fetch locations, opponents, and pending notification count
    const [locsRes, oppsRes, notifRes] = await Promise.all([
      supabase.from('locations').select('*').order('name'),
      supabase.from('opponents').select('*').order('name'),
      supabase.from('notifications_queue').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);
    if (locsRes.error) console.error('Failed to load locations:', locsRes.error);
    else if (locsRes.data) setLocations(locsRes.data);
    if (oppsRes.error) console.error('Failed to load opponents:', oppsRes.error);
    else if (oppsRes.data) setOpponents(oppsRes.data);
    if (notifRes.error) console.error('Failed to load notification count:', notifRes.error);
    else setPendingNotifications(notifRes.count || 0);

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
    const { error: delErr } = await supabase.from('events').delete().in('id', ids);
    if (delErr) {
      console.error('Bulk delete failed:', delErr);
      setError('Failed to delete events.');
    }
    setDeleteEvents(null);
    loadData();
  }

  async function bulkChangeStatus(status) {
    const { error: updErr } = await supabase.from('events').update({ status }).in('id', [...selected]);
    if (updErr) { console.error('Bulk status change failed:', updErr); setError('Failed to update events.'); }
    loadData();
  }

  async function bulkReschedule(newDateTime) {
    const newStart = new Date(newDateTime).toISOString();
    const { error: updErr } = await supabase.from('events').update({ start_at: newStart, status: 'scheduled' }).in('id', [...selected]);
    if (updErr) { console.error('Bulk reschedule failed:', updErr); setError('Failed to reschedule events.'); }
    loadData();
  }

  async function bulkChangeLocation(location) {
    const { error: updErr } = await supabase.from('events').update({ location }).in('id', [...selected]);
    if (updErr) { console.error('Bulk location change failed:', updErr); setError('Failed to update locations.'); }
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
                      <td className="py-2 pr-4 text-(--color-text-primary) whitespace-nowrap">{formatDateLong(ev.start_at)}</td>
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
                      <span className="text-sm font-semibold text-(--color-text-primary)">{formatDateLong(ev.start_at)}</span>
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
        <RecurringModal teams={teams} allEvents={events} locations={locations} onSave={handleSave} onClose={() => setShowRecurring(false)} />
      )}
      {deleteEvents && (
        <DeleteDialog events={deleteEvents} onConfirm={handleDelete} onClose={() => setDeleteEvents(null)} />
      )}
    </div>
  );
}
