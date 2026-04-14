import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useEventDetail } from '../hooks/useEventDetail';
import { useRsvps } from '../hooks/useRsvps';
import EventDetailTab from '../components/event/EventDetailTab';
import EventLocationTab from '../components/event/EventLocationTab';
import EventRsvpTab from '../components/event/EventRsvpTab';
import EventCheckinTab from '../components/event/EventCheckinTab';
import EventDutiesTab from '../components/event/EventDutiesTab';
import EventCommentsTab from '../components/event/EventCommentsTab';
import EventRidesTab from '../components/event/EventRidesTab';
import CreateActivityWizard from '../components/wizard/CreateActivityWizard';

const TYPE_LABELS = {
  practice: 'Practice', game: 'Game', skills_lab: 'Skills Lab',
  tryout: 'Tryout', tournament: 'Tournament', other: 'Event',
};

const ALL_TABS = [
  { key: 'details', label: 'Details' },
  { key: 'location', label: 'Location' },
  { key: 'rsvps', label: 'RSVPs' },
  { key: 'duties', label: 'Duties' },
  { key: 'checkin', label: 'Check-in' },
  { key: 'rides', label: 'Rides', ridesOnly: true },
  { key: 'comments', label: 'Comments' },
];

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { orgId } = useAuth();
  const { event, loading: eventLoading, refetch } = useEventDetail(id);
  const teamId = event?.team_id || null;
  const { rsvps, roster, loading: rsvpLoading, setRsvp } = useRsvps(id, teamId);
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState('details');

  if (eventLoading) return <div style={{ padding: 24, color: 'var(--sf-text-tertiary)' }}>Loading...</div>;
  if (!event) return <div style={{ padding: 24, color: 'var(--sf-text-tertiary)' }}>Event not found</div>;

  const team = event.teams;
  const teamColor = team?.team_color || 'var(--sf-text-tertiary)';
  const typeLabel = TYPE_LABELS[event.event_type] || event.event_type;

  const rsvpMap = {};
  rsvps.forEach((r) => { rsvpMap[r.player_id] = r.response; });

  const onDelete = async () => {
    if (!window.confirm("Delete this event? This can't be undone.")) return;
    const { error } = await supabase.from('events').delete().eq('id', event.id);
    if (error) { window.alert(`Delete failed: ${error.message}`); return; }
    navigate('/schedule');
  };

  return (
    <div style={{ backgroundColor: 'var(--sf-bg-page)', minHeight: '100vh' }}>
      <div style={{
        backgroundColor: teamColor, padding: '0 8px 16px 4px',
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button type="button" onClick={() => navigate(-1)} className="sf-press"
            style={{ minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={20} strokeWidth={1.75} color="var(--sf-text-inverse)" />
          </button>
          <div style={{ display: 'flex', gap: 4 }}>
            <button type="button" onClick={() => setEditing(true)} className="sf-press" aria-label="Edit event"
              style={{ minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Pencil size={20} strokeWidth={1.75} color="var(--sf-text-inverse)" />
            </button>
            <button type="button" onClick={onDelete} className="sf-press" aria-label="Delete event"
              style={{ minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trash2 size={20} strokeWidth={1.75} color="var(--sf-text-inverse)" />
            </button>
          </div>
        </div>
        <div style={{ padding: '0 12px', marginTop: 4 }}>
          <span style={{
            fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.85)',
            backgroundColor: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: 6,
          }}>{typeLabel}</span>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--sf-text-inverse)', margin: '12px 0 0 0' }}>
            {event.title || typeLabel}
          </h1>
          {team && <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>{team.name}</div>}
        </div>
      </div>

      <div className="flex sf-no-scrollbar" style={{
        overflowX: 'auto',
        borderBottom: '1px solid var(--sf-border-default)',
        backgroundColor: 'var(--sf-bg-card)',
      }}>
        {ALL_TABS.filter((t) => !t.ridesOnly || event.enable_rides).map((t) => {
          const active = tab === t.key;
          return (
            <button key={t.key} type="button" onClick={() => setTab(t.key)}
              className="sf-press"
              style={{
                flex: 1, minWidth: 80, minHeight: 44,
                padding: '0 12px', fontSize: 13, fontWeight: active ? 600 : 500,
                backgroundColor: 'transparent', border: 'none',
                color: active ? teamColor : 'var(--sf-text-tertiary)',
                borderBottom: active ? `2px solid ${teamColor}` : '2px solid transparent',
                marginBottom: -1,
              }}>
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'details' && <EventDetailTab event={event} />}
      {tab === 'location' && <EventLocationTab event={event} />}
      {tab === 'rsvps' && (
        <EventRsvpTab
          roster={roster} rsvps={rsvps} rsvpMap={rsvpMap}
          teamColor={teamColor} onSetRsvp={setRsvp} loading={rsvpLoading}
        />
      )}
      {tab === 'duties' && <EventDutiesTab eventId={event.id} />}
      {tab === 'checkin' && <EventCheckinTab eventId={event.id} roster={roster} teamColor={teamColor} />}
      {tab === 'rides' && event.enable_rides && <EventRidesTab eventId={event.id} />}
      {tab === 'comments' && <EventCommentsTab eventId={event.id} />}

      {editing && (
        <CreateActivityWizard
          orgId={orgId} editEvent={event}
          onClose={() => setEditing(false)} onCreated={refetch}
        />
      )}
    </div>
  );
}
