import { useEffect, useState } from 'react';
import { Send } from 'lucide-react';
import FullScreenForm from '../shared/FullScreenForm';
import SendConfirmDialog from '../compose/SendConfirmDialog';
import { usePlayerRecipients } from '../../hooks/usePlayerRecipients';
import { sendAcademyCallupNotice } from '../../lib/academyCallupSend';
import { supabase } from '../../lib/supabase';

// Slim picker-flow compose for academy_callup_notice. Routes through the
// registry-path send pipeline (sendAcademyCallupNotice) so per-recipient
// callup tokens are minted + substituted server-side. Picker UX is now
// subject + recipient count + confirm — no inline HTML preview, since the
// resolver fans per-slice compose at send time and the picker can only show
// an approximate subject anyway.

export default function AcademyCallupCompose({ event, team, player, onClose }) {
  const { recipients } = usePlayerRecipients(player?.id);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [sendError, setSendError] = useState(null);

  // Approximate the resolver's subject for the picker preview. The actual
  // email subject is computed server-side per slice and may differ slightly
  // (event.title vs derived label). This preview is admin reassurance only.
  const eventLabel = event?.tournament_name
    || (event?.opponent ? `${team?.name || ''} ${event.home_away === 'away' ? '@' : 'vs'} ${event.opponent}`.trim() : 'Game');
  const subjectPreview = player ? `Call-up: ${player.first_name} for ${event?.title || eventLabel}` : '';

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !sending) onClose?.('skipped'); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sending, onClose]);

  if (!event || !player) return null;

  const familyCount = recipients.filter((r) => !r.is_admin_copy).length;
  const canSend = familyCount > 0 && !sending;

  const handleConfirm = async (_effectiveRecipients, testSendOnly) => {
    setSending(true);
    setSendError(null);
    setResult(null);
    try {
      const res = await sendAcademyCallupNotice({
        state: {
          event_id: event.id,
          player_id: player.id,
          signoff_message: null,
          test_only: !!testSendOnly,
        },
        supabase,
      });
      setResult({ messageId: res.messageId, sent: res.audienceCount, failed: 0 });
    } catch (e) {
      setSendError(e);
    } finally {
      setSending(false);
    }
  };

  const closeDialog = () => {
    if (sending) return;
    const wasSuccess = Boolean(result) && !sendError;
    setConfirmOpen(false);
    setResult(null);
    setSendError(null);
    if (wasSuccess) onClose?.('sent');
  };

  return (
    <FullScreenForm open onClose={() => onClose?.('skipped')} title={`Call-Up: ${player.first_name}`}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--em-text-secondary)', marginBottom: 4 }}>Subject</div>
        <div style={{ fontSize: 15, color: 'var(--em-text-primary)' }}>{subjectPreview || 'Loading…'}</div>
      </div>
      <div style={{ marginBottom: 14, fontSize: 13, color: 'var(--em-text-secondary)' }}>
        Sending to {familyCount} {familyCount === 1 ? 'family' : 'families'} ({player.first_name}&rsquo;s {familyCount === 1 ? 'guardian' : 'guardians'})
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button type="button" onClick={() => onClose?.('skipped')} className="em-press"
          style={{ flex: 1, minHeight: 44, borderRadius: 10, backgroundColor: 'var(--em-bg-secondary)', color: 'var(--em-text-primary)', fontSize: 15, fontWeight: 600, border: 'none' }}>
          Skip email
        </button>
        <button type="button" onClick={() => setConfirmOpen(true)} disabled={!canSend} className="em-press"
          style={{ flex: 1, minHeight: 44, borderRadius: 10, backgroundColor: 'var(--em-accent)', color: 'var(--em-text-inverse)', fontSize: 15, fontWeight: 600, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: canSend ? 1 : 0.5 }}>
          <Send size={16} strokeWidth={1.75} /> Send
        </button>
      </div>

      <SendConfirmDialog
        open={confirmOpen} onClose={closeDialog} onConfirm={handleConfirm}
        sending={sending} result={result} error={sendError}
        recipients={recipients}
        tournamentName={eventLabel} teamName={team?.name || ''}
        messageTypeLabel="Academy Call-Up"
      />
    </FullScreenForm>
  );
}
