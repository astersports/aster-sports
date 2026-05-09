import { ShieldAlert } from 'lucide-react';

// Persistent amber banner mounted at the top of DigestComposer when the
// org has pilot_mode_enabled=TRUE. Honest disclosure, not a gate — the
// operator can still preview + send. The actual pilot filter happens at
// useDigestRecipients (client) + edge function (defense in depth).
//
// Renders nothing when pilot mode is off — caller should still mount it
// unconditionally so toggling the org flag flips the UI without code change.

export default function PilotModeBanner({ pilotModeEnabled, recipientCount }) {
  if (!pilotModeEnabled) return null;
  return (
    <div role="alert" style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: 12, borderRadius: 10,
      backgroundColor: 'var(--em-warning-soft)',
      border: '1px solid var(--em-warning)',
      color: 'var(--em-warning)',
      fontSize: 13, lineHeight: 1.5,
    }}>
      <ShieldAlert size={18} strokeWidth={1.75} style={{ flexShrink: 0, marginTop: 1 }} />
      <div style={{ flex: 1, color: 'var(--em-text-primary)' }}>
        <div style={{ fontWeight: 700, color: 'var(--em-warning)', textTransform: 'uppercase', letterSpacing: '1.5px', fontSize: 11, marginBottom: 4 }}>
          Pilot mode
        </div>
        Only {recipientCount} pilot {recipientCount === 1 ? 'recipient' : 'recipients'} will receive this digest.
        Toggle off in <code style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, padding: '1px 4px', borderRadius: 3, backgroundColor: 'var(--em-bg-tertiary)' }}>organization_settings</code> to enable production sends.
      </div>
    </div>
  );
}
