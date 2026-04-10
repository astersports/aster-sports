import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { INPUT_CLS_INLINE as INPUT_CLS } from '../lib/styles';
import { timeAgo } from '../lib/formatters';

const LS_NAME = 'skyfire_user_name';
const LS_PHONE = 'skyfire_user_phone';
const LS_PLAYER = 'skyfire_player_id';

// ─── Shared sub-components ──────────────────────────────────
// First-letter avatar circle. Used by the RSVP player selector, ride board
// driver/rider rows, and comment headers so the visual treatment is identical
// everywhere.
function Avatar({ name, size = 24 }) {
  const letter = (name && name.trim()[0]?.toUpperCase()) || '?';
  return (
    <div
      className="inline-flex items-center justify-center rounded-full font-bold text-(--color-text-primary) flex-shrink-0"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: 'var(--color-background-secondary)',
        fontSize: size <= 24 ? '11px' : size <= 28 ? '12px' : '14px',
      }}
      aria-hidden="true"
    >
      {letter}
    </div>
  );
}

// 24px duty checkbox — filled emerald square with white check when claimed,
// dashed-border empty square when open. Mirrors the language of a real
// to-do checkbox so parents instantly read the status.
function DutyCheckbox({ checked }) {
  if (checked) {
    return (
      <div
        className="flex items-center justify-center text-white font-bold flex-shrink-0"
        style={{ width: '24px', height: '24px', backgroundColor: '#10b981', borderRadius: '6px' }}
        aria-hidden="true"
      >
        <span style={{ fontSize: '14px', lineHeight: 1 }}>✓</span>
      </div>
    );
  }
  return (
    <div
      className="flex-shrink-0"
      style={{
        width: '24px',
        height: '24px',
        border: '2px dashed var(--color-border-secondary)',
        borderRadius: '6px',
      }}
      aria-hidden="true"
    />
  );
}

// Format the time remaining until an RSVP deadline as a parent-friendly
// string. Returns null if the deadline is more than 72h away (caller hides
// the banner) or already passed (caller shows the closed message instead).
function rsvpDeadlineLabel(deadlineIso) {
  const ms = new Date(deadlineIso).getTime() - Date.now();
  if (ms <= 0 || ms > 72 * 3600000) return null;
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  if (days > 0) return `${days} day${days !== 1 ? 's' : ''} ${hours} hour${hours !== 1 ? 's' : ''}`;
  return `${hours} hour${hours !== 1 ? 's' : ''}`;
}

// =================================================================
// RSVP SECTION
// =================================================================
export function RsvpSection({ event, userRole, isPublic, onUpdate }) {
  const [rsvps, setRsvps] = useState(event.event_rsvps || []);
  const [roster, setRoster] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(localStorage.getItem(LS_PLAYER) || '');
  const [comment, setComment] = useState('');
  const [showList, setShowList] = useState(false);
  const [adminPlayerId, setAdminPlayerId] = useState('');

  const deadlinePassed = event.rsvp_deadline && new Date(event.rsvp_deadline) < new Date();
  const isAdmin = userRole === 'admin';
  // Tracks which player is in "edit my RSVP" mode after they've already
  // submitted one — see rsvpBtns below.
  const [changingPlayerId, setChangingPlayerId] = useState(null);
  // Live label for the deadline banner. Recomputes on every render so the
  // text stays accurate while the modal stays open.
  const deadlineCountdown = event.rsvp_deadline ? rsvpDeadlineLabel(event.rsvp_deadline) : null;

  useEffect(() => {
    if (!event.team_id) return;
    supabase.from('team_players').select('player_id, players(id, first_name, last_name), roster_type, status').eq('team_id', event.team_id).then(({ data, error }) => {
      if (error) console.error('Roster fetch error:', error);
      if (data) setRoster(data.filter((r) => r.status === 'active'));
    });
  }, [event.team_id]);

  const counts = { going: 0, maybe: 0, not_going: 0 };
  for (const r of rsvps) counts[r.response] = (counts[r.response] || 0) + 1;
  const rsvpPlayerIds = new Set(rsvps.map((r) => r.player_id));
  const noResponseCount = roster.filter((r) => !rsvpPlayerIds.has(r.player_id)).length;
  const total = rsvps.length + noResponseCount;

  // Futures alert
  const rosteredGoing = rsvps.filter((r) => r.response === 'going' && roster.find((p) => p.player_id === r.player_id && p.roster_type === 'rostered')).length;
  const showFuturesAlert = isAdmin && rosteredGoing > 0 && rosteredGoing < 8 && roster.some((p) => p.roster_type === 'futures');

  // Current user's player RSVP
  const myRsvp = rsvps.find((r) => r.player_id === selectedPlayer);

  const [submitError, setSubmitError] = useState(null);

  async function submitRsvp(response, playerId) {
    if (!playerId) return;
    setSubmitting(true);
    setSubmitError(null);
    const { data, error } = await supabase.from('event_rsvps').upsert({
      event_id: event.id,
      player_id: playerId,
      response,
      comment: comment.trim() || null,
      responded_at: new Date().toISOString(),
    }, { onConflict: 'event_id,player_id' }).select().single();

    if (error) {
      console.error('RSVP submit failed:', error);
      setSubmitError('Could not save RSVP. Please try again.');
      setSubmitting(false);
      return;
    }
    if (data) {
      setRsvps((prev) => {
        const filtered = prev.filter((r) => r.player_id !== playerId);
        return [...filtered, data];
      });
      if (isPublic) localStorage.setItem(LS_PLAYER, playerId);
    }
    setComment('');
    setSubmitting(false);
    // Exit "change" mode so the freshly-submitted RSVP renders as confirmed.
    setChangingPlayerId(null);
    onUpdate?.();
  }

  const rsvpBtns = (playerId) => {
    const playerRsvp = rsvps.find((rv) => rv.player_id === playerId);
    const inChangeMode = changingPlayerId === playerId;
    const isConfirmed = !!playerRsvp && !inChangeMode;
    const labels = { going: 'Going', maybe: 'Maybe', not_going: 'Not Going' };
    const filledCls = {
      going: 'bg-emerald-500 text-white border-transparent',
      maybe: 'bg-amber-400 text-white border-transparent',
      not_going: 'bg-red-500 text-white border-transparent',
    };
    const outlineCls = {
      going: 'border-emerald-500 text-emerald-600',
      maybe: 'border-amber-400 text-amber-600',
      not_going: 'border-red-500 text-red-600',
    };

    // Confirmed view — single filled button + small "Change" link.
    if (isConfirmed) {
      return (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled
            aria-label={`Confirmed: ${labels[playerRsvp.response]}`}
            className={`min-h-[44px] w-full sm:w-auto px-4 py-2.5 rounded text-sm font-medium border ${filledCls[playerRsvp.response]} disabled:opacity-100`}
          >
            {labels[playerRsvp.response]} ✓
          </button>
          <button
            type="button"
            onClick={() => setChangingPlayerId(playerId)}
            className="text-xs text-(--color-text-secondary) underline"
          >
            Change
          </button>
        </div>
      );
    }

    // Default — three big touch-friendly buttons.
    return (
      <div className="flex flex-col sm:flex-row gap-2">
        {['going', 'maybe', 'not_going'].map((r) => {
          const active = playerRsvp?.response === r;
          return (
            <button
              key={r}
              onClick={() => submitRsvp(r, playerId)}
              disabled={submitting || (deadlinePassed && !isAdmin)}
              className={`min-h-[44px] w-full sm:w-auto px-4 py-2.5 rounded text-sm font-medium border transition-colors sf-bounce-tap ${active ? filledCls[r] : `${outlineCls[r]} bg-transparent`} disabled:opacity-50`}
            >
              {labels[r]}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* RSVP deadline banner — amber inside 72h, red after passed. */}
      {deadlinePassed ? (
        <div className="bg-red-50 border border-red-200 rounded px-3 py-2 text-sm font-medium text-red-700">
          RSVP closed
        </div>
      ) : deadlineCountdown ? (
        <div className="bg-amber-50 border border-amber-200 rounded px-3 py-2 text-sm font-medium text-amber-800">
          RSVP closes in {deadlineCountdown}
        </div>
      ) : null}

      {/* Summary bar */}
      <div>
        <p className="text-xs text-(--color-text-secondary) mb-1 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />{counts.going} In</span>
          <span>·</span>
          <span className="inline-flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-amber-400" />{counts.maybe} Maybe</span>
          <span>·</span>
          <span className="inline-flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-red-500" />{counts.not_going} No</span>
          {(noResponseCount > 0 || roster.length > 0) && <><span>·</span><span className="inline-flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-gray-300" />{noResponseCount > 0 ? noResponseCount : roster.length} Missing</span></>}
        </p>
        {total > 0 && (
          <div className="flex h-2 rounded-full overflow-hidden bg-(--color-background-secondary)">
            {counts.going > 0 && <div className="bg-emerald-500" style={{ width: `${(counts.going / total) * 100}%`, transition: 'width 300ms ease' }} />}
            {counts.maybe > 0 && <div className="bg-amber-400" style={{ width: `${(counts.maybe / total) * 100}%`, transition: 'width 300ms ease' }} />}
            {counts.not_going > 0 && <div className="bg-red-400" style={{ width: `${(counts.not_going / total) * 100}%`, transition: 'width 300ms ease' }} />}
            {noResponseCount > 0 && <div className="bg-gray-300" style={{ width: `${(noResponseCount / total) * 100}%`, transition: 'width 300ms ease' }} />}
          </div>
        )}
      </div>

      {/* deadlinePassed message moved to the banner above. */}
      {submitError && <p role="alert" className="text-xs text-red-600">{submitError}</p>}

      {/* Futures alert */}
      {showFuturesAlert && (
        <div className="bg-amber-50 border border-amber-200 rounded p-2 text-sm text-amber-800">
          Only {rosteredGoing} rostered player{rosteredGoing !== 1 ? 's' : ''} confirmed. Consider activating a Futures player.
        </div>
      )}

      {/* Player selector */}
      {!isAdmin && (() => {
        const selectedPlayerObj = roster.find((r) => r.player_id === selectedPlayer);
        const selectedPlayerName = selectedPlayerObj?.players?.first_name || '';
        return (
          <div className="flex flex-wrap gap-2 items-end">
            <Avatar name={selectedPlayerName} size={32} />
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-medium text-(--color-text-secondary) mb-1">Your player</label>
              <select
                value={selectedPlayer}
                onChange={(e) => {
                  setSelectedPlayer(e.target.value);
                  localStorage.setItem(LS_PLAYER, e.target.value);
                  // A new player has their own RSVP state — reset change mode.
                  setChangingPlayerId(null);
                }}
                className={`${INPUT_CLS} w-full`}
              >
                <option value="">Select player...</option>
                {roster.map((r) => <option key={r.player_id} value={r.player_id}>{r.players?.first_name} {r.players?.last_name}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[120px]">
              <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Note (optional)" className={`${INPUT_CLS} w-full`} />
            </div>
          </div>
        );
      })()}
      {!isAdmin && selectedPlayer && rsvpBtns(selectedPlayer)}

      {/* Admin: RSVP on behalf */}
      {isAdmin && (
        <div className="flex flex-wrap gap-2 items-end">
          <select value={adminPlayerId} onChange={(e) => setAdminPlayerId(e.target.value)} className={`${INPUT_CLS}`}>
            <option value="">RSVP on behalf of...</option>
            {roster.map((r) => <option key={r.player_id} value={r.player_id}>{r.players?.first_name} {r.players?.last_name}</option>)}
          </select>
          {adminPlayerId && rsvpBtns(adminPlayerId)}
        </div>
      )}

      {/* Admin: detailed RSVP list */}
      {isAdmin && roster.length > 0 && (
        <details open={showList} onToggle={(e) => setShowList(e.target.open)}>
          <summary className="text-xs text-(--color-text-secondary) cursor-pointer hover:underline">Player responses ({roster.length})</summary>
          <ul className="mt-1 space-y-1 text-sm">
            {roster.map((r) => {
              const rv = rsvps.find((x) => x.player_id === r.player_id);
              const statusCls = rv ? { going: 'text-emerald-600', maybe: 'text-amber-600', not_going: 'text-red-500' }[rv.response] : 'text-gray-400';
              const label = rv ? { going: 'Going', maybe: 'Maybe', not_going: 'Not Going' }[rv.response] : 'No response';
              return (
                <li key={r.player_id} className="flex items-center gap-2">
                  <span className="text-(--color-text-primary)">{r.players?.first_name} {r.players?.last_name}</span>
                  <span className={`text-xs font-medium ${statusCls}`}>{label}</span>
                  {r.roster_type === 'futures' && <span className="text-xs bg-purple-100 text-purple-700 px-1.5 rounded">Futures</span>}
                  {rv?.comment && <span className="text-xs text-(--color-text-secondary)">— {rv.comment}</span>}
                </li>
              );
            })}
          </ul>
        </details>
      )}
    </div>
  );
}

// =================================================================
// RIDE BOARD
// =================================================================
export function RideBoard({ event, userRole, isPublic, onUpdate }) {
  const [rides, setRides] = useState(event.event_rides || []);
  const [showForm, setShowForm] = useState(null); // 'offering' | 'requesting' | null
  const [form, setForm] = useState({ seats: 1, pickup_location: '', departure_time: '', notes: '', name: localStorage.getItem(LS_NAME) || '', phone: localStorage.getItem(LS_PHONE) || '' });
  const [submitting, setSubmitting] = useState(false);
  const [rideError, setRideError] = useState(null);
  const [rosterPlayers, setRosterPlayers] = useState([]);
  const [guardians, setGuardians] = useState([]);

  useEffect(() => {
    if (isPublic || !event.team_id) return;
    // Fetch players for "Need a ride" dropdown
    supabase.from('team_players').select('player_id, players(id, first_name, last_name)').eq('team_id', event.team_id).then(({ data, error }) => {
      if (error) console.error('Roster fetch failed:', error);
      else if (data) setRosterPlayers(data);
    });
    // Fetch guardians for "I can drive" dropdown
    supabase.from('team_players').select('player_id, players(id, player_guardians(guardian_id, guardians(id, first_name, last_name)))').eq('team_id', event.team_id).then(({ data, error }) => {
      if (error) { console.error('Guardian fetch failed:', error); return; }
      if (data) {
        const guardianMap = new Map();
        for (const tp of data) {
          for (const pg of tp.players?.player_guardians || []) {
            const g = pg.guardians;
            if (g && !guardianMap.has(g.id)) guardianMap.set(g.id, g);
          }
        }
        setGuardians([...guardianMap.values()]);
      }
    });
  }, [event.team_id, isPublic]);

  const drivers = rides.filter((r) => r.ride_type === 'offering');
  const riders = rides.filter((r) => r.ride_type === 'requesting');
  const offeredSeats = drivers.reduce((s, r) => s + (r.seats || 0), 0);
  const neededSeats = riders.reduce((s, r) => s + (r.seats || 0), 0);
  const covered = offeredSeats >= neededSeats;

  const myName = localStorage.getItem(LS_NAME);

  async function submitRide(type) {
    if (!form.name.trim()) return;
    setSubmitting(true);
    setRideError(null);
    const nameTrimmed = form.name.trim();
    const phoneTrimmed = form.phone.trim() || null;
    const payload = {
      event_id: event.id,
      ride_type: type,
      name: nameTrimmed,
      phone: phoneTrimmed,
      seats: Number(form.seats) || 1,
      pickup_location: form.pickup_location.trim() || null,
      departure_time: form.departure_time ? new Date(`${new Date(event.start_at).toISOString().slice(0, 10)}T${form.departure_time}`).toISOString() : null,
      notes: form.notes.trim() || null,
    };
    localStorage.setItem(LS_NAME, nameTrimmed);
    if (phoneTrimmed) localStorage.setItem(LS_PHONE, phoneTrimmed);

    const { data, error } = await supabase.from('event_rides').insert(payload).select().single();
    if (error) {
      console.error('Ride submit failed:', error);
      setRideError('Could not save ride. Please try again.');
      setSubmitting(false);
      return;
    }
    if (data) setRides((prev) => [...prev, data]);
    setShowForm(null);
    setForm((f) => ({ ...f, seats: 1, pickup_location: '', departure_time: '', notes: '' }));
    setSubmitting(false);
    onUpdate?.();
  }

  async function removeRide(id) {
    const { error: delErr } = await supabase.from('event_rides').delete().eq('id', id);
    if (delErr) {
      console.error('Failed to remove ride:', delErr);
      setRideError('Could not remove ride.');
      return;
    }
    setRides((prev) => prev.filter((r) => r.id !== id));
    onUpdate?.();
  }

  function canRemove(ride) {
    if (userRole === 'admin') return true;
    return ride.name === myName;
  }

  const rideForm = (type) => (
    <div className="bg-(--color-background-secondary) rounded p-3 space-y-2 mt-2">
      {/* Name: dropdown for authenticated, freeform for public */}
      {!isPublic && type === 'requesting' && rosterPlayers.length > 0 ? (
        <select value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={`${INPUT_CLS} w-full`}>
          <option value="">Select player...</option>
          {rosterPlayers.map((r) => {
            const name = `${r.players?.first_name} ${r.players?.last_name}`;
            return <option key={r.player_id} value={name}>{name}</option>;
          })}
        </select>
      ) : !isPublic && type === 'offering' && guardians.length > 0 ? (
        <select value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={`${INPUT_CLS} w-full`}>
          <option value="">Select driver...</option>
          {guardians.map((g) => {
            const name = `${g.first_name} ${g.last_name}`;
            return <option key={g.id} value={name}>{name}</option>;
          })}
          <option value="__custom">Other...</option>
        </select>
      ) : (
        <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Your name" required className={`${INPUT_CLS} w-full`} />
      )}
      {!isPublic && type === 'offering' && form.name === '__custom' && (
        <input value="" onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Enter name" className={`${INPUT_CLS} w-full`} autoFocus />
      )}
      {isPublic && <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="Phone (optional)" className={`${INPUT_CLS} w-full`} />}
      <div className="flex gap-2">
        <input type="number" min="1" max="6" value={form.seats} onChange={(e) => setForm((f) => ({ ...f, seats: e.target.value }))} className={`${INPUT_CLS} w-20`} />
        <span className="text-sm text-(--color-text-secondary) self-center">{type === 'offering' ? 'seats available' : 'seats needed'}</span>
      </div>
      {type === 'offering' && (
        <>
          <input value={form.pickup_location} onChange={(e) => setForm((f) => ({ ...f, pickup_location: e.target.value }))} placeholder="Pickup location (optional)" className={`${INPUT_CLS} w-full`} />
          <input type="time" value={form.departure_time} onChange={(e) => setForm((f) => ({ ...f, departure_time: e.target.value }))} className={INPUT_CLS} />
        </>
      )}
      {type === 'requesting' && (
        <input value={form.pickup_location} onChange={(e) => setForm((f) => ({ ...f, pickup_location: e.target.value }))} placeholder="Your area/neighborhood (optional)" className={`${INPUT_CLS} w-full`} />
      )}
      <input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Notes (optional)" className={`${INPUT_CLS} w-full`} />
      <div className="flex gap-2">
        <button onClick={() => submitRide(type)} disabled={submitting || !form.name.trim()} className="px-3 py-1.5 text-sm font-medium rounded disabled:opacity-50" style={{ backgroundColor: 'var(--sf-accent)', color: 'var(--sf-text-on-dark)' }}>
          {submitting ? 'Saving...' : 'Add'}
        </button>
        <button onClick={() => setShowForm(null)} className="px-3 py-1.5 text-sm font-medium rounded border border-(--color-border-tertiary) text-(--color-text-primary)">Cancel</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <p className="text-xs font-medium text-(--color-text-secondary)">Ride Board</p>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${covered ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
          {offeredSeats} {offeredSeats !== 1 ? 'seats' : 'seat'} offered · {neededSeats} needed
        </span>
      </div>
      {rideError && <p role="alert" className="text-xs text-red-600">{rideError}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Drivers */}
        <div>
          <p className="text-xs font-semibold text-(--color-text-secondary) mb-2">Drivers ({drivers.length})</p>
          {drivers.map((r) => (
            <div key={r.id} className="text-sm mb-2 bg-(--color-background-secondary) rounded p-2">
              <div className="flex items-center gap-2">
                <Avatar name={r.name} size={28} />
                <span className="font-medium text-(--color-text-primary) flex-1 min-w-0 truncate">{r.name}</span>
                {canRemove(r) && <button onClick={() => removeRide(r.id)} className="text-xs text-red-500 hover:underline">Remove</button>}
              </div>
              <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs text-(--color-text-secondary)">
                <span>{r.seats} seat{r.seats !== 1 ? 's' : ''}</span>
                {r.departure_time && (
                  <span className="rounded-full bg-(--color-background) px-2 py-0.5 text-xs">
                    Departs {new Date(r.departure_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </span>
                )}
                {r.pickup_location && <span>· {r.pickup_location}</span>}
                {r.phone && <span>· {r.phone}</span>}
              </div>
            </div>
          ))}
          {showForm !== 'offering' && (
            <button
              onClick={() => setShowForm('offering')}
              className="min-h-[44px] w-full sm:w-auto rounded-lg px-4 text-sm font-medium"
              style={{ border: '1px solid var(--sf-accent)', color: 'var(--sf-accent)' }}
            >
              I can drive
            </button>
          )}
          {showForm === 'offering' && rideForm('offering')}
        </div>

        {/* Riders */}
        <div>
          <p className="text-xs font-semibold text-(--color-text-secondary) mb-2">Riders ({riders.length})</p>
          {riders.map((r) => (
            <div key={r.id} className="text-sm mb-2 bg-(--color-background-secondary) rounded p-2">
              <div className="flex items-center gap-2">
                <Avatar name={r.name} size={28} />
                <span className="font-medium text-(--color-text-primary) flex-1 min-w-0 truncate">{r.name}</span>
                {canRemove(r) && <button onClick={() => removeRide(r.id)} className="text-xs text-red-500 hover:underline">Remove</button>}
              </div>
              <p className="text-xs text-(--color-text-secondary) mt-1">
                {r.seats} seat{r.seats !== 1 ? 's' : ''} needed{r.pickup_location ? ` · ${r.pickup_location}` : ''}{r.phone ? ` · ${r.phone}` : ''}
              </p>
            </div>
          ))}
          {showForm !== 'requesting' && (
            <button
              onClick={() => setShowForm('requesting')}
              className="min-h-[44px] w-full sm:w-auto rounded-lg px-4 text-sm font-medium"
              style={{ border: '1px solid var(--sf-accent)', color: 'var(--sf-accent)' }}
            >
              Need a ride
            </button>
          )}
          {showForm === 'requesting' && rideForm('requesting')}
        </div>
      </div>
    </div>
  );
}

// =================================================================
// COMMENTS THREAD
// =================================================================
export function CommentsThread({ event, userRole, isPublic, onUpdate }) {
  const [comments, setComments] = useState(event.event_comments || []);
  const [body, setBody] = useState('');
  const [name, setName] = useState(localStorage.getItem(LS_NAME) || '');
  const [submitting, setSubmitting] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [commentError, setCommentError] = useState(null);

  const sorted = [...comments].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(a.created_at) - new Date(b.created_at);
  });
  const visible = showAll ? sorted : sorted.slice(0, 3);

  async function postComment() {
    if (!body.trim()) return;
    setSubmitting(true);
    setCommentError(null);
    const payload = {
      event_id: event.id,
      author_name: isPublic ? name.trim() : (userRole || 'User'),
      body: body.trim(),
    };
    if (isPublic) localStorage.setItem(LS_NAME, name.trim());

    const { data, error } = await supabase.from('event_comments').insert(payload).select().single();
    if (error) {
      console.error('Comment post failed:', error);
      setCommentError('Could not post comment.');
      setSubmitting(false);
      return;
    }
    if (data) setComments((prev) => [...prev, data]);
    setBody('');
    setSubmitting(false);
    onUpdate?.();
  }

  async function deleteComment(id) {
    const { error: delErr } = await supabase.from('event_comments').delete().eq('id', id);
    if (delErr) {
      console.error('Comment delete failed:', delErr);
      setCommentError('Could not delete comment.');
      return;
    }
    setComments((prev) => prev.filter((c) => c.id !== id));
    onUpdate?.();
  }

  async function togglePin(c) {
    const { data, error } = await supabase.from('event_comments').update({ pinned: !c.pinned }).eq('id', c.id).select().single();
    if (error) {
      console.error('Pin toggle failed:', error);
      setCommentError('Could not update pin.');
      return;
    }
    if (data) setComments((prev) => prev.map((x) => x.id === data.id ? data : x));
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-(--color-text-secondary)">Comments ({comments.length})</p>
      {commentError && <p role="alert" className="text-xs text-red-600">{commentError}</p>}

      {visible.map((c) => (
        <div
          key={c.id}
          className="text-sm rounded p-2 bg-(--color-background-secondary)"
          style={c.pinned ? { borderLeft: '2px solid #fbbf24' } : undefined}
        >
          <div className="flex items-start gap-2">
            <Avatar name={c.author_name} size={24} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-(--color-text-primary) truncate">{c.author_name}</span>
                {c.pinned && <span className="text-xs font-medium text-amber-600 flex-shrink-0">Pinned</span>}
                <span className="text-xs text-(--color-text-secondary) ml-auto flex-shrink-0">{timeAgo(c.created_at)}</span>
              </div>
              <p className="text-(--color-text-primary) mt-0.5">{c.body}</p>
              {userRole === 'admin' && (
                <div className="flex gap-3 mt-1">
                  <button onClick={() => togglePin(c)} className="text-xs text-(--color-text-secondary) hover:underline">{c.pinned ? 'Unpin' : 'Pin'}</button>
                  <button onClick={() => deleteComment(c.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {sorted.length > 3 && !showAll && (
        <button onClick={() => setShowAll(true)} className="text-xs text-(--color-text-secondary) hover:underline">Show all {sorted.length} comments</button>
      )}

      {/* Add comment — chat-style: pill input + circular send button. */}
      <div className="flex items-center gap-2 pt-1">
        {isPublic && (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className={`${INPUT_CLS} w-32`}
            style={{ borderRadius: '9999px', height: '44px' }}
            aria-label="Your name"
          />
        )}
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a comment..."
          className={`${INPUT_CLS} flex-1 min-w-[150px]`}
          style={{ borderRadius: '9999px', height: '44px' }}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) postComment(); }}
          aria-label="Comment"
        />
        <button
          onClick={postComment}
          disabled={submitting || !body.trim() || (isPublic && !name.trim())}
          aria-label="Post comment"
          className="flex items-center justify-center rounded-full disabled:opacity-50 flex-shrink-0"
          style={{
            width: '36px',
            height: '36px',
            backgroundColor: 'var(--sf-accent)',
            color: 'var(--sf-text-on-dark)',
          }}
        >
          <span style={{ fontSize: '16px', lineHeight: 1 }} aria-hidden="true">↑</span>
        </button>
      </div>
    </div>
  );
}

// =================================================================
// DUTY SIGN-UPS
// =================================================================
export function DutySignups({ event, userRole, isPublic, onUpdate }) {
  const [duties, setDuties] = useState(event.event_duties || []);
  const [claimName, setClaimName] = useState(localStorage.getItem(LS_NAME) || '');
  const [claimingId, setClaimingId] = useState(null);
  const [submittingId, setSubmittingId] = useState(null);
  const [dutyError, setDutyError] = useState(null);

  const myName = localStorage.getItem(LS_NAME);
  const isAdmin = userRole === 'admin';

  async function claim(dutyId) {
    if (isPublic && !claimName.trim()) return;
    const name = isPublic ? claimName.trim() : (userRole || 'User');
    if (isPublic) localStorage.setItem(LS_NAME, name);

    setSubmittingId(dutyId);
    setDutyError(null);
    const { data, error } = await supabase.from('event_duties').update({
      claimed_by_name: name,
      claimed_at: new Date().toISOString(),
    }).eq('id', dutyId).select().single();

    if (error) {
      console.error('Duty claim failed:', error);
      setDutyError('Could not claim duty.');
      setSubmittingId(null);
      return;
    }
    if (data) setDuties((prev) => prev.map((d) => d.id === data.id ? data : d));
    setClaimingId(null);
    setSubmittingId(null);
    onUpdate?.();
  }

  async function unclaim(dutyId) {
    setSubmittingId(dutyId);
    setDutyError(null);
    const { data, error } = await supabase.from('event_duties').update({
      claimed_by_name: null,
      guardian_id: null,
      claimed_at: null,
    }).eq('id', dutyId).select().single();

    if (error) {
      console.error('Duty unclaim failed:', error);
      setDutyError('Could not unclaim duty.');
      setSubmittingId(null);
      return;
    }
    if (data) setDuties((prev) => prev.map((d) => d.id === data.id ? data : d));
    setSubmittingId(null);
    onUpdate?.();
  }

  function canUnclaim(d) {
    if (isAdmin) return true;
    return d.claimed_by_name === myName;
  }

  if (duties.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-(--color-text-secondary)">Volunteer Duties</p>
      {dutyError && <p role="alert" className="text-xs text-red-600">{dutyError}</p>}
      {duties.map((d) => {
        const claimed = d.claimed_by_name || d.guardian_id;
        const isSubmitting = submittingId === d.id;
        return (
          <div key={d.id} className={`flex items-center gap-2 text-sm rounded p-2 ${claimed ? 'bg-(--color-background-secondary)' : 'border border-dashed border-(--color-border-tertiary)'}`}>
            <DutyCheckbox checked={!!claimed} />
            <span className="font-medium text-(--color-text-primary)">{d.duty_name}</span>
            <span className="text-xs text-(--color-text-secondary)">({d.slots_needed} {d.slots_needed === 1 ? 'slot' : 'slots'})</span>
            {claimed ? (
              <>
                <span className="text-emerald-600 text-xs font-medium">— {d.claimed_by_name || 'Claimed'}</span>
                {canUnclaim(d) && (
                  <button
                    onClick={() => unclaim(d.id)}
                    disabled={isSubmitting}
                    aria-busy={isSubmitting}
                    className="text-xs text-red-500 hover:underline ml-auto disabled:opacity-50"
                  >
                    {isSubmitting ? 'Working...' : 'Unclaim'}
                  </button>
                )}
              </>
            ) : (
              <>
                {claimingId === d.id ? (
                  <div className="flex gap-2 ml-auto">
                    {isPublic && <input value={claimName} onChange={(e) => setClaimName(e.target.value)} placeholder="Your name" className={`${INPUT_CLS} w-28 text-xs`} aria-label="Your name" />}
                    <button
                      onClick={() => claim(d.id)}
                      disabled={isSubmitting || (isPublic && !claimName.trim())}
                      aria-busy={isSubmitting}
                      className="text-xs font-medium px-2 py-1 rounded disabled:opacity-50"
                      style={{ backgroundColor: 'var(--sf-accent)', color: 'var(--sf-text-on-dark)' }}
                    >
                      {isSubmitting ? 'Saving...' : 'Confirm'}
                    </button>
                    <button onClick={() => setClaimingId(null)} disabled={isSubmitting} className="text-xs text-(--color-text-secondary)">Cancel</button>
                  </div>
                ) : (
                  <>
                    <span className="text-xs text-amber-600 font-medium">— Open</span>
                    <button onClick={() => setClaimingId(d.id)} className="text-xs font-medium hover:underline ml-auto" style={{ color: 'var(--sf-accent)' }}>Sign up</button>
                  </>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

// =================================================================
// WEATHER BADGE (used on card collapsed state)
// =================================================================
const WMO_ICONS = {
  0: '\u2600\uFE0F', 1: '\u2600\uFE0F', 2: '\u26C5', 3: '\u2601\uFE0F',
  45: '\u2601\uFE0F', 48: '\u2601\uFE0F',
  51: '\uD83C\uDF27\uFE0F', 53: '\uD83C\uDF27\uFE0F', 55: '\uD83C\uDF27\uFE0F',
  61: '\uD83C\uDF27\uFE0F', 63: '\uD83C\uDF27\uFE0F', 65: '\uD83C\uDF27\uFE0F',
  71: '\u2744\uFE0F', 73: '\u2744\uFE0F', 75: '\u2744\uFE0F',
  80: '\uD83C\uDF27\uFE0F', 81: '\uD83C\uDF27\uFE0F', 82: '\uD83C\uDF27\uFE0F',
  85: '\u2744\uFE0F', 86: '\u2744\uFE0F',
  95: '\u26C8\uFE0F', 96: '\u26C8\uFE0F', 99: '\u26C8\uFE0F',
};

// Global cache: address → { lat, lon, weather }
const weatherCache = {};

export function useWeather(events) {
  const [weatherMap, setWeatherMap] = useState({});
  // Stable key derived from event IDs — only re-fetch when the set of events actually changes,
  // not when the parent re-renders and creates a new array reference.
  const eventsKey = events.map((e) => e.id).join(',');

  useEffect(() => {
    async function fetchWeather() {
      const now = Date.now();
      const upcoming = events.filter((e) =>
        !e.indoor &&
        e.location_address &&
        new Date(e.start_at).getTime() - now < 72 * 3600000 &&
        new Date(e.start_at).getTime() > now
      );
      console.log('[Weather] Eligible events:', upcoming.length, 'of', events.length, 'total');

      // Group by unique address
      const addresses = [...new Set(upcoming.map((e) => e.location_address))];
      const results = {};

      for (const addr of addresses) {
        if (weatherCache[addr]) {
          Object.assign(results, weatherCache[addr]);
          continue;
        }

        try {
          // Geocode — use full address for better results
          const geoQuery = addr.replace(/\s+/g, '+');
          const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(geoQuery)}&count=1`);
          const geoData = await geoRes.json();
          console.log('[Weather] Geocode for', addr, ':', geoData.results?.length || 0, 'results');
          if (!geoData.results?.length) continue;
          const { latitude, longitude } = geoData.results[0];

          // Forecast
          const wxRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,weathercode&timezone=America/New_York&forecast_days=3&temperature_unit=fahrenheit`);
          const wxData = await wxRes.json();
          if (!wxData.hourly) continue;

          const addrResults = {};
          // Match each event at this address
          for (const ev of upcoming.filter((e) => e.location_address === addr)) {
            const evTime = new Date(ev.start_at).getTime();
            let bestIdx = 0;
            let bestDiff = Infinity;
            for (let i = 0; i < wxData.hourly.time.length; i++) {
              const diff = Math.abs(new Date(wxData.hourly.time[i]).getTime() - evTime);
              if (diff < bestDiff) { bestDiff = diff; bestIdx = i; }
            }
            const temp = Math.round(wxData.hourly.temperature_2m[bestIdx]);
            const code = wxData.hourly.weathercode[bestIdx];
            addrResults[ev.id] = { temp, icon: WMO_ICONS[code] || '\u2601\uFE0F' };
          }

          weatherCache[addr] = addrResults;
          Object.assign(results, addrResults);
        } catch (err) {
          console.error('[Weather] Fetch error for', addr, err);
        }
      }

      if (Object.keys(results).length > 0) setWeatherMap(results);
    }

    if (events.length > 0) fetchWeather();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventsKey]);

  return weatherMap;
}

export function WeatherBadge({ weather }) {
  if (!weather) return null;
  return (
    <span className="text-xs text-(--color-text-secondary) whitespace-nowrap" title="Weather forecast">
      {weather.icon} {weather.temp}°F
    </span>
  );
}
