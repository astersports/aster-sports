// src/components/schedule/NextUpCardMin.jsx
// Step 5E-2b minimal density variant. Three text rows, no card chrome.
// Per HOME_DESIGN_SPEC.md §1.1.4 lines 252-258.
import { useNavigate } from 'react-router-dom';
import { TYPE_LABELS } from '../../lib/constants';
import { formatEventDateMin } from '../../lib/formatters';
import { useAuth } from '../../context/AuthContext';
import { useNow } from '../../hooks/useNow';
import ChildRsvp from './ChildRsvp';
import { urgencyClass } from '../../lib/urgency';

export default function NextUpCardMin({ event, rsvpCount }) {
  const navigate = useNavigate();
  const now = useNow();
  const { myChildren } = useAuth();

  const childOnTeam = (myChildren || []).find((c) => c.teamId === event.team_id);
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
        <div style={{ fontSize: 13, color: 'var(--em-text-secondary)' }}>
          {teamName} {typeLabel}
        </div>
        {childOnTeam ? (
          <ChildRsvp child={childOnTeam} eventId={event.id} compact={true} />
        ) : (
          <div style={{ fontSize: 13, color: 'var(--em-text-secondary)' }}>
            {rsvpCount ? `${rsvpCount.going} going · ${rsvpCount.noResponse} no response` : 'RSVP status pending'}
          </div>
        )}
      </div>
    </div>
  );
}
