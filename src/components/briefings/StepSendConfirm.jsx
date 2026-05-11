// Wave 4.4-B Session 5c — Step 4 Send confirmation. Terminal step in
// the briefing wizard. Renders a recipient-summary card + (when pilot
// mode is on) a pilot banner + a primary SEND button that wraps the
// existing onSend handler from BriefingComposer.
//
// Layout: vertical stack, 14px padding. Body is fixed-text only (no
// preview here — PreviewPanel stays bound to Step 3 per Frank's lock).
// Send-gating defensive checks mirror StepBodySignoff's prior
// sendBlocked logic so this step can't be sent if pilot-zero,
// recipient-count-0, or scheduleInvalid hits despite Step 2/3 gates.

import { Loader2, Send, ShieldAlert } from 'lucide-react';
import { useMemo } from 'react';
import { fmtSchedule } from './briefingComposerHelpers';

const AUDIENCE_LABEL = {
  team: 'Team',
  multi_team: 'Multiple teams',
  tournament_attendees: 'Tournament attendees',
  event_attendees: 'Event attendees',
  player_specific: 'Specific player(s)',
  org_all: 'All families',
};

function audienceValue(state) {
  const t = state.audience_type;
  if (!t) return '—';
  const base = AUDIENCE_LABEL[t] || t;
  const f = state.audience_filter || {};
  if (t === 'multi_team' && Array.isArray(f.team_ids)) return `${f.team_ids.length} teams`;
  if (t === 'team' && Array.isArray(f.team_ids)) return f.team_ids.length === 1 ? base : `${f.team_ids.length} teams`;
  if (t === 'player_specific' && Array.isArray(f.player_ids)) return `${f.player_ids.length} player${f.player_ids.length === 1 ? '' : 's'}`;
  return base;
}

const wrap = { display: 'flex', flexDirection: 'column', gap: 14, padding: 14 };
const heading = { fontSize: 17, fontWeight: 600, color: 'var(--em-text-primary)' };
const card = { display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 14px', padding: 14, borderRadius: 10, border: '1px solid var(--em-border-subtle)', backgroundColor: 'var(--em-bg-card)' };
const rowLabel = { fontSize: 11, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--em-text-tertiary)', paddingTop: 2 };
const rowValue = { fontSize: 14, color: 'var(--em-text-primary)', lineHeight: 1.4 };
const banner = { display: 'flex', alignItems: 'flex-start', gap: 10, padding: 12, borderRadius: 10, backgroundColor: 'var(--em-warning-soft)', borderLeft: '3px solid var(--em-warning)', fontSize: 13, color: 'var(--em-text-primary)', lineHeight: 1.4 };
const sendBtn = (disabled) => ({ width: '100%', minHeight: 48, borderRadius: 10, border: 'none', backgroundColor: 'var(--em-accent)', color: 'var(--em-text-inverse)', fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1 });

export default function StepSendConfirm({ state, audience, onSend, sending = false, pilotModeEnabled = false }) {
  const scheduleValue = state.scheduled_for ? `Scheduled for ${fmtSchedule(state.scheduled_for)}` : 'Send now';
  const scheduleInvalid = useMemo(() => {
    if (state.send_mode !== 'scheduled') return false;
    if (!state.scheduled_for) return true;
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    return new Date(state.scheduled_for).getTime() - now < 5 * 60 * 1000;
  }, [state.send_mode, state.scheduled_for]);
  const a = audience || { filtered: null, mode: 'standard' };
  const pilotZeroBlock = a.mode === 'pilot_zero' && !state.test_only;
  const recipientCountBlock = a.filtered === 0 && !state.test_only;
  const disabled = sending || scheduleInvalid || pilotZeroBlock || recipientCountBlock;

  return (
    <div style={wrap}>
      <h3 style={heading}>Ready to send</h3>
      <div style={card} data-testid="send-summary">
        <span style={rowLabel}>Kind</span>
        <span style={rowValue} data-testid="row-kind">{state.kind || '—'}</span>
        <span style={rowLabel}>Audience</span>
        <span style={rowValue} data-testid="row-audience">{audienceValue(state)}</span>
        <span style={rowLabel}>Schedule</span>
        <span style={rowValue} data-testid="row-schedule">{scheduleValue}</span>
        {state.test_only && (<>
          <span style={rowLabel}>Mode</span>
          <span style={rowValue}>Test send (admin@ only)</span>
        </>)}
      </div>
      {pilotModeEnabled && (
        <div style={banner} role="status" data-testid="pilot-banner">
          <ShieldAlert size={16} strokeWidth={1.75} color="var(--em-warning)" style={{ flexShrink: 0, marginTop: 1 }} />
          <span>Pilot mode is on. Only flagged pilot families (or the admin BCC) will receive this send.</span>
        </div>
      )}
      <button type="button" onClick={onSend} disabled={disabled} className="sf-press" style={sendBtn(disabled)} data-testid="send-button">
        {sending
          ? <><Loader2 size={16} strokeWidth={1.75} className="sf-spin" /> Sending…</>
          : <><Send size={16} strokeWidth={1.75} /> Send</>}
      </button>
    </div>
  );
}
