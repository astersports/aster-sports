// §4.C Sprint C — Recognition card per HOME_DESIGN_SPEC §1.1.6.
// Renders one card per recent team_achievement (confirmed within
// the persistence window). Trophy/medal emoji + team color +
// achievement title + relative timestamp.
//
// V1 ships the medium-default visual abbreviated. NOT in scope:
// dismiss button, share-to-social CTA, photo embed, density variants.
//
// Visibility: hidden when achievements is empty.

import { Link } from 'react-router-dom';

function relativeTime(iso, nowMs) {
  if (!iso || !nowMs) return '';
  const ms = new Date(iso).getTime();
  if (Number.isNaN(ms)) return '';
  const diff = nowMs - ms;
  if (diff < 60 * 1000) return 'JUST NOW';
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m AGO`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h AGO`;
  const days = Math.floor(hrs / 24);
  return `${days}d AGO`;
}

function titleFor(achievement) {
  if (achievement.custom_title) return achievement.custom_title;
  if (achievement.description) return achievement.description;
  const teamName = achievement.teams?.name || 'Team';
  const op = achievement.opponent_team_name;
  if (achievement.achievement_type === 'win' && op) return `${teamName} beat ${op}`;
  if (achievement.achievement_type === 'championship') return `${teamName} won the championship`;
  if (achievement.achievement_type === 'nationals_qualified') return `${teamName} qualified for Nationals`;
  if (achievement.achievement_type === 'tournament_win' && op) return `${teamName} won — beat ${op}`;
  return `${teamName} achievement`;
}

export default function RecognitionCard({ achievements, nowMs }) {
  if (!achievements?.length) return null;

  return (
    <div aria-label="Recent achievements">
      {achievements.map((a) => {
        const teamColor = a.teams?.team_color || a.badge_color || 'var(--as-accent)';
        const emoji = a.badge_emoji || '🏆';
        const title = titleFor(a);
        const when = relativeTime(a.confirmed_at, nowMs);
        return (
          <Link
            key={a.id}
            to={`/teams/${a.team_id}`}
            aria-label={`Recognition: ${title}`}
            className="as-press"
            style={{
              display: 'block',
              padding: 14,
              marginBottom: 12,
              backgroundColor: 'var(--as-bg-card)',
              border: '1px solid var(--as-border-default)',
              borderLeft: `4px solid ${teamColor}`,
              borderRadius: 10,
              color: 'var(--as-text-primary)',
              textDecoration: 'none',
              boxShadow: 'var(--as-shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span aria-hidden="true" style={{ fontSize: 14 }}>{emoji}</span>
              {when && (
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--as-text-tertiary)', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                  {when}
                </span>
              )}
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--as-text-primary)', lineHeight: 1.3 }}>
              {title}
            </div>
            {a.event_location && (
              <div style={{ fontSize: 13, color: 'var(--as-text-secondary)', marginTop: 4 }}>
                {a.event_location}
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}
