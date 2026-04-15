import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2, UserCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useEventDetail } from '../hooks/useEventDetail';
import { useRsvps } from '../hooks/useRsvps';
import { TYPE_LABELS } from '../lib/constants';
import EventDetailTab from '../components/event/EventDetailTab';
import EventRsvpTab from '../components/event/EventRsvpTab';
import EventCheckinTab from '../components/event/EventCheckinTab';
import EventDutiesTab from '../components/event/EventDutiesTab';
import EventCommentsTab from '../components/event/EventCommentsTab';
import EventRidesTab from '../components/event/EventRidesTab';
import EventNotes from '../components/event/EventNotes';
import CreateActivityWizard from '../components/wizard/CreateActivityWizard';
import ConfirmDialog from '../components/shared/ConfirmDialog';

const SectionHeader = ({ children }) => (
  <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--sf-text-primary)', padding: '0 16px', marginTop: 16, marginBottom: 8 }}>{children}</h2>
);

const iconBtn = { minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' };

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { orgId, role } = useAuth();
  const { showToast } = useToast();
  const { event, loading: eventLoading, refetch } = useEventDetail(id);
  const teamId = event?.team_id || null;
  const { rsvps, roster, loading: rsvpLoading, setRsvp } = useRsvps(id, teamId);
  const [editing, setEditing] = useState(false);
  const [editMode, setEditMode] = useState('single');
  const [confirmDel, setConfirmDel] = useState(false);
  const [showCheckin, setShowCheckin] = useState(false);
  const [dutyCount, setDutyCount] = useState(0);

  useEffect(() => {
    if (!id) return;
    supabase.from('event_duties').select('id', { count: 'exact', head: true }).eq('event_id', id)
      .then(({ count }) => setDutyCount(count || 0));
  }, [id]);

  if (eventLoading) return <div style={{ padding: 24, color: 'var(--sf-text-tertiary)' }}>Loading...</div>;
  if (!event) return <div style={{ padding: 24, color: 'var(--sf-text-tertiary)' }}>Event not found</div>;

  const team = event.teams;
  const teamColor = team?.team_color || 'var(--sf-text-tertiary)';
  const typeLabel = TYPE_LABELS[event.event_type] || event.event_type;
  const isStaff = role === 'admin' || role === 'coach';

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

  return (
    <div style={{ backgroundColor: 'var(--sf-bg-page)', minHeight: '100vh' }}>
      <div style={{ backgroundColor: teamColor, padding: '0 8px 16px 4px', paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button type="button" onClick={() => navigate(-1)} className="sf-press" style={iconBtn}>
            <ArrowLeft size={20} strokeWidth={1.75} color="var(--sf-text-inverse)" />
          </button>
          <div style={{ display: 'flex', gap: 4 }}>
            {isStaff && (
              <button type="button" onClick={() => setShowCheckin(true)} className="sf-press" aria-label="Take attendance" style={iconBtn}>
                <UserCheck size={20} strokeWidth={1.75} color="var(--sf-text-inverse)" />
              </button>
            )}
            <button type="button" onClick={openEdit} className="sf-press" aria-label="Edit event" style={iconBtn}>
              <Pencil size={20} strokeWidth={1.75} color="var(--sf-text-inverse)" />
            </button>
            <button type="button" onClick={() => setConfirmDel(true)} className="sf-press" aria-label="Delete event" style={iconBtn}>
              <Trash2 size={20} strokeWidth={1.75} color="var(--sf-text-inverse)" />
            </button>
          </div>
        </div>
        <div style={{ padding: '0 12px', marginTop: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.85)', backgroundColor: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: 6 }}>{typeLabel}</span>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--sf-text-inverse)', margin: '12px 0 0 0' }}>
            {event.title || typeLabel}
          </h1>
          {team && <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>{team.name}</div>}
        </div>
      </div>

      <EventDetailTab event={event} />

      <SectionHeader>RSVPs</SectionHeader>
      <EventRsvpTab roster={roster} rsvps={rsvps} rsvpMap={rsvpMap} teamColor={teamColor} onSetRsvp={setRsvp} loading={rsvpLoading} />

      {dutyCount > 0 && (<><SectionHeader>Duties</SectionHeader><EventDutiesTab eventId={event.id} /></>)}

      {event.enable_rides && (<><SectionHeader>Rides</SectionHeader><EventRidesTab eventId={event.id} eventDate={event.start_at?.slice(0, 10)} /></>)}

      {(event.notes || event.coach_notes) && (
        <><SectionHeader>Notes</SectionHeader><EventNotes notes={event.notes} coachNotes={event.coach_notes} /></>
      )}

      <SectionHeader>Comments</SectionHeader>
      <EventCommentsTab eventId={event.id} />

      {editing && (
        <CreateActivityWizard orgId={orgId} editEvent={event} editMode={editMode} onClose={() => setEditing(false)} onCreated={refetch} />
      )}
      {showCheckin && createPortal(
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'var(--sf-bg-page)', zIndex: 9999, display: 'flex', flexDirection: 'column', paddingTop: 'env(safe-area-inset-top, 0px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 4px', borderBottom: '1px solid var(--sf-border-default)', backgroundColor: 'var(--sf-bg-card)' }}>
            <button type="button" onClick={() => setShowCheckin(false)} className="sf-press" style={iconBtn}>
              <ArrowLeft size={20} strokeWidth={1.75} color="var(--sf-text-primary)" />
            </button>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--sf-text-primary)' }}>Take Attendance</h2>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <EventCheckinTab eventId={event.id} roster={roster} teamColor={teamColor} />
          </div>
        </div>,
        document.body,
      )}
      <ConfirmDialog open={confirmDel} title="Delete this event?" message="This can't be undone." confirmLabel="Delete" destructive onCancel={() => setConfirmDel(false)} onConfirm={doDelete} />
    </div>
  );
}
