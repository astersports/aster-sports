// Wave 3.8 §5.2 — pre-populated schedule_change composer.
// Opens after admin saves a recurring-event time/location change.
// Two paths: Skip (audit row only) or Send (audit row + dispatch).
// Routes through send-tournament-message v13 so pilot mode applies.

import { Send, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import FullScreenForm from '../shared/FullScreenForm';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/useToast';
import { useDigestRecipients } from '../../hooks/useDigestRecipients';
import { useOrgSettings } from '../../hooks/useOrgSettings';
import { useScheduleChangeAudit } from '../../hooks/useScheduleChangeAudit';

const inputStyle = { width: '100%', minHeight: 88, padding: 10, borderRadius: 10, fontSize: 14, fontFamily: 'inherit', backgroundColor: 'var(--as-bg-tertiary)', border: '1.5px solid var(--as-border-default)', color: 'var(--as-text-primary)' };
const btnPrimary = { width: '100%', minHeight: 44, borderRadius: 10, backgroundColor: 'var(--as-accent)', color: 'var(--as-text-inverse)', fontSize: 15, fontWeight: 600, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer' };
const btnSecondary = { ...btnPrimary, backgroundColor: 'var(--as-bg-secondary)', color: 'var(--as-text-secondary)' };

// End-aware: render the full start–end range so an end-time-only change is
// visible (the old start-only fmt showed "6:30 → 6:30" for a 6:30→8:30 end
// change). diff.before/after carry end_at (buildSaveDiff).
function fmtRange(start, end) {
  if (!start) return '';
  const startStr = new Date(start).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' });
  if (!end) return startStr;
  const endStr = new Date(end).toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' });
  return `${startStr} – ${endStr}`;
}

export default function ScheduleChangeComposer({ event, diff, onClose, onDone }) {
  const { orgId } = useAuth();
  const { showToast } = useToast();
  const { pilotModeEnabled } = useOrgSettings(orgId);
  const { recipients } = useDigestRecipients({ orgId, pilotOnly: pilotModeEnabled });
  // Wave 4.4-T0d: coaches removed — the schedule_change resolver fetches
  // staff_profiles directly (no need to pass through the composer).
  const { busy, recordSkip, recordAndDispatch } = useScheduleChangeAudit();
  const [signoff, setSignoff] = useState('');
  const [testOnly, setTestOnly] = useState(true);

  const audience = useMemo(
    () => (recipients || []).filter((f) => (f.team_ids || []).includes(event?.team_id)),
    [recipients, event?.team_id]
  );

  const onSkip = async () => {
    const r = await recordSkip(diff);
    if (r?.error) { showToast("Couldn't save audit row.", 'error'); return; }
    showToast('Change recorded. Families not notified.', 'success');
    onDone?.(); onClose?.();
  };

  const onSend = async () => {
    // Wave 4.4-T0d: pass state shape (matches registry contract for the
    // schedule_change resolver). useScheduleChangeAudit writes the audit
    // row first (resolver reads it), then dispatches, then links the
    // message_id back to the audit row.
    const r = await recordAndDispatch(diff, {
      kind: 'schedule_change', anchor_kind: 'event', anchor_id: event?.id,
      body: {}, signoff_message: signoff,
      test_only: testOnly, pilot_only: pilotModeEnabled,
    });
    if (r?.error) { showToast(r.error.message || "Send failed.", 'error'); return; }
    showToast(testOnly ? 'Test sent to admin@.' : `Sent to ${audience.length} ${pilotModeEnabled ? 'pilot recipients' : 'families'}.`, 'success');
    onDone?.(); onClose?.();
  };

  return (
    <FullScreenForm open onClose={onClose} title="Notify families">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 600, margin: '0 auto', padding: 16 }}>
        <div style={{ padding: 14, border: '1px solid var(--as-border-default)', borderRadius: 10, backgroundColor: 'var(--as-bg-card)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--as-text-tertiary)', marginBottom: 6 }}>Previous</div>
          <div style={{ fontSize: 14, color: 'var(--as-text-secondary)', textDecoration: 'line-through' }}>{fmtRange(diff?.before?.start_at, diff?.before?.end_at)}{diff?.before?.location ? ` · ${diff.before.location}` : ''}{diff?.before?.opponent ? ` · vs ${diff.before.opponent}` : ''}</div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--as-text-primary)', marginTop: 10, marginBottom: 6 }}>Updated</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--as-text-primary)' }}>{fmtRange(diff?.after?.start_at, diff?.after?.end_at)}{diff?.after?.location ? ` · ${diff.after.location}` : ''}{diff?.after?.opponent ? ` · vs ${diff.after.opponent}` : ''}</div>
        </div>
        <label style={{ display: 'block' }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--as-text-tertiary)', display: 'block', marginBottom: 6 }}>Signoff message (optional)</span>
          <textarea value={signoff} onChange={(e) => setSignoff(e.target.value)} placeholder="Sorry for the late switch — see you Friday." style={inputStyle} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--as-text-secondary)' }}>
          <input type="checkbox" checked={testOnly} onChange={(e) => setTestOnly(e.target.checked)} />
          Send test to admin@ only (recommended first)
        </label>
        <div style={{ fontSize: 12, color: 'var(--as-text-tertiary)' }}>
          Audience: {audience.length} {pilotModeEnabled ? 'pilot recipients' : 'families'} on this team.
        </div>
        <button type="button" onClick={onSend} disabled={busy} className="as-press" style={{ ...btnPrimary, opacity: busy ? 0.5 : 1 }}>
          <Send size={16} strokeWidth={1.75} />
          {busy ? 'Sending…' : (testOnly ? 'Send test to admin@' : `Notify ${audience.length} ${pilotModeEnabled ? 'pilot recipients' : 'families'}`)}
        </button>
        <button type="button" onClick={onSkip} disabled={busy} className="as-press" style={btnSecondary}>
          <X size={16} strokeWidth={1.75} /> Skip notification
        </button>
      </div>
    </FullScreenForm>
  );
}
