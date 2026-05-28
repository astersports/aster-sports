import { ArrowLeft, X } from 'lucide-react';

// Extracted from CreateActivityWizard 2026-05-20 (anti-pattern #11
// file-length split). Renders the top bar with back/close icon, title,
// and per-step progress dots.
export default function WizardHeader({ step, backStop, isEdit, dots, dotIndex, onBack, onClose }) {
  return (
    <div style={{
      minHeight: 56, padding: '0 8px 0 4px',
      display: 'flex', alignItems: 'center', gap: 8,
      borderBottom: '1px solid var(--em-border-default)',
      backgroundColor: 'var(--em-bg-card)', flexShrink: 0,
      paddingTop: 'env(safe-area-inset-top, 0px)',
    }}>
      <button type="button" onClick={step > backStop ? onBack : onClose}
        className="em-press" style={{ minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {step > backStop
          ? <ArrowLeft size={20} strokeWidth={1.75} color="var(--em-text-primary)" />
          : <X size={20} strokeWidth={1.75} color="var(--em-text-primary)" />}
      </button>
      <span style={{ fontSize: 17, fontWeight: 600, color: 'var(--em-text-primary)', flex: 1 }}>
        {isEdit ? 'Edit Event' : 'New Event'}
      </span>
      <div style={{ display: 'flex', gap: 6, paddingRight: 8 }}>
        {dots.map((_, i) => (
          <div key={i} style={{
            width: 8, height: 8, borderRadius: 4,
            backgroundColor: i <= dotIndex ? 'var(--em-accent)' : 'var(--em-border-default)',
          }} />
        ))}
      </div>
    </div>
  );
}
