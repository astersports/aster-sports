import { AlertTriangle } from 'lucide-react';

// Extracted from TournamentFormSheet 2026-05-20 (L99 v6 §5.2 C2)
// to keep the parent under the 150-line cap (anti-pattern #11).
// Renders: optional soft conflict warning banner above the sticky
// Cancel/Save action bar. Banner is soft per Frank's call — the
// Save button stays active regardless.
export default function TournamentFormFooter({ conflictMessage, onCancel, onSave, disabled, saving }) {
  return (
    <>
      {conflictMessage && (
        <div role="alert" style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', borderRadius: 10, marginBottom: 12, backgroundColor: 'var(--em-warning-soft)', border: '1px solid var(--em-warning)', color: 'var(--em-warning)', fontSize: 13 }}>
          <AlertTriangle size={16} strokeWidth={1.75} style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
          <span>Schedule conflict: {conflictMessage}. You can save anyway.</span>
        </div>
      )}
      <div style={{ position: 'sticky', bottom: -16, margin: '8px -16px -16px', padding: '12px 16px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))', backgroundColor: 'var(--em-bg-card)', borderTop: '1px solid var(--em-border-default)', display: 'flex', gap: 10 }}>
        <button type="button" onClick={onCancel} className="sf-press" aria-label="Cancel"
          style={{ flex: 1, minHeight: 44, borderRadius: 10, border: '1.5px solid var(--em-accent)', backgroundColor: 'var(--em-bg-card)', color: 'var(--em-accent)', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
        <button type="button" onClick={onSave} disabled={disabled} className="sf-press" aria-label={saving ? 'Saving' : 'Save'}
          style={{ flex: 1, minHeight: 44, borderRadius: 10, border: 'none', backgroundColor: 'var(--em-accent)', color: 'var(--em-text-inverse)', fontSize: 15, fontWeight: 600, opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}>{saving ? 'Saving…' : 'Save'}</button>
      </div>
    </>
  );
}
