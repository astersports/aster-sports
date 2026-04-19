import { MapPin, Car, Repeat } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatTime } from '../../lib/formatters';
import { TYPE_LABELS } from '../../lib/constants';
import { useAuth } from '../../context/AuthContext';
import ChildRsvp from './ChildRsvp';

export default function EventCard({ event, rsvpCount, rideCount, dutyCount, stagger }) {
  const navigate = useNavigate();
  const { role, myChildren } = useAuth();
  const childrenOnTeam = (myChildren || []).filter((c) => c.teamId === event.team_id);
  const team = event.teams;
  const teamColor = team?.team_color || 'var(--sf-neutral)';
  const teamName = team?.name || '';
  const typeLabel = TYPE_LABELS[event.event_type] || event.event_type;
  const isCancelled = event.status === 'cancelled';
  const isPast = event.end_at ? new Date(event.end_at) < new Date() : false;
  const dimmed = isCancelled || isPast;
  const rawTitle = event.title || typeLabel;
  const alreadyPrefixed = rawTitle.startsWith('vs.') || rawTitle.startsWith('vs ') || rawTitle.startsWith('@ ') || rawTitle.startsWith('@');
  const titlePrefix = !alreadyPrefixed && (event.event_type === 'game' || event.event_type === 'tournament') && event.opponent
    ? (event.home_away === 'away' ? '@ ' : 'vs. ')
    : '';

  return (
    <div
      className={`sf-press ${dimmed ? '' : (stagger || '')}`}
      onClick={() => { navigator.vibrate?.(10); navigate(`/events/${event.id}`, { state: { event } }); }}
      style={{
        display: 'flex',
        alignItems: 'stretch',
        backgroundColor: (event.event_type === 'game' || event.event_type === 'tournament') ? 'rgba(74, 143, 212, 0.06)' : 'var(--sf-bg-card)',
        borderRadius: 10,
        border: '1px solid var(--sf-border-default)',
        boxShadow: 'var(--sf-shadow-sm)',
        overflow: 'hidden',
        opacity: dimmed ? 0.5 : 1,
        transition: 'box-shadow 150ms ease-out, transform 150ms ease-out, opacity 150ms ease-out',
      }}
    >
      <div style={{ width: 4, flexShrink: 0, backgroundColor: teamColor }} />
      <div style={{ flex: 1, padding: '10px 14px' }}>
        {/* Row 1: Time · Type + recurring + updated dot + cancelled */}
        <div style={{ marginBottom: 4, display: 'flex', alignItems: 'center' }}>
          <span className="font-bold" style={{ fontSize: 17, color: 'var(--sf-text-primary)' }}>
            {formatTime(event.start_time || '00:00')}
          </span>
          <span style={{ fontSize: 13, color: 'var(--sf-text-tertiary)', marginLeft: 6 }}>
            · {typeLabel}
          </span>
          {event.is_scrimmage && (
            <span style={{ fontSize: 11, color: 'var(--sf-text-tertiary)', marginLeft: 4 }}>
              Scrimmage
            </span>
          )}
          {event.parent_event_id && (
            <Repeat size={11} strokeWidth={1.75} color="var(--sf-text-tertiary)" style={{ marginLeft: 4 }} />
          )}
          {event.updated_at && (new Date(event.updated_at).getTime() > Date.now() - 86400000) && !isPast && !isCancelled && (
            <span style={{
              display: 'inline-block', width: 6, height: 6, borderRadius: 3,
              backgroundColor: 'var(--sf-info)', marginLeft: 6, verticalAlign: 'middle',
            }} />
          )}
          {isCancelled && (
            <span style={{
              fontSize: 11, fontWeight: 600, color: 'var(--sf-danger)',
              backgroundColor: 'var(--sf-danger-soft)', padding: '1px 6px',
              borderRadius: 4, marginLeft: 4, textTransform: 'uppercase',
            }}>
              Cancelled
            </span>
          )}
        </div>
        {/* Row 2: Title */}
        <div style={{ fontSize: 15, color: 'var(--sf-text-primary)', marginBottom: 2, textDecoration: isCancelled ? 'line-through' : 'none' }}>
          {titlePrefix}{rawTitle}
        </div>
        {/* Row 3: Team · pin Location */}
        {(teamName || event.location_name) && (
          <div className="flex items-center" style={{ fontSize: 13, gap: 4 }}>
            {teamName && <span style={{ color: teamColor, fontWeight: 500 }}>{teamName}</span>}
            {teamName && event.location_name && <span style={{ color: 'var(--sf-text-tertiary)' }}>·</span>}
            {event.location_name && (
              <>
                <MapPin size={12} strokeWidth={1.75} color="var(--sf-text-tertiary)" />
                <span style={{ color: 'var(--sf-text-tertiary)' }}>{event.location_name}</span>
              </>
            )}
          </div>
        )}
        {/* Row 3a: Notes excerpt */}
        {event.notes && (
          <div style={{ fontSize: 12, color: 'var(--sf-text-tertiary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {event.notes.length > 60 ? event.notes.slice(0, 60) + '...' : event.notes}
          </div>
        )}
        {/* Row 3b: Jersey color (games/tournaments when set) */}
        {event.jersey && (
          <div style={{ fontSize: 12, color: 'var(--sf-text-tertiary)', marginTop: 2 }}>
            {event.jersey} jersey
          </div>
        )}
        {/* Row 4: RSVP counts */}
        {rsvpCount && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, marginTop: 4, color: 'var(--sf-text-tertiary)' }}>
            <span style={{ color: 'var(--sf-success)' }}>{rsvpCount.going || 0}</span>
            <span>going</span>
            <span>·</span>
            <span style={{ color: 'var(--sf-danger)' }}>{rsvpCount.not_going || 0}</span>
            <span>out</span>
            <span>·</span>
            <span>{rsvpCount.noResponse || 0} no reply</span>
          </div>
        )}
        {/* Row 5: Ride counts */}
        {rideCount && (rideCount.offers > 0 || rideCount.requests > 0) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, marginTop: 4 }}>
            <Car size={12} strokeWidth={1.75} color={rideCount.urgent ? 'var(--sf-danger)' : rideCount.requests > 0 ? 'var(--sf-warning)' : 'var(--sf-text-tertiary)'} />
            {rideCount.offers > 0 && <span style={{ color: 'var(--sf-text-secondary)' }}>{rideCount.offers} seat{rideCount.offers !== 1 ? 's' : ''}</span>}
            {rideCount.offers > 0 && rideCount.requests > 0 && <span style={{ color: 'var(--sf-text-tertiary)' }}>·</span>}
            {rideCount.requests > 0 && (
              <span style={{ color: rideCount.urgent ? 'var(--sf-danger)' : 'var(--sf-warning)', fontWeight: 500 }}>
                {rideCount.urgent ? 'URGENT: ' : ''}{rideCount.requests} ride{rideCount.requests !== 1 ? 's' : ''} needed
              </span>
            )}
          </div>
        )}
        {/* Row 6: Volunteer counts */}
        {dutyCount && dutyCount.total > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, marginTop: 4, color: dutyCount.claimed < dutyCount.total ? 'var(--sf-warning)' : 'var(--sf-success)' }}>
            {dutyCount.claimed}/{dutyCount.total} volunteers filled
          </div>
        )}
        {role === 'parent' && childrenOnTeam.length > 0 && (
          <div style={{ marginTop: 8 }} onClick={(e) => e.stopPropagation()}>
            {childrenOnTeam.map((child) => (
              <ChildRsvp key={child.playerId} child={child} eventId={event.id} compact />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
