import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/useToast';

// Wave 3.B #27 P0-1 closure: user-facing data subject deletion request.
// Backed by the request_account_deletion RPC + account_deletion_requests
// audit table. The operator processes the request manually (SQL/MCP);
// this UI captures the intake, not the actual delete.

export default function DeleteAccountSection() {
  const { showToast } = useToast();
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reason, setReason] = useState('');

  const submit = async () => {
    setSubmitting(true);
    const { data, error } = await supabase.rpc('request_account_deletion', { p_reason: reason || null });
    setSubmitting(false);
    if (error || !data?.ok) {
      showToast("Couldn't submit deletion request. Try again, or contact us if it keeps happening.", 'error');
      return;
    }
    setSubmitted(true);
    if (data.already_open) {
      showToast('Your deletion request is already on file.', 'success');
    } else {
      showToast('Deletion request submitted. We will follow up by email.', 'success');
    }
  };

  if (submitted) {
    return (
      <div style={infoBox}>
        Your account deletion request has been received. We follow up by email within 30 days.
        Need to add details? Reply to that email.
      </div>
    );
  }

  if (!confirming) {
    return (
      <div style={{ marginTop: 8 }}>
        <button type="button" onClick={() => setConfirming(true)} className="as-press"
          style={dangerBtn}>
          Request account deletion
        </button>
        <div style={helper}>
          Removes your sign-in, contact info, and any links to your child(ren) within 30 days.
          Game/event records that your kid participated in are kept by the organization in
          de-identified form.
        </div>
      </div>
    );
  }

  return (
    <div style={confirmBox}>
      <div style={confirmTitle}>Confirm account deletion</div>
      <div style={confirmBody}>
        We will process this within 30 days. This cannot be undone once processed.
      </div>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Optional: tell us why (helps us improve)"
        rows={3}
        style={textarea}
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button type="button" onClick={() => setConfirming(false)} disabled={submitting} className="as-press"
          style={{ ...secondaryBtn, flex: 1 }}>
          Cancel
        </button>
        <button type="button" onClick={submit} disabled={submitting} className="as-press"
          style={{ ...dangerBtn, flex: 1 }}>
          {submitting ? 'Submitting…' : 'Yes, delete my account'}
        </button>
      </div>
    </div>
  );
}

const dangerBtn = {
  width: '100%', minHeight: 44, borderRadius: 10, border: '1px solid var(--as-danger)',
  backgroundColor: 'transparent', color: 'var(--as-danger)', fontSize: 15, fontWeight: 500,
  cursor: 'pointer', fontFamily: 'inherit',
};
const secondaryBtn = {
  minHeight: 44, borderRadius: 10, border: '1px solid var(--as-border-default)',
  backgroundColor: 'var(--as-bg-card)', color: 'var(--as-text-primary)', fontSize: 15, fontWeight: 500,
  cursor: 'pointer', fontFamily: 'inherit',
};
const confirmBox = { marginTop: 8, padding: 14, borderRadius: 10, border: '1px solid var(--as-danger)', backgroundColor: 'var(--as-danger-soft)' };
const confirmTitle = { fontSize: 14, fontWeight: 600, color: 'var(--as-text-primary)', marginBottom: 4 };
const confirmBody = { fontSize: 13, color: 'var(--as-text-secondary)', lineHeight: 1.5, marginBottom: 10 };
const textarea = { width: '100%', minHeight: 70, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-tertiary)', fontSize: 14, fontFamily: 'inherit', resize: 'vertical' };
const infoBox = { marginTop: 8, padding: 14, borderRadius: 10, backgroundColor: 'var(--as-info-soft)', border: '1px solid var(--as-info)', fontSize: 13, color: 'var(--as-text-primary)', lineHeight: 1.5 };
const helper = { fontSize: 12, color: 'var(--as-text-tertiary)', lineHeight: 1.5, marginTop: 8 };
