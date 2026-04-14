import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useEventDetail } from '../hooks/useEventDetail';
import { useRsvps } from '../hooks/useRsvps';
import EventInfo from '../components/event/EventInfo';
import RsvpSummary from '../components/rsvp/RsvpSummary';
import RsvpPlayerRow from '../components/rsvp/RsvpPlayerRow';
import CreateActivityWizard from '../components/wizard/CreateActivityWizard';

const TYPE_LABELS = {
  practice: 'Practice', game: 'Game', skills_lab: 'Skills Lab',
  tryout: 'Tryout', tournament: 'Tournament', other: 'Event',
};

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { orgId } = useAuth();
  const { event, loading: eventLoading, refetch } = useEventDetail(id);
  const teamId = event?.team_id || null;
  const { rsvps, roster, loading: rsvpLoading, setRsvp } = useRsvps(id, teamId);
  const [editing, setEditing] = useState(false);

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

      <EventInfo event={event} />

      <div style={{ padding: '0 16px 32px' }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--sf-text-primary)', marginBottom: 12 }}>RSVPs</h2>
        {rsvpLoading ? (
          <div style={{ color: 'var(--sf-text-tertiary)', fontSize: 14 }}>Loading roster...</div>
        ) : roster.length === 0 ? (
          <div style={{ color: 'var(--sf-text-tertiary)', fontSize: 14 }}>No players on this team yet.</div>
        ) : (
          <>
            <RsvpSummary roster={roster} rsvps={rsvps} />
            {roster.map((player) => (
              <RsvpPlayerRow
                key={player.id}
                player={player}
                response={rsvpMap[player.id] || null}
                teamColor={teamColor}
                onSetRsvp={setRsvp}
              />
            ))}
          </>
        )}
      </div>

      {editing && (
        <CreateActivityWizard
          orgId={orgId}
          editEvent={event}
          onClose={() => setEditing(false)}
          onCreated={refetch}
        />
      )}
    </div>
  );
}
