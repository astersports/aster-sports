import { useEffect, useState } from 'react';
import { Send } from 'lucide-react';
import FullScreenForm from '../shared/FullScreenForm';
import SendConfirmDialog from '../compose/SendConfirmDialog';
import { usePlayerRecipients } from '../../hooks/usePlayerRecipients';
import { useComposeBriefing } from '../../hooks/useComposeBriefing';
import { useAuth } from '../../context/AuthContext';
import { compose } from '../../lib/engine/composer';
import { formatDateFull, formatTime } from '../../lib/formatters';

// Slim picker-flow compose for academy_callup_notice. Reuses send pipeline
// (useComposeBriefing) + recipient confirm UX (SendConfirmDialog) so we
// don't fork a parallel dispatcher.

function deriveGameCard(event) {
  const date = new Date(event.start_at);
  const time = formatTime(date).split(' ');
  const primary = event.opponent
    ? `${event.home_away === 'away' ? '@' : 'VS'} ${(event.opponent || '').toUpperCase()}`
    : (event.tournament_name || 'GAME');
  const secondaryText = [event.location, event.sub_location].filter(Boolean).join(', ');
  const mapsUrl = event.location
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([event.location, event.sub_location].filter(Boolean).join(', '))}`
    : null;
  return {
    variant: event.event_type === 'tournament' ? 'mandatory' : 'regular',
    rail: { timePrimary: time[0] || '', timeSuffix: time[1] || '' },
    primary,
    secondary: secondaryText
      ? { text: secondaryText, link: mapsUrl ? { text: 'Map', url: mapsUrl } : null }
      : null,
  };
}

export default function AcademyCallupCompose({ event, team, player, onClose }) {
  const { orgId, user } = useAuth();
  const { recipients } = usePlayerRecipients(player?.id);
  const { send, sending, result, error: sendError, reset } = useComposeBriefing();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const eventDate = event?.start_at ? formatDateFull(event.start_at) : '';
  const eventName = event?.tournament_name
    || (event?.opponent ? `${team?.name || ''} ${event.home_away === 'away' ? '@' : 'vs'} ${event.opponent}`.trim() : 'Game');
  const coachName = user?.user_metadata?.full_name || user?.user_metadata?.first_name || 'Coach';
  const rsvpUrl = event?.id
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/events/${event.id}`
    : '';

  const briefing = (event && team && player)
    ? compose({
      kind: 'academy_callup_notice',
      data: {
        teamName: team.name,
        playerFirstName: player.first_name,
        eventName,
        eventDate,
        coachName,
        orgName: 'Legacy Hoopers',
        gameCard: deriveGameCard(event),
        rsvpUrl,
        jerseyColor: team?.jersey_color || 'team color',
      },
    })
    : null;

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !sending) onClose?.('skipped'); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sending, onClose]);

  if (!event || !player) return null;

  const familyCount = recipients.filter((r) => !r.is_admin_copy).length;
  const canSend = Boolean(briefing) && familyCount > 0 && !sending;

  const handleConfirm = async (effectiveRecipients) => {
    try {
      await send({
        orgId,
        tournamentId: event.tournament_id || null,
        teamId: team?.id,
        messageType: 'academy_callup_notice',
        subject: briefing.subject,
        html: briefing.html,
        plainText: briefing.plainText,
        recipients: effectiveRecipients,
      });
    } catch { /* SendConfirmDialog renders the error inline */ }
  };
  const closeDialog = () => {
    if (sending) return;
    const wasSuccess = Boolean(result) && !sendError;
    setConfirmOpen(false);
    reset();
    if (wasSuccess) onClose?.('sent');
  };

  return (
    <FullScreenForm open onClose={() => onClose?.('skipped')} title={`Call-Up: ${player.first_name}`}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--em-text-secondary)', marginBottom: 4 }}>Subject</div>
        <div style={{ fontSize: 15, color: 'var(--em-text-primary)' }}>{briefing?.subject || 'Loading…'}</div>
      </div>
      <div style={{ marginBottom: 14, fontSize: 13, color: 'var(--em-text-secondary)' }}>
        Sending to {familyCount} {familyCount === 1 ? 'family' : 'families'} ({player.first_name}&rsquo;s {familyCount === 1 ? 'guardian' : 'guardians'})
      </div>
      {briefing?.html && (
        <div style={{ backgroundColor: 'var(--em-bg-card)', borderRadius: 10, border: '1px solid var(--em-border-default)', overflow: 'hidden' }}
          dangerouslySetInnerHTML={{ __html: briefing.html }} />
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button type="button" onClick={() => onClose?.('skipped')} className="sf-press"
          style={{ flex: 1, minHeight: 44, borderRadius: 10, backgroundColor: 'var(--em-bg-secondary)', color: 'var(--em-text-primary)', fontSize: 15, fontWeight: 600, border: 'none' }}>
          Skip email
        </button>
        <button type="button" onClick={() => setConfirmOpen(true)} disabled={!canSend} className="sf-press"
          style={{ flex: 1, minHeight: 44, borderRadius: 10, backgroundColor: 'var(--em-accent)', color: 'var(--em-text-inverse)', fontSize: 15, fontWeight: 600, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: canSend ? 1 : 0.5 }}>
          <Send size={16} strokeWidth={1.75} /> Send
        </button>
      </div>

      <SendConfirmDialog
        open={confirmOpen} onClose={closeDialog} onConfirm={handleConfirm}
        sending={sending} result={result} error={sendError}
        recipients={recipients}
        tournamentName={eventName} teamName={team?.name || ''}
        messageTypeLabel="Academy Call-Up"
      />
    </FullScreenForm>
  );
}
