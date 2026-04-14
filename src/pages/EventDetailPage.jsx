import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useEventDetail } from '../hooks/useEventDetail';
import { useRsvps } from '../hooks/useRsvps';
import { TYPE_LABELS } from '../lib/constants';
import EventDetailTab from '../components/event/EventDetailTab';
import EventLocationTab from '../components/event/EventLocationTab';
import EventRsvpTab from '../components/event/EventRsvpTab';
import EventCheckinTab from '../components/event/EventCheckinTab';
import EventDutiesTab from '../components/event/EventDutiesTab';
import EventCommentsTab from '../components/event/EventCommentsTab';
import EventRidesTab from '../components/event/EventRidesTab';
import CreateActivityWizard from '../components/wizard/CreateActivityWizard';
import ConfirmDialog from '../components/shared/ConfirmDialog';

const ALL_TABS = [
  { key: 'details', label: 'Details' }, { key: 'location', label: 'Location' },
  { key: 'rsvps', label: 'RSVPs' }, { key: 'duties', label: 'Duties' },
  { key: 'checkin', label: 'Check-in' },
  { key: 'rides', label: 'Rides', ridesOnly: true },
  { key: 'comments', label: 'Comments' },
];

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { orgId } = useAuth();
  const { showToast } = useToast();
  const { event, loading: eventLoading, refetch } = useEventDetail(id);
  const teamId = event?.team_id || null;
  const { rsvps, roster, loading: rsvpLoading, setRsvp } = useRsvps(id, teamId);
  const [editing, setEditing] = useState(false);
  const [editMode, setEditMode] = useState('single');
  const [confirmDel, setConfirmDel] = useState(false);
  const [tab, setTab] = useState('details');

  if (eventLoading) return <div style={{ padding: 24, color: 'var(--sf-text-tertiary)' }}>Loading...</div>;
  if (!event) return <div style={{ padding: 24, color: 'var(--sf-text-tertiary)' }}>Event not found</div>;

  const team = event.teams;
  const teamColor = team?.team_color || 'var(--sf-text-tertiary)';
  const typeLabel = TYPE_LABELS[event.event_type] || event.event_type;

  const rsvpMap = {};
  rsvps.forEach((r) => { rsvpMap[r.player_id] = r.response; });

  const openEdit = () => {
    if (event.parent_event_id) {
      const all = window.confirm('Edit all future events in this series?\n\nOK = all future\nCancel = this event only');
      setEditMode(all ? 'series' : 'single');
    } else {
      setEditMode('single');
    }
    setEditing(true);
  };

  const doDelete = async () => {
    setConfirmDel(false);
    const { error } = await supabase.from('events').delete().eq('id', event.id);
    if (error) { showToast(`Delete failed: ${error.message}`, 'error'); return; }
    navigate('/schedule');
  };

  const visibleTabs = ALL_TABS.filter((t) => !t.ridesOnly || event.enable_rides);

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
            <button type="button" onClick={openEdit} className="sf-press" aria-label="Edit event"
              style={{ minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Pencil size={20} strokeWidth={1.75} color="var(--sf-text-inverse)" />
            </button>
            <button type="button" onClick={() => setConfirmDel(true)} className="sf-press" aria-label="Delete event"
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
        {visibleTabs.map((t) => {
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

      <div style={{ display: tab === 'details' ? 'block' : 'none' }}><EventDetailTab event={event} /></div>
      <div style={{ display: tab === 'location' ? 'block' : 'none' }}><EventLocationTab event={event} /></div>
      <div style={{ display: tab === 'rsvps' ? 'block' : 'none' }}>
        <EventRsvpTab roster={roster} rsvps={rsvps} rsvpMap={rsvpMap} teamColor={teamColor} onSetRsvp={setRsvp} loading={rsvpLoading} />
      </div>
      <div style={{ display: tab === 'duties' ? 'block' : 'none' }}><EventDutiesTab eventId={event.id} /></div>
      <div style={{ display: tab === 'checkin' ? 'block' : 'none' }}><EventCheckinTab eventId={event.id} roster={roster} teamColor={teamColor} /></div>
      {event.enable_rides && <div style={{ display: tab === 'rides' ? 'block' : 'none' }}><EventRidesTab eventId={event.id} /></div>}
      <div style={{ display: tab === 'comments' ? 'block' : 'none' }}><EventCommentsTab eventId={event.id} /></div>

      {editing && (
        <CreateActivityWizard
          orgId={orgId} editEvent={event} editMode={editMode}
          onClose={() => setEditing(false)} onCreated={refetch}
        />
      )}
      <ConfirmDialog open={confirmDel} title="Delete this event?" message="This can't be undone."
        confirmLabel="Delete" destructive onCancel={() => setConfirmDel(false)} onConfirm={doDelete} />
    </div>
  );
}
