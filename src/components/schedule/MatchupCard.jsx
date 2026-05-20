import { useNavigate } from 'react-router-dom';
import { formatTime } from '../../lib/formatters';

export default function MatchupCard({ event, gameResult }) {
  const navigate = useNavigate();
  const team = event.teams;
  const teamColor = team?.team_color || 'var(--em-neutral)';
  const teamName = team?.name || '';
  const opponent = event.opponent_name || event.opponent || 'TBD';
  const isAway = event.home_away === 'away';
  const isCancelled = event.status === 'cancelled';
  const isPast = new Date(event.start_at) < new Date();
  const gr = gameResult || null;
  const hasResult = isPast && gr?.published_at;

  return (
    <div
      role="link"
      tabIndex={0}
      aria-label={`${teamName} vs ${opponent}`}
      className="sf-press"
      onClick={() => { navigator.vibrate?.(10); navigate(`/events/${event.id}`, { state: { event } }); }}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/events/${event.id}`, { state: { event } }); } }}
      style={{
        display: 'flex',
        alignItems: 'stretch',
        backgroundColor: 'var(--em-bg-card)',
        borderRadius: 10,
        border: '1px solid var(--em-border-default)',
        boxShadow: 'var(--em-shadow-sm)',
        overflow: 'hidden',
        opacity: isCancelled ? 0.5 : 1,
        marginBottom: 8,
      }}
    >
      <div style={{ width: 4, flexShrink: 0, backgroundColor: teamColor }} />
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        minHeight: 44,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: 100, flexShrink: 0 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: teamColor, flexShrink: 0 }} />
          <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--em-text-primary)', whiteSpace: 'nowrap' }}>
            {teamName}
          </span>
        </div>
        {hasResult ? (
          // Result + score pinned at 17px to match the upcoming time
          // typography (line 67) — same primary-signal weight across
          // upcoming and results sections. Frank-reported 2026-05-20:
          // "Games page on the schedule has different font size on
          // the upcoming games vs results section."
          <div style={{ width: 80, flexShrink: 0, textAlign: 'center' }}>
            <span style={{ fontSize: 17, fontWeight: 700, color: gr.result === 'W' ? 'var(--em-success)' : gr.result === 'L' ? 'var(--em-danger)' : 'var(--em-text-secondary)' }}>
              {gr.result}
            </span>
            <span style={{ fontSize: 17, fontWeight: 600, color: 'var(--em-text-primary)', marginLeft: 4 }}>
              {gr.our_score}-{gr.opponent_score}
            </span>
          </div>
        ) : (
          // Wave 5 follow-up — time pinned at 17px bold to match
          // EventCard typography hierarchy (time is the primary signal).
          // "vs"/"@" moved to the opponent prefix (also matches EventCard
          // pattern: time is bare, opponent carries the home/away mark).
          <div style={{ width: 80, flexShrink: 0, textAlign: 'center' }}>
            {!isPast && (
              <span className="font-bold" style={{ fontSize: 17, color: 'var(--em-text-primary)', whiteSpace: 'nowrap' }}>
                {formatTime(event.start_at)}
              </span>
            )}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 15, color: 'var(--em-text-primary)' }}>
            {isPast ? opponent : `${isAway ? '@ ' : 'vs '}${opponent}`}
          </span>
          {isPast && (
            <div style={{ fontSize: 11, color: 'var(--em-text-tertiary)', marginTop: 1 }}>
              {new Date(event.start_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
