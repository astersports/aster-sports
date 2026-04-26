import { useEffect, useState } from 'react';
import { Car, UserRound, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useRides } from '../../hooks/useRides';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/useToast';
import RideCard from './RideCard';
import RideFormOverlay from './RideFormOverlay';

const defaultPickupTime = (startAt) => {
  if (!startAt) return '';
  const d = new Date(startAt);
  d.setMinutes(d.getMinutes() - 45);
  return d.toTimeString().slice(0, 5);
};

export default function EventRidesTab({ eventId, eventStartAt, eventLocation, eventEndAt }) {
  const { user, guardianId } = useAuth();
  const { showToast } = useToast();
  const { rides, loading, create, claim, remove } = useRides(eventId);
  const [form, setForm] = useState(null);
  const [draft, setDraft] = useState({ pickup_location: '', departure_time: '', seats: 1, phone: '', notes: '' });
  const [guardian, setGuardian] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    supabase.from('guardians').select('first_name, last_name, phone').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => setGuardian(data || null));
  }, [user?.id]);

  if (loading) return <div style={{ padding: 16, color: 'var(--em-text-tertiary)', fontSize: 14 }}>Loading rides...</div>;

  const offers = rides.filter((r) => r.ride_type === 'offering');
  const requests = rides.filter((r) => r.ride_type === 'requesting');
  const authorName = guardian ? `${guardian.first_name || ''} ${guardian.last_name || ''}`.trim() || null : null;

  const openForm = (kind) => {
    setDraft({ pickup_location: '', departure_time: defaultPickupTime(eventStartAt), seats: 1, phone: guardian?.phone || '', notes: '' });
    setForm(kind);
  };

  const submit = async () => {
    const ok = await create({ ride_type: form, ...draft, authorName, event_date: eventStartAt?.slice(0, 10) });
    if (ok) { setForm(null); setDraft({ pickup_location: '', departure_time: '', seats: 1, phone: '', notes: '' }); }
    else showToast('Could not save ride', 'error');
  };

  const handleClaim = async (offer) => {
    const ok = await claim(offer, authorName, guardian?.phone || null);
    if (ok) showToast('You claimed a seat', 'success');
  };

  return (
    <div style={{ padding: '16px 16px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <RideSection title="Drivers offering rides" icon={Car} empty="No drivers yet.">
        {offers.map((r) => <RideCard key={r.id} ride={r} user={user} currentGuardianId={guardianId} onRemove={remove} onClaim={handleClaim} eventLocation={eventLocation} eventEndAt={eventEndAt} />)}
      </RideSection>
      <RideSection title="Riders needing a ride" icon={UserRound} empty="No requests yet.">
        {requests.map((r) => <RideCard key={r.id} ride={r} user={user} currentGuardianId={guardianId} onRemove={remove} eventLocation={eventLocation} eventEndAt={eventEndAt} />)}
      </RideSection>

      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={() => openForm('offering')} className="sf-press"
          style={ghostBtn}><Plus size={16} strokeWidth={1.75} /> Offer ride</button>
        <button type="button" onClick={() => openForm('requesting')} className="sf-press"
          style={ghostBtn}><Plus size={16} strokeWidth={1.75} /> Request ride</button>
      </div>

      {form && (
        <RideFormOverlay
          form={form}
          draft={draft}
          setDraft={setDraft}
          onClose={() => setForm(null)}
          onSubmit={submit}
          eventLocation={eventLocation}
          eventEndAt={eventEndAt}
          phoneKnown={!!guardian?.phone}
        />
      )}
    </div>
  );
}

function RideSection({ title, icon: Icon, empty, children }) {
  const arr = Array.isArray(children) ? children : [children];
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--em-text-secondary)', marginBottom: 8 }}>
        <Icon size={14} strokeWidth={1.75} /> {title}
      </div>
      {arr.filter(Boolean).length === 0
        ? <div style={{ fontSize: 13, color: 'var(--em-text-tertiary)' }}>{empty}</div>
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>}
    </div>
  );
}

const ghostBtn = { flex: 1, minHeight: 40, borderRadius: 10, border: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)', color: 'var(--em-text-primary)', fontSize: 13, fontWeight: 500, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 };
