import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '../../hooks/useFocusTrap';

export default function FullScreenForm({ open, onClose, title, children, footer = null }) {
  const trapRef = useFocusTrap(open);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      ref={trapRef}
      className="as-fade-in"
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 9999,
        backgroundColor: 'var(--as-bg-page)',
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
        backgroundColor: 'var(--as-bg-card)',
        borderBottom: '1px solid var(--as-border-default)',
        flexShrink: 0,
      }}>
        <button type="button" onClick={onClose} className="as-press" style={{
          minHeight: 44, padding: '0 8px', background: 'none', border: 'none',
          color: 'var(--as-accent)', fontSize: 15, fontWeight: 500,
        }}>Cancel</button>
        <span style={{ fontSize: 17, fontWeight: 600, color: 'var(--as-text-primary)' }}>
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
      {footer && (
        <footer style={{ flexShrink: 0, padding: '12px 16px', borderTop: '1px solid var(--as-border-subtle)', backgroundColor: 'var(--as-bg-card)', display: 'flex', justifyContent: 'flex-end', gap: 8, minHeight: 56, paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}>
        {footer}
        </footer>
      )}
    </div>,
    document.body
  );
}
