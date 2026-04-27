import { lazy, Suspense, useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Repeat } from 'lucide-react';
import { supabase } from '../lib/supabase';
import AddToCalendarButton from '../components/event/AddToCalendarButton';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/useToast';
import { useEventDetail } from '../hooks/useEventDetail';
import { useRsvps } from '../hooks/useRsvps';
import EventDetailHeader from '../components/event/EventDetailHeader';
import EventDetailTab from '../components/event/EventDetailTab';
import EventLocationTab from '../components/event/EventLocationTab';
import EventRsvpTab from '../components/event/EventRsvpTab';
import EventDutiesTab from '../components/event/EventDutiesTab';
import EventCommentsTab from '../components/event/EventCommentsTab';
import EventRidesTab from '../components/event/EventRidesTab';
import EventNotes from '../components/event/EventNotes';
import EventCancelActions from '../components/event/EventCancelActions';
import TournamentBriefingBanner from '../components/event/TournamentBriefingBanner';
const EventCheckinOverlay = lazy(() => import('../components/event/EventCheckinOverlay'));
const CreateActivityWizard = lazy(() => import('../components/wizard/CreateActivityWizard'));

const SectionHeader = ({ children, sectionKey }) => (
  <h2 data-section={sectionKey} style={{ fontSize: 16, fontWeight: 700, color: 'var(--em-text-primary)', padding: '0 16px', marginTop: 16, marginBottom: 8 }}>{children}</h2>
);

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { orgId, role } = useAuth();
  const { showToast } = useToast();
  const { event, loading: eventLoading, refetch, patchEvent } = useEventDetail(id, location.state?.event);
  const teamId = event?.team_id || null;
  const { rsvps, roster, loading: rsvpLoading, setRsvp, saveNote } = useRsvps(id, teamId);
  const [editing, setEditing] = useState(false);
  const [editMode, setEditMode] = useState('single');
  const [showCheckin, setShowCheckin] = useState(false);
  const [dutyCount, setDutyCount] = useState(0);

  useEffect(() => {
    if (!id) return;
    supabase.from('event_duties').select('id', { count: 'exact', head: true }).eq('event_id', id)
      .then(({ count }) => setDutyCount(count || 0));
  }, [id]);

  useEffect(() => {
    if (searchParams.get('tab') === 'rsvps' && !rsvpLoading && roster.length > 0) {
      const el = document.querySelector('[data-section="rsvps"]');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
  }, [searchParams, rsvpLoading, roster.length]);

  if (eventLoading) return <div style={{ backgroundColor: 'var(--em-bg-page)', minHeight: '100dvh' }} />;
  if (!event) return <div style={{ backgroundColor: 'var(--em-bg-page)', minHeight: '100dvh', padding: 24, color: 'var(--em-text-tertiary)' }}>Event not found</div>;

  const team = event.teams;
  const teamColor = team?.team_color || 'var(--em-text-tertiary)';
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
    try {
      if (event.parent_event_id) {
        // Recurring: first ask about the whole series.
        if (window.confirm('Delete ALL future events in this series?\n\nOK = delete all future\nCancel = delete only this one')) {
          const { error: serErr } = await supabase.from('events').delete()
            .eq('parent_event_id', event.parent_event_id)
            .gte('start_at', event.start_at);
          if (serErr) throw serErr;
          await supabase.from('events').delete().eq('id', event.id);
        } else {
          if (!window.confirm('Delete just this one event?')) return;
          const { error } = await supabase.from('events').delete().eq('id', event.id);
          if (error) throw error;
        }
      } else {
        if (!window.confirm('Delete this event?')) return;
        const { error } = await supabase.from('events').delete().eq('id', event.id);
        if (error) throw error;
      }
      navigate('/schedule');
    } catch (err) {
      showToast(`Delete failed: ${err.message}`, 'error');
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--em-bg-page)', minHeight: '100vh' }}>
      <EventDetailHeader event={event} team={team} isStaff={isStaff} onEdit={openEdit} onDelete={doDelete} onCheckin={() => setShowCheckin(true)} />
      <TournamentBriefingBanner event={event} team={team} role={role} />

      {event.parent_event_id && (
        <div style={{ padding: '6px 16px', fontSize: 12, color: 'var(--em-text-tertiary)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Repeat size={12} strokeWidth={1.75} />
          Part of a recurring series
          <button type="button" onClick={async () => {
            if (!window.confirm('Remove this event from the series? It will become standalone.')) return;
            await supabase.from('events').update({ parent_event_id: null }).eq('id', event.id);
            patchEvent({ parent_event_id: null });
            refetch();
          }} style={{ fontSize: 12, color: 'var(--em-accent)', background: 'none', border: 'none', padding: 0, marginLeft: 'auto' }}>
            Remove from series
          </button>
        </div>
      )}

      <EventDetailTab event={event} />

      <SectionHeader>Location</SectionHeader>
      <EventLocationTab event={event} />

      <SectionHeader sectionKey="rsvps">RSVPs</SectionHeader>
      <EventRsvpTab roster={roster} rsvps={rsvps} rsvpMap={rsvpMap} teamColor={teamColor} onSetRsvp={setRsvp} onSaveNote={saveNote} loading={rsvpLoading} />

      {dutyCount > 0 && (<><SectionHeader>Volunteers</SectionHeader><EventDutiesTab eventId={event.id} /></>)}

      <SectionHeader>Rides</SectionHeader>
      <EventRidesTab event={event} />

      {(event.notes || event.coach_notes) && (
        <><SectionHeader>Notes</SectionHeader><EventNotes notes={event.notes} coachNotes={event.coach_notes} /></>
      )}

      <AddToCalendarButton event={event} />

      <SectionHeader>Comments</SectionHeader>
      <EventCommentsTab eventId={event.id} />

      {isStaff && <EventCancelActions event={event} onStatusChange={(status) => { patchEvent({ status }); refetch(); }} />}

      {editing && <Suspense fallback={null}><CreateActivityWizard orgId={orgId} editEvent={event} editMode={editMode} onClose={() => setEditing(false)} onCreated={refetch} /></Suspense>}
      {showCheckin && <Suspense fallback={null}><EventCheckinOverlay eventId={event.id} roster={roster} teamColor={teamColor} onClose={() => setShowCheckin(false)} /></Suspense>}
    </div>
  );
}
