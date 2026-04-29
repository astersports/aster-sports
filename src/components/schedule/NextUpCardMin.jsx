// src/components/schedule/NextUpCardMin.jsx
// Step 5E-2b minimal density variant. Three text rows, no card chrome.
// Per HOME_DESIGN_SPEC.md §1.1.4 lines 252-258.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TYPE_LABELS } from '../../lib/constants';
import { formatCountdown, formatTime } from '../../lib/formatters';
import { useAuth } from '../../context/AuthContext';
import { useNow } from '../../hooks/useNow';
import ChildRsvp from './ChildRsvp';

const urgencyClass = (s) =>
  s < 3600 ? 'sf-urgency-1h' : s < 21600 ? 'sf-urgency-6h' : s < 86400 ? 'sf-urgency-24h' : '';

export default function NextUpCardMin({ event, rsvpCount }) {
  const navigate = useNavigate();
  const now = useNow();
  const { myChildren } = useAuth();
  const [countdown, setCountdown] = useState(() => formatCountdown(event.start_at));

  useEffect(() => {
    const id = setInterval(() => setCountdown(formatCountdown(event.start_at)), 60000);
    return () => clearInterval(id);
  }, [event.start_at]);

  const childOnTeam = (myChildren || []).find((c) => c.teamId === event.team_id);
  const secondsUntil = (new Date(event.start_at).getTime() - now) / 1000;
  const teamColor = event.teams?.team_color || event.team_color || 'var(--em-text-tertiary)';
  const typeLabel = TYPE_LABELS[event.event_type] || event.event_type;
  const teamName = event.teams?.name || event.team_name || '';
  const clockTime = formatTime(event.start_at);
  const goTo = () => navigate(`/events/${event.id}`, { state: { event } });

  return (
    <div role="link" tabIndex={0} onClick={goTo}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goTo(); } }}
      aria-label={`Next up for ${teamName}: ${typeLabel} at ${clockTime}, ${countdown}`}
      style={{ display: 'flex', minHeight: 44, cursor: 'pointer', marginBottom: 8 }}>
      <div style={{ width: 4, backgroundColor: teamColor, flexShrink: 0 }} />
      <div style={{ flex: 1, padding: '4px 12px' }}>
        <div className={`sf-countdown ${urgencyClass(secondsUntil)}`.trim()} style={{ fontSize: 13, fontWeight: 600 }}>
          {countdown} · {clockTime}
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
