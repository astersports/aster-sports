import { MapPin, Car, Repeat } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatTime, formatCountdown } from '../../lib/formatters';
import { TYPE_LABELS } from '../../lib/constants';
import { useAuth } from '../../context/AuthContext';
import { useNow } from '../../hooks/useNow';
import ChildRsvp from './ChildRsvp';
import RsvpCountRow from './RsvpCountRow';

export default function EventCard({ event, rsvpCount, rideCount, dutyCount, stagger, isNext, density = 'medium' }) {
  const navigate = useNavigate();
  const { role, myChildren } = useAuth();
  const now = useNow();
  const childrenOnTeam = (myChildren || []).filter((c) => c.teamId === event.team_id);
  const team = event.teams;
  const teamColor = team?.team_color || 'var(--em-neutral)';
  const teamName = team?.name || '';
  const typeLabel = TYPE_LABELS[event.event_type] || event.event_type;
  const isCancelled = event.status === 'cancelled';
  const isPast = event.end_at ? new Date(event.end_at) < new Date() : false;
  const dimmed = isCancelled || isPast;
  const msUntil = new Date(event.start_at).getTime() - now;
  const showCountdown = isNext && msUntil > 0 && msUntil < 24 * 60 * 60 * 1000;
  const rawTitle = event.title || typeLabel;
  const alreadyPrefixed = rawTitle.startsWith('vs.') || rawTitle.startsWith('vs ') || rawTitle.startsWith('@ ') || rawTitle.startsWith('@');
  const titlePrefix = !alreadyPrefixed && (event.event_type === 'game' || event.event_type === 'tournament') && event.opponent
    ? (event.home_away === 'away' ? '@ ' : 'vs. ')
    : '';

  return (
    <div
      role="link"
      tabIndex={0}
      aria-label={`${teamName} ${rawTitle}, ${formatTime(event.start_at)}`}
      className={`sf-press ${dimmed ? '' : (stagger || '')}`}
      onClick={() => { navigator.vibrate?.(10); navigate(`/events/${event.id}`, { state: { event } }); }}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/events/${event.id}`, { state: { event } }); } }}
      style={{
        display: 'flex',
        alignItems: 'stretch',
        backgroundColor: (event.event_type === 'game' || event.event_type === 'tournament') ? 'rgba(74, 143, 212, 0.06)' : 'var(--em-bg-card)',
        borderRadius: 10,
        border: '1px solid var(--em-border-default)',
        boxShadow: 'var(--em-shadow-sm)',
        overflow: 'hidden',
        opacity: dimmed ? 0.5 : 1,
        transition: 'box-shadow 150ms ease-out, transform 150ms ease-out, opacity 150ms ease-out',
      }}
    >
      <div style={{ width: 4, flexShrink: 0, backgroundColor: teamColor }} />
      <div style={{ flex: 1, padding: density === 'minimal' ? '8px 14px' : '10px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
          <span className="font-bold" style={{ fontSize: density === 'minimal' ? 13 : 17, color: 'var(--em-text-primary)' }}>
            {formatTime(event.start_at)}
          </span>
          {showCountdown && (
            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, backgroundColor: 'var(--em-accent-soft)', color: 'var(--em-accent)' }}>
              {formatCountdown(event.start_at)}
            </span>
          )}
          <span style={{ fontSize: 13, color: 'var(--em-text-tertiary)' }}> · {typeLabel}</span>
          {isCancelled && <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--em-danger)', backgroundColor: 'var(--em-danger-soft)', padding: '1px 6px', borderRadius: 4, textTransform: 'uppercase' }}>Cancelled</span>}
          {density === 'minimal' && teamName && <span style={{ fontSize: 13, color: teamColor, fontWeight: 500 }}> · {teamName}</span>}
        </div>
        {density !== 'minimal' && (
          <>
            <div style={{ fontSize: 15, color: 'var(--em-text-primary)', marginTop: 2, marginBottom: 2, textDecoration: isCancelled ? 'line-through' : 'none' }}>
              {titlePrefix}{rawTitle}
            </div>
            {(teamName || event.location_name) && (
              <div className="flex items-center" style={{ fontSize: 13, gap: 4 }}>
                {teamName && <span style={{ color: teamColor, fontWeight: 500 }}>{teamName}</span>}
                {teamName && event.location_name && <span style={{ color: 'var(--em-text-tertiary)' }}>·</span>}
                {event.location_name && (<><MapPin size={12} strokeWidth={1.75} color="var(--em-text-tertiary)" /><span style={{ color: 'var(--em-text-tertiary)' }}>{event.location_name}</span></>)}
              </div>
            )}
            <RsvpCountRow rsvpCount={rsvpCount} compact={true} />
          </>
        )}
        {density === 'maximum' && (
          <>
            {event.notes && <div style={{ fontSize: 12, color: 'var(--em-text-tertiary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.notes.length > 60 ? event.notes.slice(0, 60) + '...' : event.notes}</div>}
            {rideCount && (rideCount.offers > 0 || rideCount.requests > 0) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, marginTop: 4 }}>
                <Car size={12} strokeWidth={1.75} color={rideCount.urgent ? 'var(--em-danger)' : rideCount.requests > 0 ? 'var(--em-warning)' : 'var(--em-text-tertiary)'} />
                {rideCount.offers > 0 && <span style={{ color: 'var(--em-text-secondary)' }}>{rideCount.offers} seat{rideCount.offers !== 1 ? 's' : ''}</span>}
                {rideCount.requests > 0 && <span style={{ color: rideCount.urgent ? 'var(--em-danger)' : 'var(--em-warning)', fontWeight: 500 }}>{rideCount.requests} ride{rideCount.requests !== 1 ? 's' : ''} needed</span>}
              </div>
            )}
            {dutyCount && dutyCount.total > 0 && (
              <div style={{ fontSize: 12, marginTop: 4, color: dutyCount.claimed < dutyCount.total ? 'var(--em-warning)' : 'var(--em-success)' }}>{dutyCount.claimed}/{dutyCount.total} volunteers</div>
            )}
            {role === 'parent' && childrenOnTeam.length > 0 && (
              <div style={{ marginTop: 8 }} onClick={(e) => e.stopPropagation()}>
                {childrenOnTeam.map((child) => (<ChildRsvp key={child.playerId} child={child} eventId={event.id} compact />))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
