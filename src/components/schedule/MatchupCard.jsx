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
      className="sf-press"
      onClick={() => { navigator.vibrate?.(10); navigate(`/events/${event.id}`, { state: { event } }); }}
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
        padding: '12px 14px',
        minHeight: 44,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: teamColor, flexShrink: 0 }} />
          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--em-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {teamName}
          </span>
        </div>
        {hasResult ? (
          <div style={{ textAlign: 'center', padding: '0 12px', flexShrink: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: gr.result === 'W' ? 'var(--em-success)' : gr.result === 'L' ? 'var(--em-danger)' : 'var(--em-text-secondary)' }}>
              {gr.result === 'W' ? 'W' : gr.result === 'L' ? 'L' : 'T'}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--em-text-primary)' }}>
              {gr.our_score}-{gr.opponent_score}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '0 12px', flexShrink: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--em-text-tertiary)', textTransform: 'uppercase' }}>
              {isPast ? '—' : isAway ? '@' : 'VS'}
            </div>
            {!isPast && (
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--em-accent)' }}>
                {formatTime(event.start_at)}
              </div>
            )}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--em-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
            {opponent}
          </span>
        </div>
      </div>
    </div>
  );
}
