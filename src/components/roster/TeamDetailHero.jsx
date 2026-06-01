import { Calendar, Mail, MessageSquare, Phone } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isStaff } from '../../lib/permissions';
import { TYPE_LABELS } from '../../lib/constants';
import { formatTime } from '../../lib/formatters';
import { useTeamHeadCoach } from '../../hooks/useTeamHeadCoach';
import { useEventRsvpCounts } from '../../hooks/useEventRsvpCounts';
import ChildRsvp from '../schedule/ChildRsvp';
import RsvpProgressBar from '../shared/RsvpProgressBar';
import ShareScheduleButton from '../shared/ShareScheduleButton';

const CIRCUIT_LABELS = { aau: 'AAU', league_play: 'League Play', tournament: 'Tournament' };

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/New_York' });
}

// 2026-05-21 (Teams PR B / §9.2) — single hero replacing TeamHeaderCard +
// MyChildSpotlight + CoachQuickActions per CLAUDE.md §16.14. Four slots:
// identity, state-at-a-glance, per-role action stack, head-coach contact
// line (hidden when coach is viewing self). Per-row permissions still read
// realRole via useAuth(); page passes activeRole via the `role` prop.
export default function TeamDetailHero({ team, role, summary, myChild, myChildPlayer, nextEvent }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { coach } = useTeamHeadCoach(team?.id);
  const nextEventArray = nextEvent ? [nextEvent] : [];
  const { counts } = useEventRsvpCounts(nextEventArray);
  const nextCount = nextEvent ? counts[nextEvent.id] : null;
  const tc = team?.team_color || 'var(--as-neutral)';
  const metaParts = [team?.age_group, CIRCUIT_LABELS[team?.circuit] || team?.circuit].filter(Boolean);
  if (summary?.gamesPlayed > 0) {
    metaParts.push(summary.record);
    if (summary.streak !== '—') metaParts.push(summary.streak);
  }
  const practice = [team?.practice_day, team?.practice_location].filter(Boolean).join(' · ');
  // Coach-viewing-self hides own contact line (PLATFORM ADDITION):
  // showing a coach their own tap-to-call is noise.
  const isCoachViewingSelf = role === 'coach' && coach?.user_id && user?.id && coach.user_id === user.id;
  const showContactLine = coach && !isCoachViewingSelf;

  return (
    <div className="as-fade-in" style={{
      backgroundColor: 'var(--as-bg-card)', borderRadius: 10,
      border: '1px solid var(--as-border-default)', boxShadow: 'var(--as-shadow-sm)',
      overflow: 'hidden', marginBottom: 16,
    }}>
      <div style={{ height: 6, backgroundColor: tc }} />
      <div style={{ padding: 16 }}>
        <div className="flex items-center justify-between">
          <h1 className="font-bold" style={{ color: 'var(--as-text-primary)', fontSize: 20, letterSpacing: '-0.025em' }}>
            {team?.name}
          </h1>
          <div style={{
            width: 40, height: 40, borderRadius: '50%', backgroundColor: tc,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--as-text-inverse)', fontSize: 15, fontWeight: 700,
          }}>{team?.age_group}</div>
        </div>
        <div style={{ fontSize: 13, color: 'var(--as-text-tertiary)', marginTop: 4 }}>
          {metaParts.join(' · ')}
        </div>
        {practice && (
          <div style={{ fontSize: 13, color: 'var(--as-text-tertiary)', marginTop: 2 }}>
            Practice: {practice}
          </div>
        )}

        {nextEvent && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--as-border-subtle)' }}>
            <div className="flex items-center gap-1" style={{ marginBottom: 6 }}>
              <Calendar size={14} strokeWidth={1.75} color="var(--as-text-tertiary)" aria-hidden="true" />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--as-text-primary)' }}>{TYPE_LABELS[nextEvent.event_type] || 'Event'}</span>
              <span style={{ fontSize: 13, color: 'var(--as-text-secondary)' }}>{formatDate(nextEvent.start_at)} &middot; {formatTime(nextEvent.start_at)}</span>
            </div>
            {nextCount && nextCount.total > 0 && (
              <RsvpProgressBar going={nextCount.going} maybe={nextCount.maybe} out={nextCount.not_going} total={nextCount.total} compact />
            )}
            {/* PLATFORM ADDITION (Teams A4): hero ChildRsvp uses compact={false}
                so the RSVP pills hit the 44px tap target inside the hero. */}
            {role === 'parent' && myChild && (
              <div style={{ marginTop: 8 }}>
                <ChildRsvp child={myChild} eventId={nextEvent.id} eventType={nextEvent.event_type} compact={false} />
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          {role === 'parent' && (
            <button type="button" onClick={() => { navigator.vibrate?.(10); navigate(`/schedule?team=${team?.id}`); }} className="as-press"
              style={{ flex: 1, minHeight: 44, borderRadius: 10, border: '1px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-card)', color: 'var(--as-accent)', fontSize: 13, fontWeight: 500 }}>
              View calendar
            </button>
          )}
          {isStaff(role) && (
            <>
              <button type="button" onClick={() => { navigator.vibrate?.(10); navigate(`/messages?team=${team?.id}`); }} className="as-press"
                style={{ flex: 1, minHeight: 44, borderRadius: 10, border: '1px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-card)', color: 'var(--as-accent)', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <MessageSquare size={14} strokeWidth={1.75} /> Message
              </button>
              <Link to={`/admin/briefings/compose?anchor=team&id=${team?.id}`} aria-label="Send briefing about this team" className="as-press"
                style={{ flex: 1, minHeight: 44, borderRadius: 10, border: '1px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-card)', color: 'var(--as-accent)', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textDecoration: 'none' }}>
                <Mail size={14} strokeWidth={1.75} /> Briefing
              </Link>
              <ShareScheduleButton teamId={team?.id} />
            </>
          )}
        </div>

        {showContactLine && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--as-border-subtle)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--as-text-secondary)', flex: 1, minWidth: 0 }}>
              Coach <span style={{ fontWeight: 600, color: 'var(--as-text-primary)' }}>{coach.name}</span>
            </span>
            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
              {coach.phone && (
                <a href={`tel:${coach.phone}`} aria-label={`Call coach ${coach.name}`} style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: 'var(--as-bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Phone size={14} strokeWidth={1.75} color="var(--as-text-secondary)" />
                </a>
              )}
              {coach.email && (
                <a href={`mailto:${coach.email}`} aria-label={`Email coach ${coach.name}`} style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: 'var(--as-bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Mail size={14} strokeWidth={1.75} color="var(--as-text-secondary)" />
                </a>
              )}
            </div>
          </div>
        )}

        {myChildPlayer && role === 'parent' && (
          <div style={{ marginTop: 8, fontSize: 13, color: 'var(--as-text-tertiary)' }}>
            Your kid: <span style={{ fontWeight: 600, color: 'var(--as-text-primary)' }}>{myChildPlayer.first_name} {myChildPlayer.last_name}</span>
            {myChildPlayer.jersey_number != null && <span style={{ color: tc, fontWeight: 700 }}> · #{myChildPlayer.jersey_number}</span>}
            {myChildPlayer.streak >= 3 && <span> · 🔥 {myChildPlayer.streak}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
