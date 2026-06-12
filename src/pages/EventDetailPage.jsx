import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Repeat } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import { useEventDetail } from '../hooks/useEventDetail';
import { useRsvps } from '../hooks/useRsvps';
import { useEventActivations } from '../hooks/useEventActivations';
import useEventDelete from '../hooks/useEventDelete';
import { useRefetchOnVisible } from '../hooks/useRefetchOnVisible';
import EventDetailHeader from '../components/event/EventDetailHeader';
import EventDetailHero from '../components/event/EventDetailHero';
import EventLocationSlot from '../components/event/EventLocationSlot';
import EventRsvpTab from '../components/event/EventRsvpTab';
import EventDutiesTab from '../components/event/EventDutiesTab';
import EventCommentsTab from '../components/event/EventCommentsTab';
import EventRidesTab from '../components/event/EventRidesTab';
import EventNotes from '../components/event/EventNotes';
import { useToast } from '../context/useToast';
import EventRosterLockSection from '../components/event/EventRosterLockSection';
import AcademyCallupPicker from '../components/event/AcademyCallupPicker';
import { useEventRosterLock } from '../hooks/useEventRosterLock';
import GameDayMode from '../components/event/GameDayMode';
import EventBriefingHistory from '../components/event/EventBriefingHistory';
import ScopeChoiceDialog from '../components/event/ScopeChoiceDialog';
import CollapsibleSection from '../components/shared/CollapsibleSection';
import { composeFromEvent } from '../lib/briefings/composeFromEvent';
import { eventTimeState, isRsvpOpen } from '../lib/eventWindows';
const EventCheckinOverlay = lazy(() => import('../components/event/EventCheckinOverlay'));
const CreateActivityWizard = lazy(() => import('../components/wizard/CreateActivityWizard'));
const ScheduleChangeComposer = lazy(() => import('../components/event/ScheduleChangeComposer'));
const ScoreEntrySheet = lazy(() => import('../components/scoring/ScoreEntrySheet'));
const FinalizedGameView = lazy(() => import('../components/livescore/FinalizedGameView'));

export default function EventDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { orgId, role, user, myChildren } = useAuth();
  const { showToast } = useToast();
  const { event, loading: eventLoading, refetch, patchEvent } = useEventDetail(id, location.state?.event);
  const teamId = event?.team_id || null;
  // SD-11: staff edits stay possible post-start on THIS surface only; they audit-log per §16.8.
  const { rsvps, roster, auditMap, loading: rsvpLoading, setRsvp, saveNote, refetch: refetchRsvps } = useRsvps(id, teamId,
    { startAt: event?.start_at, isStaff: role === 'admin' || role === 'coach', actorUserId: user?.id, actorName: user?.user_metadata?.full_name || user?.email || null });
  const refetchAll = useCallback(() => { refetch(); refetchRsvps(); }, [refetch, refetchRsvps]);
  useRefetchOnVisible(refetchAll);
  const [editing, setEditing] = useState(false);
  const [editMode, setEditMode] = useState('instance');
  const [showCheckin, setShowCheckin] = useState(false);
  const [showScoreSheet, setShowScoreSheet] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [dutyCount, setDutyCount] = useState(0);
  const [pendingDiff, setPendingDiff] = useState(null);

  useEffect(() => {
    if (!id) return;
    supabase.from('event_duties').select('id', { count: 'exact', head: true }).eq('event_id', id)
      .then(({ count, error }) => {
        if (error) console.error('EventDetailPage dutyCount:', error.message);
        setDutyCount(count || 0);
      });
  }, [id]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (!tab) return;
    if (tab === 'rsvps' && (rsvpLoading || roster.length === 0)) return;
    const el = document.querySelector(`[data-section="${tab}"]`);
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  }, [searchParams, rsvpLoading, roster.length]);
  const { requestDelete, pendingDelete, confirmDelete, cancelDelete } = useEventDelete(event);
  // Hooks must run on every render; gate the inner fetch on `enabled` instead.
  const isStaff = role === 'admin' || role === 'coach';
  const isGameType = event?.event_type === 'game' || event?.event_type === 'tournament';
  const isPast = event ? eventTimeState(event) === 'completed' : false; // SD-2 spine (was a 4h inline fallback — divergent def #3)
  const canActivateAcademy = isStaff && isGameType && !isPast;
  const { activatedSet, toggle: toggleActivation } = useEventActivations(event?.id, canActivateAcademy);
  const lock = useEventRosterLock(event?.id);

  if (eventLoading) return <div style={{ backgroundColor: 'var(--as-bg-page)', minHeight: '100vh' }}><EventDetailHero.Skeleton /></div>;
  if (!event) return <div style={{ backgroundColor: 'var(--as-bg-page)', minHeight: '100vh', padding: 24, color: 'var(--as-text-tertiary)' }}>Event not found.</div>;
  const team = event.teams;
  const teamColor = team?.team_color || 'var(--as-text-tertiary)';
  const rsvpMap = {};
  rsvps.forEach((r) => { rsvpMap[r.player_id] = r.response; });

  const openEdit = () => {
    if (event.parent_event_id) {
      setConfirmAction({ type: 'editScopeChoice' });
    } else {
      setEditMode('instance');
      setEditing(true);
    }
  };
  const onWizardCreated = (diff) => { refetch(); if (diff) setPendingDiff(diff); };
  const setEventStatus = async (status) => {
    const { error } = await supabase.from('events').update({ status }).eq('id', event.id);
    if (error) { showToast(status === 'cancelled' ? "Couldn't cancel. Try again?" : "Couldn't reinstate. Try again?", 'error'); return; }
    patchEvent({ status }); refetch();
  };

  return (
    <div style={{ backgroundColor: 'var(--as-bg-page)', minHeight: '100vh' }}>
      <EventDetailHeader event={event} team={team} isStaff={isStaff} onEdit={openEdit} onDelete={requestDelete} onCheckin={() => setShowCheckin(true)} onCancel={() => setEventStatus('cancelled')} onReinstate={() => setEventStatus('scheduled')} />
      <EventDetailHero event={event} isStaff={isStaff} isPast={isPast} rsvps={rsvps} roster={roster} onEnterScore={() => setShowScoreSheet(true)} onLockRoster={() => document.querySelector('[data-section="lock-roster"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} onNotify={() => navigate(composeFromEvent(event, isPast, { intent: 'notify' }))} onRsvpChange={refetchRsvps} />
      {isStaff && <GameDayMode event={event} isStaff={isStaff} isGameType={isGameType} />}
      {isGameType && <Suspense fallback={null}><FinalizedGameView event={event} /></Suspense>}
      {isStaff && !isPast && <div data-section="lock-roster"><EventRosterLockSection event={event} isStaff={isStaff} rsvps={rsvps} roster={roster} onChange={refetchAll} /></div>}
      {event.parent_event_id && (
        <div style={{ padding: '6px 16px', fontSize: 13, color: 'var(--as-text-tertiary)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Repeat size={12} strokeWidth={1.75} /> Part of a recurring series
          {isStaff && <button type="button" onClick={() => setConfirmAction({ type: 'removeSeries' })} style={{ fontSize: 13, color: 'var(--as-accent)', background: 'none', border: 'none', padding: 0, marginLeft: 'auto' }}>Remove from series</button>}
        </div>
      )}

      <EventLocationSlot role={role} event={event} teamId={teamId} myChildren={myChildren} rsvps={rsvps} />
      <CollapsibleSection title="Rides" sectionKey="rides" defaultOpen={false}>
        <EventRidesTab event={event} />
      </CollapsibleSection>
      <CollapsibleSection title="RSVPs" sectionKey="rsvps" defaultOpen={false} count={`${rsvps.filter((r) => r.response === 'going').length}/${roster.length}`}>
        <EventRsvpTab roster={roster} rsvps={rsvps} rsvpMap={rsvpMap} teamColor={teamColor} onSetRsvp={setRsvp} onSaveNote={saveNote} loading={rsvpLoading} readOnly={isStaff ? false : !isRsvpOpen(event.start_at)} overrideActive={isStaff && !isRsvpOpen(event.start_at)} auditMap={auditMap} canActivateAcademy={canActivateAcademy} activatedSet={activatedSet} onToggleActivation={toggleActivation} />
      </CollapsibleSection>
      {isStaff && isGameType && teamId && !isPast && <CollapsibleSection title="Academy call-ups" sectionKey="academy-callups" defaultOpen={false}><AcademyCallupPicker event={event} team={team} isStaff={isStaff} isLocked={lock.isLocked} academyCallupPlayerIds={lock.academyCallupPlayerIds} addCallup={lock.addCallup} removeCallup={lock.removeCallup} /></CollapsibleSection>}
      {dutyCount > 0 && <CollapsibleSection title="Volunteers" sectionKey="duties" defaultOpen={false} count={`${dutyCount}`}><EventDutiesTab eventId={event.id} /></CollapsibleSection>}
      {(event.notes || event.coach_notes) && <CollapsibleSection title="Notes" sectionKey="notes" defaultOpen={false}><EventNotes notes={event.notes} coachNotes={event.coach_notes} /></CollapsibleSection>}
      <CollapsibleSection title="Comments" sectionKey="comments" defaultOpen={false}><EventCommentsTab eventId={event.id} /></CollapsibleSection>
      {isStaff && <CollapsibleSection title="Briefings" sectionKey="briefings" defaultOpen={false}><EventBriefingHistory event={event} /></CollapsibleSection>}


      {editing && <Suspense fallback={null}><CreateActivityWizard orgId={orgId} editEvent={event} editMode={editMode} onClose={() => setEditing(false)} onCreated={onWizardCreated} /></Suspense>}
      {pendingDiff && <Suspense fallback={null}><ScheduleChangeComposer event={event} diff={pendingDiff} onClose={() => setPendingDiff(null)} onDone={refetch} /></Suspense>}
      {showCheckin && <Suspense fallback={null}><EventCheckinOverlay eventId={event.id} roster={roster} teamColor={teamColor} onClose={() => setShowCheckin(false)} /></Suspense>}
      {showScoreSheet && <Suspense fallback={null}><ScoreEntrySheet event={event} team={team} onClose={() => setShowScoreSheet(false)} /></Suspense>}
      {confirmAction?.type === 'editScopeChoice' && (
        <ScopeChoiceDialog event={event} onChoose={(scope) => { setConfirmAction(null); setEditMode(scope); setEditing(true); }} onCancel={() => setConfirmAction(null)} />
      )}
      {confirmAction?.type === 'removeSeries' && <ConfirmDialog title="Remove from series" message="This event will become standalone." confirmLabel="Remove" onConfirm={async () => { setConfirmAction(null); await supabase.from('events').update({ parent_event_id: null }).eq('id', event.id); patchEvent({ parent_event_id: null }); refetch(); }} onCancel={() => setConfirmAction(null)} />}
      {pendingDelete?.type === 'series' && (
        <ConfirmDialog title="Delete Recurring Event" message="Delete all future events in this series, or just this one?" confirmLabel="All future" cancelLabel="Just this one" destructive onConfirm={() => confirmDelete('allFuture')} onCancel={() => confirmDelete('single')} />
      )}
      {pendingDelete?.type === 'single' && (
        <ConfirmDialog title="Delete Event" message="Delete this event?" confirmLabel="Delete" destructive onConfirm={() => confirmDelete('single')} onCancel={cancelDelete} />
      )}
    </div>
  );
}
