import { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, variant = 'success', onUndo) => {
    setToast({ message, variant, onUndo });
  }, []);

  const dismiss = useCallback(() => setToast(null), []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 'calc(80px + env(safe-area-inset-bottom, 0px) + 8px)',
          left: 16, right: 16,
          zIndex: 10000,
          display: 'flex',
          justifyContent: 'center',
        }}>
          <div
            className="sf-toast-enter"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              borderRadius: 10,
              backgroundColor: toast.variant === 'error' ? 'var(--sf-danger)' : toast.variant === 'success' ? 'var(--sf-success)' : 'var(--sf-info)',
              color: 'var(--sf-text-inverse)',
              fontSize: 14,
              fontWeight: 500,
              boxShadow: 'var(--sf-shadow-lg)',
              maxWidth: 400,
              width: '100%',
            }}
          >
            <span style={{ flex: 1 }}>{toast.message}</span>
            {toast.onUndo && (
              <button
                type="button"
                onClick={() => { toast.onUndo(); dismiss(); }}
                style={{
                  background: 'none', border: 'none',
                  color: 'var(--sf-text-inverse)',
                  fontSize: 14, fontWeight: 700,
                  textDecoration: 'underline',
                  padding: '4px 8px',
                  minHeight: 36,
                }}
              >
                Undo
              </button>
            )}
            <button
              type="button"
              onClick={dismiss}
              style={{
                background: 'none', border: 'none',
                color: 'rgba(255,255,255,0.7)',
                fontSize: 18, padding: '4px 4px', minHeight: 36,
              }}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx;
}
