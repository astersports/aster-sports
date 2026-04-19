import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const LS_KEY = 'sf.welcome.seen';

function wasSeen() {
  try { return localStorage.getItem(LS_KEY) === '1'; } catch { return false; }
}

export default function WelcomeOverlay() {
  const { role } = useAuth();
  const [visible, setVisible] = useState(!wasSeen());

  if (role === 'parent') return null;
  if (!visible) return null;

  const dismiss = () => {
    try { localStorage.setItem(LS_KEY, '1'); } catch { /* ignore */ }
    setVisible(false);
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 10001,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
      className="sf-fade-in"
    >
      <div style={{
        backgroundColor: 'var(--sf-bg-card)',
        borderRadius: 16,
        padding: 32,
        maxWidth: 340,
        width: '100%',
        textAlign: 'center',
        boxShadow: 'var(--sf-shadow-lg)',
      }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🏀</div>
        <h2 className="font-bold" style={{ fontSize: 20, color: 'var(--sf-text-primary)', marginBottom: 8 }}>
          Welcome to Skyfire
        </h2>
        <p style={{ fontSize: 14, color: 'var(--sf-text-secondary)', lineHeight: 1.6, marginBottom: 24 }}>
          Your team management platform. Track schedules, rosters, RSVPs, and game scores — all in one place.
        </p>
        <button
          type="button"
          onClick={() => { navigator.vibrate?.(10); dismiss(); }}
          className="w-full sf-press sf-bounce-tap font-semibold"
          style={{
            minHeight: 48,
            borderRadius: 10,
            backgroundColor: 'var(--sf-accent)',
            color: 'var(--sf-text-inverse)',
            fontSize: 16,
            border: 'none',
          }}
        >
          Let's go
        </button>
      </div>
    </div>
  );
}
