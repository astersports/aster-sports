import { lazy, Suspense, useEffect, useState } from 'react';
import { useParams, useSearchParams, useLocation } from 'react-router-dom';
import { Repeat } from 'lucide-react';
import { supabase } from '../lib/supabase';
import AddToCalendarButton from '../components/event/AddToCalendarButton';
import { useAuth } from '../context/AuthContext';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import { useEventDetail } from '../hooks/useEventDetail';
import { useRsvps } from '../hooks/useRsvps';
import useEventDelete from '../hooks/useEventDelete';
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
import Button from '../components/shared/Button';
const EventCheckinOverlay = lazy(() => import('../components/event/EventCheckinOverlay'));
const CreateActivityWizard = lazy(() => import('../components/wizard/CreateActivityWizard'));
const ScoreEntrySheet = lazy(() => import('../components/scoring/ScoreEntrySheet'));

const SectionHeader = ({ children, sectionKey }) => (
  <h2 data-section={sectionKey} style={{ fontSize: 17, fontWeight: 700, color: 'var(--em-text-primary)', padding: '0 16px', marginTop: 16, marginBottom: 8 }}>{children}</h2>
);

export default function EventDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { orgId, role } = useAuth();
  const { event, loading: eventLoading, refetch, patchEvent } = useEventDetail(id, location.state?.event);
  const teamId = event?.team_id || null;
  const { rsvps, roster, loading: rsvpLoading, setRsvp, saveNote } = useRsvps(id, teamId);
  const [editing, setEditing] = useState(false);
  const [editMode, setEditMode] = useState('single');
  const [showCheckin, setShowCheckin] = useState(false);
  const [showScoreSheet, setShowScoreSheet] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [dutyCount, setDutyCount] = useState(0);

  useEffect(() => {
    if (!id) return;
    supabase.from('event_duties').select('id', { count: 'exact', head: true }).eq('event_id', id)
      .then(({ count }) => setDutyCount(count || 0));
  }, [id]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (!tab) return;
    if (tab === 'rsvps' && (rsvpLoading || roster.length === 0)) return;
    const el = document.querySelector(`[data-section="${tab}"]`);
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  }, [searchParams, rsvpLoading, roster.length]);

  const { requestDelete, pendingDelete, confirmDelete, cancelDelete } = useEventDelete(event);

  if (eventLoading) return <div style={{ backgroundColor: 'var(--em-bg-page)', minHeight: '100dvh' }} />;
  if (!event) return <div style={{ backgroundColor: 'var(--em-bg-page)', minHeight: '100dvh', padding: 24, color: 'var(--em-text-tertiary)' }}>We couldn't find this event. It may have been removed.</div>;

  const team = event.teams;
  const teamColor = team?.team_color || 'var(--em-text-tertiary)';
  const isStaff = role === 'admin' || role === 'coach';

  const rsvpMap = {};
  rsvps.forEach((r) => { rsvpMap[r.player_id] = r.response; });
  const isPastGame = isStaff && (event.event_type === 'game' || event.event_type === 'tournament') && new Date(event.start_at) < new Date();

  const openEdit = () => {
    if (event.parent_event_id) {
      setConfirmAction({ type: 'editSeries' });
    } else {
      setEditMode('single');
      setEditing(true);
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--em-bg-page)', minHeight: '100vh' }}>
      <EventDetailHeader event={event} team={team} isStaff={isStaff} onEdit={openEdit} onDelete={requestDelete} onCheckin={() => setShowCheckin(true)} />
      {isPastGame && (
        <Button variant="secondary" onClick={() => setShowScoreSheet(true)} style={{ width: 'calc(100% - 32px)', margin: '12px 16px', backgroundColor: 'var(--em-accent-soft)' }}>
          Enter Score
        </Button>
      )}
      <TournamentBriefingBanner event={event} team={team} role={role} />

      {event.parent_event_id && (
        <div style={{ padding: '6px 16px', fontSize: 13, color: 'var(--em-text-tertiary)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Repeat size={12} strokeWidth={1.75} />
          Part of a recurring series
          <button type="button" onClick={() => setConfirmAction({ type: 'removeSeries' })} style={{ fontSize: 13, color: 'var(--em-accent)', background: 'none', border: 'none', padding: 0, marginLeft: 'auto' }}>
            Remove from series
          </button>
        </div>
      )}

      <EventDetailTab event={event} />

      <SectionHeader>Location</SectionHeader>
      <EventLocationTab event={event} />

      <SectionHeader sectionKey="rsvps">RSVPs</SectionHeader>
      <EventRsvpTab roster={roster} rsvps={rsvps} rsvpMap={rsvpMap} teamColor={teamColor} onSetRsvp={setRsvp} onSaveNote={saveNote} loading={rsvpLoading} />

      {dutyCount > 0 && (<><SectionHeader sectionKey="duties">Volunteers</SectionHeader><EventDutiesTab eventId={event.id} /></>)}

      <SectionHeader sectionKey="rides">Rides</SectionHeader>
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
      {showScoreSheet && <Suspense fallback={null}><ScoreEntrySheet event={event} team={team} onClose={() => setShowScoreSheet(false)} /></Suspense>}
      {confirmAction?.type === 'editSeries' && (
        <ConfirmDialog title="Edit recurring event" message="Edit all future events in this series, or just this one?" confirmLabel="All future" cancelLabel="This one only" onConfirm={() => { setConfirmAction(null); setEditMode('series'); setEditing(true); }} onCancel={() => { setConfirmAction(null); setEditMode('single'); setEditing(true); }} />
      )}
      {confirmAction?.type === 'removeSeries' && (
        <ConfirmDialog title="Remove from series" message="This event will become standalone and no longer be part of the recurring series." confirmLabel="Remove" onConfirm={async () => { setConfirmAction(null); await supabase.from('events').update({ parent_event_id: null }).eq('id', event.id); patchEvent({ parent_event_id: null }); refetch(); }} onCancel={() => setConfirmAction(null)} />
      )}
      {pendingDelete?.type === 'series' && (
        <ConfirmDialog title="Delete Recurring Event" message="Delete all future events in this series, or just this one?" confirmLabel="All future" cancelLabel="Just this one" destructive onConfirm={() => confirmDelete('allFuture')} onCancel={() => confirmDelete('single')} />
      )}
      {pendingDelete?.type === 'single' && (
        <ConfirmDialog title="Delete Event" message="Delete this event?" confirmLabel="Delete" destructive onConfirm={() => confirmDelete('single')} onCancel={cancelDelete} />
      )}
    </div>
  );
}
