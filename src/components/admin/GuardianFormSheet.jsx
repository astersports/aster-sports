// §4.O PR B — GuardianFormSheet. Add / edit guardian (first_name,
// last_name, email, phone). Mounts FullScreenForm per CLAUDE.md
// anti-pattern #15 (multi-field forms → FullScreenForm, not
// BottomSheet). FullScreenForm unmounts children on close → Body
// state initializes fresh on each open; no effect-based reset.
//
// NOT in scope (deferred to follow-up):
//   - Archive (guardians table lacks archived_at column)
//   - Kid link editing (player_guardians join — separate UX)
//   - Delete (cascade semantics need product call)

import { useState } from 'react';
import FullScreenForm from '../shared/FullScreenForm';
import Input from '../shared/Input';

export default function GuardianFormSheet({ open, guardian, onClose, onSave }) {
  const title = guardian ? 'Edit member' : 'New member';
  return (
    <FullScreenForm open={open} onClose={onClose} title={title}>
      <Body key={guardian?.id ?? 'new'} guardian={guardian} onSave={onSave} />
    </FullScreenForm>
  );
}

function Body({ guardian, onSave }) {
  const [firstName, setFirstName] = useState(guardian?.first_name ?? '');
  const [lastName, setLastName] = useState(guardian?.last_name ?? '');
  const [email, setEmail] = useState(guardian?.email ?? '');
  const [phone, setPhone] = useState(guardian?.phone ?? '');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = (firstName.trim() || lastName.trim()) && !submitting;

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onSave({
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const label = {
    color: 'var(--em-text-secondary)',
    fontSize: 13,
    marginBottom: 6,
    display: 'block',
    fontWeight: 500,
  };

  return (
    <div>
      <div className="mb-4">
        <label htmlFor="guardian-first-name" style={label}>First name</label>
        <Input
          id="guardian-first-name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="e.g. Frank"
          autoFocus
        />
      </div>
      <div className="mb-4">
        <label htmlFor="guardian-last-name" style={label}>Last name</label>
        <Input
          id="guardian-last-name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="e.g. Samaritano"
        />
      </div>
      <div className="mb-4">
        <label htmlFor="guardian-email" style={label}>Email</label>
        <Input
          id="guardian-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="e.g. frank@example.com"
          autoComplete="email"
        />
      </div>
      <div className="mb-6">
        <label htmlFor="guardian-phone" style={label}>Phone</label>
        <Input
          id="guardian-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="e.g. (917) 555-1212"
          autoComplete="tel"
        />
      </div>
      <button
        type="button"
        onClick={submit}
        disabled={!canSubmit}
        className="sf-press w-full"
        style={{
          minHeight: 44,
          borderRadius: 10,
          backgroundColor: canSubmit ? 'var(--em-accent)' : 'var(--em-bg-tertiary)',
          color: canSubmit ? 'var(--em-text-inverse)' : 'var(--em-text-tertiary)',
          fontSize: 15,
          fontWeight: 600,
          border: 'none',
          cursor: canSubmit ? 'pointer' : 'not-allowed',
        }}
      >
        {submitting ? 'Saving…' : (guardian ? 'Save changes' : 'Add member')}
      </button>
    </div>
  );
}
