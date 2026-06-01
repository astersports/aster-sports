import { AlertTriangle, CheckCircle2 } from 'lucide-react';

// Helper components for AcademyCallupPicker. Kept separate so the picker
// stays under the 150-line cap.

export function ShortNoticeBanner() {
  return (
    <div role="alert" style={{
      display: 'flex', gap: 8, alignItems: 'flex-start',
      padding: '10px 12px', borderRadius: 8,
      backgroundColor: 'var(--as-warning-soft)',
      borderLeft: '4px solid var(--as-warning)',
      color: 'var(--as-warning)', marginBottom: 12, fontSize: 13, lineHeight: 1.4,
    }}>
      <AlertTriangle size={16} strokeWidth={1.75} style={{ flexShrink: 0, marginTop: 1 }} />
      <span>Email may not arrive in time. Consider calling or texting directly for short-notice callups.</span>
    </div>
  );
}

export function StatusBadge({ status, onSendNow }) {
  if (status === 'sent') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 4, backgroundColor: 'var(--as-accent-soft)', color: 'var(--as-accent)' }}>
        <CheckCircle2 size={11} strokeWidth={2} /> Email sent
      </span>
    );
  }
  if (status === 'skipped') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 500, color: 'var(--as-text-tertiary)' }}>
        Email skipped
        <button type="button" onClick={onSendNow}
          style={{ fontSize: 11, fontWeight: 500, color: 'var(--as-accent)', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
          Send now
        </button>
      </span>
    );
  }
  return null;
}
