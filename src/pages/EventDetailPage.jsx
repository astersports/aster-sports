import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Calendar } from 'lucide-react';
import { useEventDetail } from '../hooks/useEventDetail';
import { useRsvps } from '../hooks/useRsvps';
import RsvpSummary from '../components/rsvp/RsvpSummary';
import RsvpPlayerRow from '../components/rsvp/RsvpPlayerRow';

const TYPE_LABELS = {
  practice: 'Practice', game: 'Game', skills_lab: 'Skills Lab',
  tryout: 'Tryout', tournament: 'Tournament', other: 'Event',
};

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { event, loading: eventLoading } = useEventDetail(id);
  const teamId = event?.team_id || null;
  const { rsvps, roster, loading: rsvpLoading, setRsvp } = useRsvps(id, teamId);

  if (eventLoading) return <div style={{ padding: 24, color: 'var(--sf-text-tertiary)' }}>Loading...</div>;
  if (!event) return <div style={{ padding: 24, color: 'var(--sf-text-tertiary)' }}>Event not found</div>;

  const team = event.teams;
  const teamColor = team?.team_color || 'var(--sf-text-tertiary)';
  const typeLabel = TYPE_LABELS[event.event_type] || event.event_type;
  const date = event.start_at ? new Date(event.start_at) : null;
  const endDate = event.end_at ? new Date(event.end_at) : null;

  const fmt = (d) => d?.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const fmtTime = (d) => d?.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  const rsvpMap = {};
  rsvps.forEach((r) => { rsvpMap[r.player_id] = r.response; });

  return (
    <div style={{ backgroundColor: 'var(--sf-bg-page)', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        backgroundColor: teamColor, padding: '0 16px',
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)',
        paddingBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <button type="button" onClick={() => navigate(-1)} className="sf-press"
            style={{ minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={20} strokeWidth={1.75} color="var(--sf-text-inverse)" />
          </button>
          <span style={{
            fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.85)',
            backgroundColor: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: 6,
          }}>{typeLabel}</span>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--sf-text-inverse)', margin: 0 }}>
          {event.title || typeLabel}
        </h1>
        {team && <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>{team.name}</div>}
      </div>

      {/* Info section */}
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {date && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--sf-text-primary)' }}>
            <Calendar size={16} strokeWidth={1.75} color="var(--sf-text-tertiary)" />
            <span>{fmt(date)}{endDate ? ` · ${fmtTime(date)} – ${fmtTime(endDate)}` : ''}</span>
          </div>
        )}
        {event.location && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--sf-text-primary)' }}>
            <MapPin size={16} strokeWidth={1.75} color="var(--sf-text-tertiary)" />
            <span>{event.location}{event.sub_location ? ` · ${event.sub_location}` : ''}</span>
          </div>
        )}
        {event.arrival_minutes_before > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--sf-text-secondary)' }}>
            <Clock size={16} strokeWidth={1.75} color="var(--sf-text-tertiary)" />
            <span>Arrive {event.arrival_minutes_before} min early</span>
          </div>
        )}
        {event.opponent && (
          <div style={{
            fontSize: 15, fontWeight: 600, color: 'var(--sf-text-primary)',
            padding: '8px 12px', backgroundColor: 'var(--sf-bg-secondary)', borderRadius: 10,
          }}>
            vs. {event.opponent} · {(event.home_away || 'tbd').toUpperCase()}
          </div>
        )}
        {event.jersey && (
          <div style={{ fontSize: 13, color: 'var(--sf-text-secondary)' }}>Jersey: {event.jersey}</div>
        )}
      </div>

      {/* Notes */}
      {event.notes && (
        <div style={{ padding: '0 16px 16px', fontSize: 14, color: 'var(--sf-text-secondary)' }}>
          <div style={{ fontWeight: 500, color: 'var(--sf-text-primary)', marginBottom: 4, fontSize: 13 }}>Parent instructions</div>
          {event.notes}
        </div>
      )}
      {event.coach_notes && (
        <div style={{ padding: '0 16px 16px', fontSize: 14, color: 'var(--sf-text-secondary)' }}>
          <div style={{ fontWeight: 500, color: 'var(--sf-warning)', marginBottom: 4, fontSize: 13 }}>Coach notes (not visible to parents)</div>
          {event.coach_notes}
        </div>
      )}

      {/* RSVP section */}
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
    </div>
  );
}
