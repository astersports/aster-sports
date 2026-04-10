import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { INPUT_CLS_INLINE as INPUT_CLS } from '../lib/styles';
import { timeAgo } from '../lib/formatters';

const LS_NAME = 'skyfire_user_name';
const LS_PHONE = 'skyfire_user_phone';
const LS_PLAYER = 'skyfire_player_id';

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
    onUpdate?.();
  }

  const rsvpBtns = (playerId) => (
    <div className="flex gap-2">
      {['going', 'maybe', 'not_going'].map((r) => {
        const active = rsvps.find((rv) => rv.player_id === playerId)?.response === r;
        const colors = { going: 'bg-emerald-500 text-white', maybe: 'bg-amber-400 text-white', not_going: 'bg-red-500 text-white' };
        const inactive = { going: 'border-emerald-500 text-emerald-600', maybe: 'border-amber-400 text-amber-600', not_going: 'border-red-500 text-red-600' };
        return (
          <button
            key={r}
            onClick={() => submitRsvp(r, playerId)}
            disabled={submitting || (deadlinePassed && !isAdmin)}
            className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${active ? colors[r] : `${inactive[r]} bg-transparent`} disabled:opacity-50`}
          >
            {r === 'going' ? 'Going' : r === 'maybe' ? 'Maybe' : 'Not Going'}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-3">
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
          <div className="flex h-1.5 rounded-full overflow-hidden bg-(--color-background-secondary)">
            {counts.going > 0 && <div className="bg-emerald-500" style={{ width: `${(counts.going / total) * 100}%` }} />}
            {counts.maybe > 0 && <div className="bg-amber-400" style={{ width: `${(counts.maybe / total) * 100}%` }} />}
            {counts.not_going > 0 && <div className="bg-red-400" style={{ width: `${(counts.not_going / total) * 100}%` }} />}
            {noResponseCount > 0 && <div className="bg-gray-300" style={{ width: `${(noResponseCount / total) * 100}%` }} />}
          </div>
        )}
      </div>

      {deadlinePassed && !isAdmin && <p className="text-xs text-amber-600 font-medium">RSVP closed</p>}
      {submitError && <p role="alert" className="text-xs text-red-600">{submitError}</p>}

      {/* Futures alert */}
      {showFuturesAlert && (
        <div className="bg-amber-50 border border-amber-200 rounded p-2 text-sm text-amber-800">
          Only {rosteredGoing} rostered player{rosteredGoing !== 1 ? 's' : ''} confirmed. Consider activating a Futures player.
        </div>
      )}

      {/* Player selector */}
      {!isAdmin && (
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-medium text-(--color-text-secondary) mb-1">Your player</label>
            <select value={selectedPlayer} onChange={(e) => { setSelectedPlayer(e.target.value); localStorage.setItem(LS_PLAYER, e.target.value); }} className={`${INPUT_CLS} w-full`}>
              <option value="">Select player...</option>
              {roster.map((r) => <option key={r.player_id} value={r.player_id}>{r.players?.first_name} {r.players?.last_name}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[120px]">
            <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Note (optional)" className={`${INPUT_CLS} w-full`} />
          </div>
        </div>
      )}
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
              <div className="flex items-center justify-between">
                <span className="font-medium text-(--color-text-primary)">{r.name}</span>
                {canRemove(r) && <button onClick={() => removeRide(r.id)} className="text-xs text-red-500 hover:underline">Remove</button>}
              </div>
              <p className="text-xs text-(--color-text-secondary)">{r.seats} seat{r.seats !== 1 ? 's' : ''}{r.departure_time ? ` · Departs ${new Date(r.departure_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}` : ''}{r.pickup_location ? ` · ${r.pickup_location}` : ''}{r.phone ? ` · ${r.phone}` : ''}</p>
            </div>
          ))}
          {showForm !== 'offering' && <button onClick={() => setShowForm('offering')} className="text-xs font-medium hover:underline" style={{ color: 'var(--sf-accent)' }}>I can drive</button>}
          {showForm === 'offering' && rideForm('offering')}
        </div>

        {/* Riders */}
        <div>
          <p className="text-xs font-semibold text-(--color-text-secondary) mb-2">Riders ({riders.length})</p>
          {riders.map((r) => (
            <div key={r.id} className="text-sm mb-2 bg-(--color-background-secondary) rounded p-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-(--color-text-primary)">{r.name}</span>
                {canRemove(r) && <button onClick={() => removeRide(r.id)} className="text-xs text-red-500 hover:underline">Remove</button>}
              </div>
              <p className="text-xs text-(--color-text-secondary)">{r.seats} seat{r.seats !== 1 ? 's' : ''} needed{r.pickup_location ? ` · ${r.pickup_location}` : ''}{r.phone ? ` · ${r.phone}` : ''}</p>
            </div>
          ))}
          {showForm !== 'requesting' && <button onClick={() => setShowForm('requesting')} className="text-xs font-medium hover:underline" style={{ color: 'var(--sf-accent)' }}>Need a ride</button>}
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
        <div key={c.id} className={`text-sm rounded p-2 ${c.pinned ? 'bg-amber-50 border border-amber-200' : 'bg-(--color-background-secondary)'}`}>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-medium text-(--color-text-primary)">{c.author_name}</span>
            <span className="text-xs text-(--color-text-secondary)">{timeAgo(c.created_at)}</span>
            {c.pinned && <span className="text-xs font-medium text-amber-600">Pinned</span>}
            {userRole === 'admin' && (
              <>
                <button onClick={() => togglePin(c)} className="text-xs text-(--color-text-secondary) hover:underline ml-auto">{c.pinned ? 'Unpin' : 'Pin'}</button>
                <button onClick={() => deleteComment(c.id)} className="text-xs text-red-500 hover:underline">Delete</button>
              </>
            )}
          </div>
          <p className="text-(--color-text-primary)">{c.body}</p>
        </div>
      ))}

      {sorted.length > 3 && !showAll && (
        <button onClick={() => setShowAll(true)} className="text-xs text-(--color-text-secondary) hover:underline">Show all {sorted.length} comments</button>
      )}

      {/* Add comment */}
      <div className="flex flex-wrap gap-2 pt-1">
        {isPublic && <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={`${INPUT_CLS} w-32`} />}
        <input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Add a comment..." className={`${INPUT_CLS} flex-1 min-w-[150px]`} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) postComment(); }} />
        <button onClick={postComment} disabled={submitting || !body.trim() || (isPublic && !name.trim())} className="px-3 py-1.5 text-sm font-medium rounded disabled:opacity-50" style={{ backgroundColor: 'var(--sf-accent)', color: 'var(--sf-text-on-dark)' }}>Post</button>
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
