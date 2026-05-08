// src/components/schedule/NextUpCardMin.jsx
// Step 5E-2b minimal density variant. Three text rows, no card chrome.
// Per HOME_DESIGN_SPEC.md §1.1.4 lines 252-258.
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { TYPE_LABELS } from '../../lib/constants';
import { formatEventDateMin } from '../../lib/formatters';
import { useAuth } from '../../context/AuthContext';
import { useMapsUrl } from '../../hooks/useMapsUrl';
import { useNow } from '../../hooks/useNow';
import ChildRsvp from './ChildRsvp';
import { urgencyClass } from '../../lib/urgency';

export default function NextUpCardMin({ event, rsvpCount }) {
  const navigate = useNavigate();
  const now = useNow();
  const { myChildren } = useAuth();

  const childOnTeam = (myChildren || []).find((c) => c.teamIds?.includes(event.team_id) || c.teamId === event.team_id);
  const directionsUrl = useMapsUrl(event.location);
  const secondsUntil = (new Date(event.start_at).getTime() - now) / 1000;
  const teamColor = event.teams?.team_color || event.team_color || 'var(--em-text-tertiary)';
  const typeLabel = TYPE_LABELS[event.event_type] || event.event_type;
  const teamName = event.teams?.name || event.team_name || '';
  const whenLabel = formatEventDateMin(event.start_at);
  const goTo = () => navigate(`/events/${event.id}`, { state: { event } });

  return (
    <div role="link" tabIndex={0} onClick={goTo}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goTo(); } }}
      aria-label={`Next up for ${teamName}: ${typeLabel}, ${whenLabel}`}
      style={{ display: 'flex', minHeight: 44, cursor: 'pointer', marginBottom: 8 }}>
      <div style={{ width: 4, backgroundColor: teamColor, flexShrink: 0 }} />
      <div style={{ flex: 1, padding: '4px 12px' }}>
        <div className={`sf-countdown ${urgencyClass(secondsUntil)}`.trim()} style={{ fontSize: 13, fontWeight: 600 }}>
          {whenLabel}
        </div>
        <div style={{ fontSize: 13, color: 'var(--em-text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span>{teamName} {typeLabel}</span>
          {event.location && (
            <>
              <span style={{ color: 'var(--em-text-tertiary)' }}>·</span>
              {directionsUrl ? (
                <a href={directionsUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ display: 'inline-flex', alignItems: 'center', gap: 2, color: 'var(--em-text-secondary)', textDecoration: 'none' }}>
                  <MapPin size={11} strokeWidth={1.75} color="var(--em-text-tertiary)" />
                  {event.location}
                </a>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                  <MapPin size={11} strokeWidth={1.75} color="var(--em-text-tertiary)" />
                  {event.location}
                </span>
              )}
            </>
          )}
        </div>
        {childOnTeam ? (
          <ChildRsvp child={childOnTeam} eventId={event.id} eventType={event.event_type} compact={true} />
        ) : (
          <div style={{ fontSize: 13, color: 'var(--em-text-secondary)' }}>
            {rsvpCount ? `${rsvpCount.going} going · ${rsvpCount.noResponse} no response` : 'RSVP status pending'}
          </div>
        )}
      </div>
    </div>
  );
}
