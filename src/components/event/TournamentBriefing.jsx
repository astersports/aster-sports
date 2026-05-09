import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Send, X } from 'lucide-react';
import { useTournamentBriefing } from '../../hooks/useTournamentBriefing';
import { useTeamRecipients } from '../../hooks/useTeamRecipients';
import { useTeamCoaches } from '../../hooks/useTeamCoaches';
import { useComposeBriefing } from '../../hooks/useComposeBriefing';
import { useToast } from '../../context/useToast';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useAuth } from '../../context/AuthContext';
import { TOURNAMENT_MESSAGE_TYPES } from '../../lib/constants';
import {
  ENGINE_SUPPORTED_TYPES, inferMessageType, messageTypeLabel,
} from '../../lib/inferMessageType';
import BriefingTypeSelector from './BriefingTypeSelector';
import CoachPicker from '../briefings/CoachPicker';
import SendConfirmDialog from '../compose/SendConfirmDialog';

const PICKABLE_TYPES = TOURNAMENT_MESSAGE_TYPES.filter((t) => t.value !== 'multi_team_notice');

export default function TournamentBriefing({ event, team, onClose }) {
  const { draftKeys, setDraftKeys, survivalText, setSurvivalText, briefing, loading, error, loadDraft, generate } =
    useTournamentBriefing({ event, team });
  const { recipients, loading: recipientsLoading } = useTeamRecipients(team?.id);
  const { coaches: teamCoaches, loading: coachesLoading } = useTeamCoaches(team?.id);
  const { send, sending, result, error: sendError, reset } = useComposeBriefing();
  const [briefingType, setBriefingType] = useState(() => inferMessageType({
    start_date: event?.tournament_start_date, end_date: event?.tournament_end_date,
  }));
  const [editingType, setEditingType] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedCoachIds, setSelectedCoachIds] = useState(new Set());
  const { showToast } = useToast();
  const { orgId } = useAuth();
  const trapRef = useFocusTrap(true);

  const isEngineSupported = ENGINE_SUPPORTED_TYPES.has(briefingType);
  const isSchedule = briefingType === 'tournament_preliminary';
  const familyCount = recipients.filter((r) => !r.is_admin_copy).length;
  const footerCoaches = useMemo(
    () => (teamCoaches || []).filter((c) => selectedCoachIds.has(c.user_id) && c.display_name && c.phone),
    [teamCoaches, selectedCoachIds],
  );

  useEffect(() => { loadDraft(); }, [loadDraft]);
  useEffect(() => {
    Promise.resolve().then(() => setSelectedCoachIds(new Set((teamCoaches || []).map((c) => c.user_id))));
  }, [teamCoaches]);
  useEffect(() => {
    if (draftKeys !== undefined && isSchedule) generate(draftKeys, survivalText, footerCoaches);
  }, [draftKeys, survivalText, footerCoaches, generate, isSchedule]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !sending) onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, sending]);

  const toggleCoach = (id) => setSelectedCoachIds((s) => {
    const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n;
  });
  const handleRefresh = () => generate(draftKeys, survivalText, footerCoaches);
  const handleSend = async (effectiveRecipients) => {
    try { await send({ orgId, tournamentId: event?.tournament_id, teamId: team?.id, messageType: briefingType, subject: briefing?.subject, html: briefing?.html, plainText: briefing?.plainText, recipients: effectiveRecipients, coachUserIds: [...selectedCoachIds] }); }
    catch { /* SendConfirmDialog renders the error inline */ }
  };
  const closeDialog = () => {
    if (sending) return;
    if (result) showToast(`Sent ${result.sent ?? 0}, ${result.failed ?? 0} failed`);
    setConfirmOpen(false); reset();
  };
  const canSend = Boolean(briefing && isEngineSupported && event?.tournament_id);

  const labelStyle = { fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--em-text-secondary)' };
  const taStyle = { width: '100%', padding: 12, borderRadius: 10, border: '1.5px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-tertiary)', color: 'var(--em-text-primary)', fontSize: 15, fontFamily: 'Inter, sans-serif', resize: 'vertical' };
  const sendBtn = { flex: 1, minHeight: 44, borderRadius: 10, backgroundColor: 'var(--em-accent)', color: 'var(--em-text-inverse)', fontSize: 15, fontWeight: 600, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: canSend ? 1 : 0.5, cursor: canSend ? 'pointer' : 'default' };
  const ghostBtn = { minHeight: 32, padding: '0 10px', borderRadius: 8, backgroundColor: 'transparent', color: 'var(--em-text-secondary)', fontSize: 12, fontWeight: 500, border: '1px solid var(--em-border-default)', display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontFamily: 'inherit' };

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

      <BriefingTypeSelector value={briefingType} onChange={setBriefingType} options={PICKABLE_TYPES}
        editing={editingType} onToggleEditing={() => setEditingType((v) => !v)} />

      <div style={{ flex: 1, overflowY: 'auto', padding: 16, backgroundColor: 'var(--em-bg-page)' }}>
        {loading && <div style={{ padding: 40, textAlign: 'center', color: 'var(--em-text-secondary)', fontSize: 15 }}>Loading tournament events...</div>}
        {error && <div style={{ padding: 16, color: 'var(--em-danger)', fontSize: 13 }}>{error.message}</div>}

        {!isEngineSupported && !loading && !error && (
          <div style={{ padding: 16, borderRadius: 10, backgroundColor: 'var(--em-warning-soft)', border: '1px solid var(--em-warning)' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--em-text-primary)' }}>Engine for {messageTypeLabel(briefingType)} ships in a follow-up</div>
            <div style={{ fontSize: 13, color: 'var(--em-text-secondary)', lineHeight: 1.5, marginTop: 4 }}>Switch to Tournament Preliminary to send now.</div>
          </div>
        )}

        {isSchedule && !loading && !error && (
          <>
            <div style={{ marginBottom: 16 }}>
              <label htmlFor="tb-survival" style={{ ...labelStyle, display: 'block', marginBottom: 6 }}>Parent Survival Guide</label>
              <textarea id="tb-survival" value={survivalText} onChange={(e) => setSurvivalText(e.target.value)}
                placeholder="Arrival, parking, concessions, rules — customize for this tournament." rows={4} style={{ ...taStyle, minHeight: 90 }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label htmlFor="tb-keys" style={labelStyle}>Coach&rsquo;s Keys to the Game</label>
                <button type="button" onClick={handleRefresh} className="sf-press" style={ghostBtn}>
                  <RefreshCw size={12} strokeWidth={1.75} /> Refresh
                </button>
              </div>
              <textarea id="tb-keys" value={draftKeys} onChange={(e) => setDraftKeys(e.target.value)}
                placeholder="One key per line. Pre-filled from coach_notes on each game." rows={5} style={{ ...taStyle, minHeight: 110 }} />
            </div>
            <CoachPicker coaches={teamCoaches} selectedIds={selectedCoachIds} onToggle={toggleCoach} loading={coachesLoading} />
            {briefing && (
              <div style={{ backgroundColor: 'var(--em-bg-card)', borderRadius: 10, overflow: 'hidden' }} dangerouslySetInnerHTML={{ __html: briefing.html }} />
            )}
          </>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 16, paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)', backgroundColor: 'var(--em-bg-card)', borderTop: '1px solid var(--em-border-default)' }}>
        {team?.name && (
          <div style={{ fontSize: 12, color: 'var(--em-text-secondary)', textAlign: 'center' }}>
            {recipientsLoading ? `Loading recipients for ${team.name}…` : familyCount === 0 ? `No active families on ${team.name}` : `Sending to ${familyCount} ${familyCount === 1 ? 'family' : 'families'} on ${team.name}`}
          </div>
        )}
        <button type="button" onClick={() => setConfirmOpen(true)} disabled={!canSend} className="sf-press" style={sendBtn}>
          <Send size={16} strokeWidth={1.75} /> Send
        </button>
      </div>

      <SendConfirmDialog
        open={confirmOpen} onClose={closeDialog} onConfirm={handleSend}
        sending={sending} result={result} error={sendError}
        recipients={recipients}
        tournamentName={event?.tournament_name || ''} teamName={team?.name || ''}
        messageTypeLabel={messageTypeLabel(briefingType)}
      />
    </div>
  );
}
