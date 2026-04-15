import { useState } from 'react';
import { Car, UserRound, Plus, MapPin } from 'lucide-react';
import { useRides } from '../../hooks/useRides';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

// Ride board — offer (driver) and request (rider) cards for an event.
// Schema: ride_type, pickup_location, departure_time, seats, guardian_id, name.
export default function EventRidesTab({ eventId, eventStartAt, eventLocation, eventEndAt }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { rides, loading, create, remove } = useRides(eventId);
  const [form, setForm] = useState(null); // 'offering' | 'requesting' | null
  const [draft, setDraft] = useState({ pickup_location: '', departure_time: '', seats: 1, notes: '' });

  if (loading) return <div style={{ padding: 16, color: 'var(--sf-text-tertiary)', fontSize: 14 }}>Loading rides...</div>;

  const offers = rides.filter((r) => r.ride_type === 'offering');
  const requests = rides.filter((r) => r.ride_type === 'requesting');

  const submit = async () => {
    const ok = await create({ ride_type: form, event_date: eventStartAt?.slice(0, 10), ...draft });
    if (ok) { setForm(null); setDraft({ pickup_location: '', departure_time: '', seats: 1, notes: '' }); }
    else showToast('Could not save ride', 'error');
  };

  return (
    <div style={{ padding: '16px 16px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <RideSection title="Drivers offering rides" icon={Car} empty="No drivers yet.">
        {offers.map((r) => <RideCard key={r.id} ride={r} user={user} onRemove={remove} eventLocation={eventLocation} eventEndAt={eventEndAt} />)}
      </RideSection>
      <RideSection title="Riders needing a ride" icon={UserRound} empty="No requests yet.">
        {requests.map((r) => <RideCard key={r.id} ride={r} user={user} onRemove={remove} eventLocation={eventLocation} eventEndAt={eventEndAt} />)}
      </RideSection>

      {form && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12, backgroundColor: 'var(--sf-bg-secondary)', borderRadius: 10 }}>
          <input type="text" value={draft.pickup_location}
            onChange={(e) => setDraft({ ...draft, pickup_location: e.target.value })}
            placeholder="Pickup location" style={inputStyle} />
          <input type="time" value={draft.departure_time}
            onChange={(e) => setDraft({ ...draft, departure_time: e.target.value })} style={inputStyle} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, color: 'var(--sf-text-secondary)' }}>
              {form === 'offering' ? 'Seats available' : 'Riders'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button type="button" onClick={() => setDraft({ ...draft, seats: Math.max(1, draft.seats - 1) })}
                disabled={draft.seats <= 1}
                style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--sf-border-default)', backgroundColor: 'var(--sf-bg-card)', fontSize: 16 }}>
                -
              </button>
              <span style={{ minWidth: 24, textAlign: 'center', fontSize: 15, fontWeight: 600 }}>
                {draft.seats}
              </span>
              <button type="button" onClick={() => setDraft({ ...draft, seats: Math.min(8, draft.seats + 1) })}
                style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--sf-border-default)', backgroundColor: 'var(--sf-bg-card)', fontSize: 16 }}>
                +
              </button>
            </div>
          </div>
          <input type="text" value={draft.notes}
            onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            placeholder="e.g. I'll text when leaving" style={inputStyle} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => setForm(null)} className="sf-press"
              style={{ flex: 1, minHeight: 40, borderRadius: 10, border: '1px solid var(--sf-border-default)', backgroundColor: 'var(--sf-bg-card)', color: 'var(--sf-text-secondary)', fontSize: 14 }}>
              Cancel
            </button>
            <button type="button" onClick={submit} className="sf-press"
              style={{ flex: 1, minHeight: 40, borderRadius: 10, border: 'none', backgroundColor: 'var(--sf-accent)', color: 'var(--sf-text-inverse)', fontSize: 14, fontWeight: 600 }}>
              {form === 'offering' ? 'Offer ride' : 'Request ride'}
            </button>
          </div>
        </div>
      )}

      {!form && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => setForm('offering')} className="sf-press"
            style={ghostBtn}><Plus size={16} strokeWidth={1.75} /> Offer ride</button>
          <button type="button" onClick={() => setForm('requesting')} className="sf-press"
            style={ghostBtn}><Plus size={16} strokeWidth={1.75} /> Request ride</button>
        </div>
      )}
    </div>
  );
}

function RideSection({ title, icon: Icon, empty, children }) {
  const arr = Array.isArray(children) ? children : [children];
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--sf-text-secondary)', marginBottom: 8 }}>
        <Icon size={14} strokeWidth={1.75} /> {title}
      </div>
      {arr.filter(Boolean).length === 0
        ? <div style={{ fontSize: 13, color: 'var(--sf-text-tertiary)' }}>{empty}</div>
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>}
    </div>
  );
}

function RideCard({ ride, user, onRemove, eventLocation, eventEndAt }) {
  const isMine = ride.guardian_id === user?.id;
  return (
    <div style={{ padding: 12, backgroundColor: 'var(--sf-bg-card)', borderRadius: 10, border: '1px solid var(--sf-border-default)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--sf-text-primary)' }}>{ride.name || 'User'}</span>
        {isMine && <button type="button" onClick={() => onRemove(ride.id)} className="sf-press" style={{ minHeight: 32, padding: '0 8px', background: 'none', border: 'none', color: 'var(--sf-danger)', fontSize: 12, cursor: 'pointer' }}>Remove</button>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--sf-text-secondary)', marginTop: 4, flexWrap: 'wrap' }}>
        {ride.pickup_location && <><MapPin size={12} strokeWidth={1.75} color="var(--sf-text-tertiary)" /><span>{ride.pickup_location}</span><span>·</span></>}
        {ride.departure_time && <><span>{ride.departure_time}</span><span>·</span></>}
        <span>{ride.seats} {ride.ride_type === 'offering' ? 'seats' : ride.seats === 1 ? 'rider' : 'riders'}</span>
      </div>
      {eventLocation && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--sf-text-secondary)' }}>
          <MapPin size={12} strokeWidth={1.75} color="var(--sf-text-tertiary)" />
          <span>Drop-off: {eventLocation}</span>
        </div>
      )}
      {eventEndAt && (
        <div style={{ fontSize: 13, color: 'var(--sf-text-secondary)', marginTop: 2 }}>
          Est. return: {new Date(new Date(eventEndAt).getTime() + 15 * 60000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </div>
      )}
    </div>
  );
}

const inputStyle = { minHeight: 40, borderRadius: 10, border: '1px solid var(--sf-border-default)', backgroundColor: 'var(--sf-bg-card)', padding: '0 10px', fontSize: 14, color: 'var(--sf-text-primary)' };
const ghostBtn = { flex: 1, minHeight: 40, borderRadius: 10, border: '1px solid var(--sf-border-default)', backgroundColor: 'var(--sf-bg-card)', color: 'var(--sf-text-primary)', fontSize: 13, fontWeight: 500, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 };
