import { useEffect, useState } from 'react';
import { RefreshCw, Send, X } from 'lucide-react';
import { useTournamentBriefing } from '../../hooks/useTournamentBriefing';
import { useTeamRecipients } from '../../hooks/useTeamRecipients';
import { useComposeBriefing } from '../../hooks/useComposeBriefing';
import { useToast } from '../../context/useToast';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useAuth } from '../../context/AuthContext';
import { TOURNAMENT_MESSAGE_TYPES } from '../../lib/constants';
import SendConfirmDialog from '../compose/SendConfirmDialog';

// Briefing message types that have user-composable narrative. Excludes
// multi_team_notice + custom (programmatic / catch-all).
const BRIEFING_TYPES = TOURNAMENT_MESSAGE_TYPES.filter(
  (t) => !['multi_team_notice', 'custom'].includes(t.value),
);
const SCHEDULE_TYPE = 'preliminary_schedule';

export default function TournamentBriefing({ event, team, onClose }) {
  const { draftKeys, setDraftKeys, survivalText, setSurvivalText, briefing, loading, error, loadDraft, generate } =
    useTournamentBriefing({ event, team });
  const { recipients } = useTeamRecipients(team?.id);
  const { send, sending, result, error: sendError, reset } = useComposeBriefing();
  const [briefingType, setBriefingType] = useState(SCHEDULE_TYPE);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { showToast } = useToast();
  const { user, orgId } = useAuth();
  const trapRef = useFocusTrap(true);

  useEffect(() => { loadDraft(); }, [loadDraft]);
  useEffect(() => {
    if (draftKeys !== undefined && !briefing && briefingType === SCHEDULE_TYPE) generate(draftKeys, survivalText);
  }, [draftKeys, survivalText, briefing, generate, briefingType]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !sending) onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, sending]);

  const isSchedule = briefingType === SCHEDULE_TYPE;
  const handleRefresh = () => {
    if (isSchedule) generate(draftKeys, survivalText);
    else showToast(`${BRIEFING_TYPES.find((t) => t.value === briefingType)?.label || briefingType} generator coming soon`);
  };
  const handleSend = async (effectiveRecipients) => {
    try {
      await send({
        orgId, tournamentId: event?.tournament_id, messageType: briefingType,
        subject: briefing?.subject, html: briefing?.html, plainText: briefing?.plainText,
        recipients: effectiveRecipients,
      });
    } catch { /* SendConfirmDialog renders the error inline */ }
  };
  const closeDialog = () => {
    if (sending) return;
    if (result) showToast(`Sent ${result.sent ?? 0}, ${result.failed ?? 0} failed`);
    setConfirmOpen(false); reset();
  };
  const canSend = Boolean(briefing && isSchedule && event?.tournament_id);

  const labelStyle = { fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--em-text-secondary)' };
  const taStyle = { width: '100%', padding: 12, borderRadius: 10, border: '1.5px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-tertiary)', color: 'var(--em-text-primary)', fontSize: 15, fontFamily: 'Inter, sans-serif', resize: 'vertical' };
  const dropdownStyle = { width: '100%', minHeight: 44, padding: '0 12px', borderRadius: 10, border: '1.5px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)', color: 'var(--em-text-primary)', fontSize: 15, fontWeight: 500, fontFamily: 'inherit', appearance: 'none' };
  const sendBtn = { flex: 1, minHeight: 44, borderRadius: 10, backgroundColor: 'var(--em-accent)', color: 'var(--em-text-inverse)', fontSize: 15, fontWeight: 600, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: canSend ? 1 : 0.5, cursor: canSend ? 'pointer' : 'default' };
  const ghostBtn = { minHeight: 44, padding: '0 12px', borderRadius: 8, backgroundColor: 'transparent', color: 'var(--em-text-secondary)', fontSize: 13, fontWeight: 500, border: '1px solid var(--em-border-default)', display: 'inline-flex', alignItems: 'center', gap: 4 };

  return (
    <div ref={trapRef} role="dialog" aria-modal="true" aria-label="Tournament briefing"
      style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'var(--em-bg-page)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)', borderBottom: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)' }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--em-text-primary)' }}>Tournament Briefing</div>
          <div style={{ fontSize: 13, color: 'var(--em-text-secondary)', marginTop: 2 }}>{event?.tournament_name}</div>
        </div>
        <button type="button" onClick={onClose} className="sf-press" aria-label="Close" style={{ minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X size={20} strokeWidth={1.75} color="var(--em-text-primary)" />
        </button>
      </div>

      <div style={{ padding: '12px 16px 0' }}>
        <label htmlFor="tb-type" style={{ ...labelStyle, display: 'block', marginBottom: 6 }}>Message type</label>
        <select id="tb-type" value={briefingType} onChange={(e) => setBriefingType(e.target.value)} style={dropdownStyle} aria-label="Message type">
          {BRIEFING_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 16, backgroundColor: 'var(--em-bg-page)' }}>
        {loading && <div style={{ padding: 40, textAlign: 'center', color: 'var(--em-text-secondary)', fontSize: 15 }}>Loading tournament events...</div>}
        {error && <div style={{ padding: 16, color: 'var(--em-danger)', fontSize: 13 }}>{error.message}</div>}

        {!isSchedule && !loading && !error && (
          <div style={{ padding: 32, textAlign: 'center', backgroundColor: 'var(--em-bg-card)', borderRadius: 10, border: '1px solid var(--em-border-default)' }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--em-text-primary)', marginBottom: 6 }}>{BRIEFING_TYPES.find((t) => t.value === briefingType)?.label}</div>
            <div style={{ fontSize: 13, color: 'var(--em-text-secondary)', lineHeight: 1.5 }}>This briefing type is coming soon. Preliminary schedule is available now.</div>
          </div>
        )}

        {isSchedule && !loading && !error && (
          <>
            <div style={{ marginBottom: 16 }}>
              <label htmlFor="tb-survival" style={{ ...labelStyle, display: 'block', marginBottom: 6 }}>Parent Survival Guide</label>
              <textarea id="tb-survival" value={survivalText} onChange={(e) => setSurvivalText(e.target.value)}
                placeholder="Arrival, parking, concessions, rules — customize for this tournament." rows={4}
                style={{ ...taStyle, minHeight: 90 }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label htmlFor="tb-keys" style={labelStyle}>Coach Kenny&rsquo;s Keys</label>
                <button type="button" onClick={handleRefresh} className="sf-press" style={ghostBtn}>
                  <RefreshCw size={12} strokeWidth={1.75} /> Refresh
                </button>
              </div>
              <textarea id="tb-keys" value={draftKeys} onChange={(e) => setDraftKeys(e.target.value)}
                placeholder="One key per line. Pre-filled from coach_notes on each game." rows={5}
                style={{ ...taStyle, minHeight: 110 }} />
            </div>
            {briefing && (
              <div style={{ backgroundColor: 'var(--em-bg-card)', borderRadius: 10, overflow: 'hidden' }} dangerouslySetInnerHTML={{ __html: briefing.html }} />
            )}
          </>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 16, paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)', backgroundColor: 'var(--em-bg-card)', borderTop: '1px solid var(--em-border-default)' }}>
        {canSend && recipients.length > 0 && (
          <div style={{ fontSize: 12, color: 'var(--em-text-secondary)', textAlign: 'center' }}>
            Sending to {recipients.length} {recipients.length === 1 ? 'family' : 'families'} on {team?.name}
          </div>
        )}
        <button type="button" onClick={() => setConfirmOpen(true)} disabled={!canSend} className="sf-press" style={sendBtn}>
          <Send size={16} strokeWidth={1.75} /> Send
        </button>
      </div>

      <SendConfirmDialog
        open={confirmOpen} onClose={closeDialog} onConfirm={handleSend}
        sending={sending} result={result} error={sendError}
        recipients={recipients} adminEmail={user?.email}
        tournamentName={event?.tournament_name || ''} teamName={team?.name || ''}
        messageTypeLabel={BRIEFING_TYPES.find((t) => t.value === briefingType)?.label || briefingType}
      />
    </div>
  );
}
