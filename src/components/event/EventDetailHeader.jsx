import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Ban, Pencil, Trash2, UserCheck } from 'lucide-react';
import { TYPE_LABELS } from '../../lib/constants';
import { useAuth } from '../../context/AuthContext';
import { useAnchorDraftStatus } from '../../hooks/useAnchorDraftStatus';
import SendBriefingButton from '../briefings/SendBriefingButton';

function eventBriefingKinds(event) {
  const kinds = ['schedule_change', 'announcement', 'custom_message'];
  const isPast = event?.start_at ? new Date(event.start_at) < new Date() : false;
  const isGame = event?.event_type === 'game' || event?.event_type === 'tournament';
  if (isPast && isGame) kinds.unshift('game_recap');
  if (!isPast) kinds.push('rsvp_nudge');
  return kinds;
}

const iconBtn = { minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' };

// Wave 4.8 6b Session 1 — Compose recap deep-link CTA (past games only).
// Style anchor matches TeamDetailPage:81-86 + SendBriefingButton.baseStyle.
const composeCtaWrap = { display: 'flex', justifyContent: 'flex-end', padding: '8px 12px 0' };
const composeCtaBase = {
  minHeight: 44, padding: '0 14px', borderRadius: 10,
  fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer',
  border: '1.5px solid var(--em-border-default)',
  backgroundColor: 'var(--em-bg-card)', color: 'var(--em-text-primary)',
  display: 'inline-flex', alignItems: 'center', gap: 6,
};

function ComposeRecapCta({ event }) {
  const navigate = useNavigate();
  const { orgId } = useAuth();
  const status = useAnchorDraftStatus({ orgId, anchorKind: 'event', anchorId: event.id, kind: 'game_recap' });
  const label = status.hasDraft ? 'Resume draft' : (status.hasSent ? 'Recap sent' : 'Compose recap');
  const sentOnly = status.hasSent && !status.hasDraft;
  const style = sentOnly
    ? { ...composeCtaBase, backgroundColor: 'var(--em-bg-secondary)', color: 'var(--em-text-tertiary)', cursor: 'default' }
    : status.hasDraft
      ? { ...composeCtaBase, backgroundColor: 'var(--em-accent-soft)', borderColor: 'var(--em-accent)' }
      : composeCtaBase;
  const aria = sentOnly ? 'Recap already sent for this game' : `${label} for this game`;
  return (
    <div style={composeCtaWrap}>
      <button type="button" disabled={sentOnly} aria-disabled={sentOnly} aria-label={aria}
        onClick={() => navigate(`/admin/briefings/compose?kind=game_recap&anchor=event&id=${event.id}`)}
        className={sentOnly ? '' : 'sf-press'} style={style}>
        {label}
      </button>
    </div>
  );
}

const dateFmt = new Intl.DateTimeFormat('en-US', {
  weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/New_York',
});

function buildSummary({ event, team, typeLabel }) {
  const parts = [];
  if (team?.name) parts.push(team.name);
  parts.push(typeLabel);
  if (event.start_at) parts.push(dateFmt.format(new Date(event.start_at)).replace(',', ''));
  if (event.home_away && event.home_away !== 'tbd') parts.push(event.home_away.toUpperCase());
  return parts.join(' · ');
}

export default function EventDetailHeader({ event, team, isStaff, onEdit, onDelete, onCheckin }) {
  const navigate = useNavigate();
  const teamColor = team?.team_color || 'var(--em-text-tertiary)';
  const typeLabel = TYPE_LABELS[event.event_type] || event.event_type;
  const summary = buildSummary({ event, team, typeLabel });
  const briefingKinds = useMemo(() => eventBriefingKinds(event), [event]);
  const isPastGame = event.event_type === 'game'
    && !!event.start_at && new Date(event.start_at) < new Date()
    && event.status !== 'cancelled';

  return (
    <>
      <div style={{ backgroundColor: teamColor, padding: '0 8px 16px 4px', paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button type="button" onClick={() => navigate(-1)} className="sf-press" aria-label="Go back" style={iconBtn}>
            <ArrowLeft size={20} strokeWidth={1.75} color="var(--em-text-inverse)" />
          </button>
          <div style={{ display: 'flex', gap: 4 }}>
            {isStaff && (
              <button type="button" onClick={onCheckin} className="sf-press" aria-label="Take attendance" style={iconBtn}>
                <UserCheck size={20} strokeWidth={1.75} color="var(--em-text-inverse)" />
              </button>
            )}
            {isStaff && (
              <>
                <button type="button" onClick={onEdit} className="sf-press" aria-label="Edit event" style={iconBtn}>
                  <Pencil size={20} strokeWidth={1.75} color="var(--em-text-inverse)" />
                </button>
                <SendBriefingButton anchorKind="event" anchorId={event.id} kindFilter={briefingKinds} variant="icon-only" iconColor="var(--em-text-inverse)" />
                <button type="button" onClick={onDelete} className="sf-press" aria-label="Delete event" style={iconBtn}>
                  <Trash2 size={20} strokeWidth={1.75} color="var(--em-text-inverse)" />
                </button>
              </>
            )}
          </div>
        </div>
        <div style={{ padding: '0 12px', marginTop: 4 }}>
          <h1 style={{ fontSize: 17, fontWeight: 600, color: 'var(--em-text-inverse)', margin: 0, lineHeight: 1.3 }}>
            {summary}
          </h1>
        </div>
      </div>
      {isStaff && isPastGame && <ComposeRecapCta event={event} />}
      {event.status === 'cancelled' && (
        <div style={{
          backgroundColor: 'var(--em-danger-soft)', padding: '8px 16px',
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 15, fontWeight: 500, color: 'var(--em-danger)',
        }}>
          <Ban size={16} strokeWidth={1.75} />
          This event has been cancelled
        </div>
      )}
    </>
  );
}
