// G5 PR 1a — the "Sends needing review" region (§16.14 hero + collapsible
// cards) at the top of the admin Radar. Surfaces ambiguous 'queued' sends for a
// HUMAN decision; it NEVER auto-re-drives queued (Option C / the crash-window
// hold). Renders nothing when nothing is stuck (the live state today). Both
// actions are gated behind a BottomSheet confirm. Admin-only (route-guarded),
// org-scoped via the hook.

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import BottomSheet from '../shared/BottomSheet';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/useToast';
import { useStuckSends } from '../../hooks/useStuckSends';
import StuckSendCard from './StuckSendCard';

const region = { background: 'var(--as-bg-card)', border: '1px solid var(--as-warning)', borderRadius: 10, boxShadow: 'var(--as-shadow-sm)', overflow: 'hidden' };
const head = { display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', background: 'var(--as-warning-soft)' };
const rc = { width: 28, height: 28, borderRadius: 7, display: 'grid', placeItems: 'center', flexShrink: 0, background: 'var(--as-bg-card)', border: '1px solid var(--as-warning)', color: 'var(--as-warning)' };
const rt = { flex: 1, minWidth: 0 };
const cnt = { fontSize: 11, fontWeight: 700, color: 'var(--as-text-inverse)', background: 'var(--as-warning)', borderRadius: 9999, minWidth: 20, height: 20, padding: '0 7px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' };
const sheet = { padding: '4px 4px 8px', display: 'flex', flexDirection: 'column', gap: 8 };
const sheetP = { fontSize: 13, color: 'var(--as-text-secondary)', lineHeight: 1.5 };
const sbtn = { minHeight: 46, borderRadius: 9, fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' };
const goBtn = { ...sbtn, background: 'var(--as-accent)', border: '1.5px solid var(--as-accent)', color: 'var(--as-text-inverse)' };
const darkBtn = { ...sbtn, background: 'var(--as-text-primary)', border: '1.5px solid var(--as-text-primary)', color: 'var(--as-text-inverse)' };
const cancelBtn = { ...sbtn, background: 'var(--as-bg-card)', border: '1.5px solid var(--as-border-default)', color: 'var(--as-text-secondary)' };

export default function StuckSendsRegion({ orgId }) {
  const { groups, count, loading, refetch } = useStuckSends({ orgId });
  const { showToast } = useToast();
  const [confirm, setConfirm] = useState(null); // { action: 'resend'|'mark', group }
  const [busy, setBusy] = useState(false);

  if (loading || count === 0) return null; // nothing stuck (or still loading) -> region absent

  const run = async () => {
    const { action, group } = confirm;
    setBusy(true);
    try {
      if (action === 'resend') {
        // Re-invoke dispatch. Safe (no 409): a 'queued' row implies the message
        // never finalized (crash before finalize) -> sent_at NULL -> alreadySent false.
        const { error } = await supabase.functions.invoke('send-tournament-message', { body: { message_id: group.messageId } });
        if (error) throw error;
        showToast(`Resent to ${group.recipients.length}.`, 'success');
      } else {
        // Mark-as-delivered: assert delivery without sending. 'sent' is the
        // least-bad terminal value (no 'delivered' webhook state is fabricated).
        const { error } = await supabase.from('comms_message_recipients')
          .update({ delivery_status: 'sent' }).in('id', group.recipients.map((r) => r.id));
        if (error) throw error;
        showToast('Marked as delivered.', 'success');
      }
      setConfirm(null);
      refetch();
    } catch {
      showToast("Looks like that didn't go through. Try again?", 'error');
    } finally { setBusy(false); }
  };

  const isResend = confirm?.action === 'resend';
  const n = confirm?.group?.recipients.length ?? 0;

  return (
    <section style={region} aria-label="Sends needing review">
      <div style={head}>
        <span style={rc}><AlertTriangle size={16} strokeWidth={1.75} aria-hidden="true" /></span>
        <div style={rt}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--as-text-primary)' }}>Sends needing review</div>
          <div style={{ fontSize: 11, color: 'var(--as-text-secondary)' }}>Interrupted before delivery could be confirmed</div>
        </div>
        <span style={cnt}>{count}</span>
      </div>
      {groups.map((g) => (
        <StuckSendCard key={g.messageId} group={g}
          onResend={() => setConfirm({ action: 'resend', group: g })}
          onMark={() => setConfirm({ action: 'mark', group: g })} />
      ))}
      <BottomSheet open={!!confirm} onClose={() => { if (!busy) setConfirm(null); }}>
        <div style={sheet}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--as-text-primary)' }}>
            {isResend ? `Resend to ${n} recipient${n === 1 ? '' : 's'}?` : `Mark ${n} as delivered?`}
          </h3>
          <p style={sheetP}>
            {isResend
              ? 'Anyone who already received this briefing will get a duplicate. This cannot be undone.'
              : "Use this only if you've confirmed in Resend that these recipients received the email. This clears the alert without sending anything."}
          </p>
          <button type="button" className="as-press" style={isResend ? goBtn : darkBtn} disabled={busy} onClick={run}>
            {isResend ? `Resend to ${n}` : 'Mark delivered'}
          </button>
          <button type="button" className="as-press" style={cancelBtn} disabled={busy} onClick={() => setConfirm(null)}>Cancel</button>
        </div>
      </BottomSheet>
    </section>
  );
}
