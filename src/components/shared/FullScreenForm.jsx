import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function FullScreenForm({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="sf-fade-in"
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 9999,
        backgroundColor: 'var(--sf-bg-page)',
        display: 'flex',
        flexDirection: 'column',
        overflowX: 'hidden',
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        minHeight: 'calc(56px + env(safe-area-inset-top, 0px))',
        paddingLeft: 16, paddingRight: 16,
        backgroundColor: 'var(--sf-bg-card)',
        borderBottom: '1px solid var(--sf-border-default)',
        flexShrink: 0,
      }}>
        <button type="button" onClick={onClose} className="sf-press" style={{
          minHeight: 44, padding: '0 8px', background: 'none', border: 'none',
          color: 'var(--sf-accent)', fontSize: 15, fontWeight: 500,
        }}>Cancel</button>
        <span style={{ fontSize: 17, fontWeight: 600, color: 'var(--sf-text-primary)' }}>
          {title}
        </span>
        <div style={{ width: 60 }} />
      </div>
      <div style={{
        flex: 1, overflowY: 'auto', overflowX: 'hidden',
        overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch',
        padding: 16,
        paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
      }}>
        {children}
      </div>
    </div>,
    document.body
  );
}
