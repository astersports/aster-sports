import { Link } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import { formatEventTitleString } from '../../lib/eventTitle';
import Label from '../shared/Label';

// HOME_DESIGN_SPEC §1.1.5 (parent) + §2.1.5 (coach) — UPCOMING PREP
// card. Renders when the next event within T+24h has public notes
// set. Presence-driven; hides when null.
//
// Per anti-pattern #42 (event title rendering): title flows through
// formatEventTitleString — same source as schedule + admin
// NextEventCard + parent ACTION ZONE secondary line.

function formatWhen(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const dayPart = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'America/New_York' });
  const timePart = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/New_York' });
  return `${dayPart} ${timePart}`;
}

export default function UpcomingPrepCard({ prep }) {
  if (!prep) return null;
  const { event, notes } = prep;
  const titleString = formatEventTitleString(event);
  const teamColor = event.teams?.team_color || 'var(--em-accent)';
  const teamName = event.teams?.name || '';
  const heading = `${titleString}${teamName ? ` · ${teamName}` : ''}`;

  return (
    <section className="min-w-0" aria-label="Upcoming event prep">
      <Label>PREP FOR {formatWhen(event.start_at).toUpperCase()}</Label>
      <Link
        to={`/events/${event.id}`}
        className="em-press"
        style={{
          display: 'block',
          padding: '12px 14px',
          backgroundColor: 'var(--em-bg-card)',
          borderLeft: `4px solid ${teamColor}`,
          borderTop: '1px solid var(--em-border-default)',
          borderRight: '1px solid var(--em-border-default)',
          borderBottom: '1px solid var(--em-border-default)',
          borderRadius: 10,
          boxShadow: 'var(--em-shadow-sm)',
          color: 'var(--em-text-primary)',
          textDecoration: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <ClipboardList size={18} strokeWidth={1.75} color="var(--em-text-tertiary)" style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--em-text-primary)', marginBottom: 4 }}>
              {heading}
            </div>
            <div
              style={{
                fontSize: 14,
                color: 'var(--em-text-secondary)',
                lineHeight: 1.45,
                whiteSpace: 'pre-line',
                display: '-webkit-box',
                WebkitLineClamp: 6,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {notes}
            </div>
          </div>
        </div>
      </Link>
    </section>
  );
}
