import { useState, useEffect } from 'react';

const LS_KEY = 'sf-install-dismissed';

function wasDismissed() {
  try { return localStorage.getItem(LS_KEY) === 'true'; } catch { return false; }
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showIosBanner, setShowIosBanner] = useState(false);
  const [dismissed, setDismissed] = useState(wasDismissed);

  useEffect(() => {
    if (isStandalone() || dismissed) return;

    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isSafari = /safari/i.test(navigator.userAgent) && !/crios|fxios|chrome/i.test(navigator.userAgent);

    if (isIos && isSafari) {
      setShowIosBanner(true);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [dismissed]);

  const dismiss = () => {
    try { localStorage.setItem(LS_KEY, 'true'); } catch {}
    setDismissed(true);
    setDeferredPrompt(null);
    setShowIosBanner(false);
  };

  const install = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    }
    dismiss();
  };

  if (dismissed || isStandalone()) return null;
  if (!deferredPrompt && !showIosBanner) return null;

  return (
    <div
      className="sf-fade-in"
      style={{
        position: 'fixed',
        bottom: 'calc(80px + env(safe-area-inset-bottom, 0px) + 8px)',
        left: 12,
        right: 12,
        zIndex: 9000,
        padding: 16,
        borderRadius: 12,
        backgroundColor: 'var(--sf-bg-card)',
        border: '1px solid var(--sf-border-default)',
        boxShadow: 'var(--sf-shadow-lg)',
      }}
    >
      <div className="flex items-start gap-3">
        <img
          src="/Knight_logo.png"
          alt=""
          style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0 }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="font-semibold" style={{ fontSize: 15, color: 'var(--sf-text-primary)' }}>
            Install Skyfire
          </div>
          <div style={{ fontSize: 13, color: 'var(--sf-text-secondary)', marginTop: 2 }}>
            {showIosBanner
              ? 'Tap the share button, then "Add to Home Screen"'
              : 'Add to your home screen for the full app experience'}
          </div>
        </div>
      </div>
      <div className="flex gap-2" style={{ marginTop: 12 }}>
        <button
          type="button"
          onClick={dismiss}
          className="sf-press"
          style={{
            flex: 1, minHeight: 40, borderRadius: 8,
            border: '1px solid var(--sf-border-default)',
            backgroundColor: 'var(--sf-bg-card)',
            color: 'var(--sf-text-secondary)',
            fontSize: 14, fontWeight: 500,
          }}
        >
          Not now
        </button>
        <button
          type="button"
          onClick={install}
          className="sf-press sf-bounce-tap"
          style={{
            flex: 1, minHeight: 40, borderRadius: 8,
            border: 'none',
            backgroundColor: 'var(--sf-accent)',
            color: 'var(--sf-text-inverse)',
            fontSize: 14, fontWeight: 600,
          }}
        >
          {showIosBanner ? 'Got it' : 'Install'}
        </button>
      </div>
    </div>
  );
}
