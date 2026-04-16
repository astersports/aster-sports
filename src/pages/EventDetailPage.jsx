import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useEventDetail } from '../hooks/useEventDetail';
import { useRsvps } from '../hooks/useRsvps';
import EventDetailHeader from '../components/event/EventDetailHeader';
import EventDetailTab from '../components/event/EventDetailTab';
import EventLocationTab from '../components/event/EventLocationTab';
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
  const { rsvps, roster, loading: rsvpLoading, setRsvp, saveNote } = useRsvps(id, teamId);
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
      <EventDetailHeader event={event} team={team} isStaff={isStaff} onEdit={openEdit} onDelete={() => setConfirmDel(true)} onCheckin={() => setShowCheckin(true)} />

      <EventDetailTab event={event} />

      {(event.location || event.location_address) && (
        <><SectionHeader>Location</SectionHeader><EventLocationTab event={event} /></>
      )}

      <SectionHeader>RSVPs</SectionHeader>
      <EventRsvpTab roster={roster} rsvps={rsvps} rsvpMap={rsvpMap} teamColor={teamColor} onSetRsvp={setRsvp} onSaveNote={saveNote} loading={rsvpLoading} />

      {dutyCount > 0 && (<><SectionHeader>Duties</SectionHeader><EventDutiesTab eventId={event.id} /></>)}

      {event.enable_rides && (<><SectionHeader>Rides</SectionHeader><EventRidesTab eventId={event.id} eventStartAt={event.start_at} eventLocation={event.location} eventEndAt={event.end_at} /></>)}

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
