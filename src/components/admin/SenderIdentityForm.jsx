import { useState } from 'react';
import FullScreenForm from '../shared/FullScreenForm';
import Input from '../shared/Input';

// Settings → Communications → Sender identity. The name + address families see
// on automated emails, plus the reply-to. Writes organization_settings directly
// (bucket A; admin ALL policy — no RPC). Separate single-concern form from the
// shipped Automatic messages form per the REV 2 spec. Pessimistic Save-and-close.
// Inputs pinned to 16px to clear the iOS-zoom floor (§16.10 / spec §4); the
// shared Input defaults to 15px.

const HELP = { fontSize: 13, color: 'var(--as-text-tertiary)', lineHeight: 1.4, margin: '0 4px' };
const INPUT_STYLE = { fontSize: 16 };

export default function SenderIdentityForm({ open, onClose, initial, onSave, saving }) {
  return (
    <FullScreenForm open={open} onClose={onClose} title="Sender identity">
      <Body initial={initial} onSave={onSave} saving={saving} onClose={onClose} />
    </FullScreenForm>
  );
}

function Body({ initial, onSave, saving, onClose }) {
  const [fromName, setFromName] = useState(initial.fromName || '');
  const [fromEmail, setFromEmail] = useState(initial.fromEmail || '');
  const [replyTo, setReplyTo] = useState(initial.replyTo || '');

  const canSave = fromName.trim() && fromEmail.trim();

  const submit = async () => {
    if (!canSave) return;
    const res = await onSave({
      from_name: fromName.trim(),
      from_email: fromEmail.trim(),
      reply_to_email: replyTo.trim() || null,
    });
    if (res?.ok) onClose();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 600, margin: '0 auto' }}>
      <p style={HELP}>The name and address families see on automated emails. Replies go to the reply-to address.</p>
      <Input label="From name" required value={fromName} style={INPUT_STYLE}
        onChange={(e) => setFromName(e.target.value)} placeholder="Aster AAU" />
      <Input label="From email" required type="email" value={fromEmail} style={INPUT_STYLE}
        onChange={(e) => setFromEmail(e.target.value)} placeholder="frank@astersports.co" />
      <Input label="Reply-to email" type="email" value={replyTo} style={INPUT_STYLE}
        onChange={(e) => setReplyTo(e.target.value)} placeholder="Optional — defaults to from email" />
      <button
        type="button"
        onClick={submit}
        disabled={saving || !canSave}
        className="w-full font-semibold as-press as-bounce-tap"
        style={{
          minHeight: 44, borderRadius: 10, opacity: (saving || !canSave) ? 0.6 : 1,
          backgroundColor: 'var(--as-accent)', color: 'var(--as-text-inverse)', fontSize: 15,
        }}
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}
