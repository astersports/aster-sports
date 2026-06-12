import { useNavigate } from 'react-router-dom';
import { formatTime } from '../../lib/formatters';
import { eventTimeState } from '../../lib/eventWindows';

export default function MatchupCard({ event, gameResult }) {
  const navigate = useNavigate();
  const team = event.teams;
  const teamColor = team?.team_color || 'var(--as-neutral)';
  const teamName = team?.name || '';
  // 2026-05-20 — tournament-anchor events (no bracket released yet) have
  // no opponent. Rendering "vs TBD" looked like a regular game admins
  // forgot to fill out. When event is a tournament with null opponent,
  // surface the tournament name instead and drop the placeholder 8:00 AM.
  const isTournamentAnchor = event.event_type === 'tournament'
    && !event.opponent_name && !event.opponent;
  const opponent = event.opponent_name || event.opponent || 'TBD';
  const tournamentLabel = event.tournament_name || 'Tournament';
  const isAway = event.home_away === 'away';
  const isCancelled = event.status === 'cancelled';
  // SD-2: spine re-point — the old start_at check flipped in-progress
  // games into the past treatment at tip-off.
  const isPast = eventTimeState(event) === 'completed';
  const gr = gameResult || null;
  const hasResult = isPast && gr?.published_at;

  return (
    <div
      role="link"
      tabIndex={0}
      aria-label={`${teamName} vs ${opponent}`}
      className="as-press"
      onClick={() => { navigator.vibrate?.(10); navigate(`/events/${event.id}`, { state: { event } }); }}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/events/${event.id}`, { state: { event } }); } }}
      style={{
        display: 'flex',
        alignItems: 'stretch',
        backgroundColor: 'var(--as-bg-card)',
        borderRadius: 10,
        border: '1px solid var(--as-border-default)',
        boxShadow: 'var(--as-shadow-sm)',
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
          <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--as-text-primary)', whiteSpace: 'nowrap' }}>
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
            <span style={{ fontSize: 17, fontWeight: 700, color: gr.result === 'W' ? 'var(--as-success)' : gr.result === 'L' ? 'var(--as-danger)' : 'var(--as-text-secondary)' }}>
              {gr.result}
            </span>
            <span style={{ fontSize: 17, fontWeight: 600, color: 'var(--as-text-primary)', marginLeft: 4 }}>
              {gr.our_score}-{gr.opponent_score}
            </span>
          </div>
        ) : (
          // Wave 5 follow-up — time pinned at 17px bold to match
          // EventCard typography hierarchy (time is the primary signal).
          // "vs"/"@" moved to the opponent prefix (also matches EventCard
          // pattern: time is bare, opponent carries the home/away mark).
          // Tournament anchors suppress the placeholder time entirely.
          <div style={{ width: 80, flexShrink: 0, textAlign: 'center' }}>
            {!isPast && !isTournamentAnchor && (
              <span className="font-bold" style={{ fontSize: 17, color: 'var(--as-text-primary)', whiteSpace: 'nowrap' }}>
                {formatTime(event.start_at)}
              </span>
            )}
            {/* Past game with no result row yet: show a pending marker
                (17px to hold the result row rhythm) instead of a blank
                center column that reads as a half-rendered card. */}
            {isPast && !isTournamentAnchor && (
              <span style={{ fontSize: 17, fontWeight: 600, color: 'var(--as-text-tertiary)' }}>—</span>
            )}
          </div>
        )}
        {/* Right column inlines opponent + date on a single line in
            the past state so the result row height matches the
            upcoming row height. Frank-reported 2026-05-20: 2-line
            opponent column made result cards visibly taller than
            upcoming cards despite PR #351 matching the score size. */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 15, color: 'var(--as-text-primary)' }}>
            {isTournamentAnchor ? tournamentLabel : (isPast ? opponent : `${isAway ? '@ ' : 'vs '}${opponent}`)}
          </span>
          {isTournamentAnchor && (
            <span style={{ fontSize: 11, color: 'var(--as-text-tertiary)' }}>
              Schedule pending
            </span>
          )}
          {!isTournamentAnchor && isPast && (
            <span style={{ fontSize: 11, color: 'var(--as-text-tertiary)' }}>
              {new Date(event.start_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
