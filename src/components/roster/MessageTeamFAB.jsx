import { useNavigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';

export default function MessageTeamFAB({ teamId }) {
  const navigate = useNavigate();
  return (
    <div style={{
      position: 'fixed',
      bottom: 'calc(80px + env(safe-area-inset-bottom, 0px) + 16px)',
      right: 16,
      zIndex: 40,
    }}>
      <button
        type="button"
        onClick={() => { navigator.vibrate?.(10); navigate(`/messages?team=${teamId}`); }}
        className="sf-press sf-bounce-tap"
        style={{
          width: 56, height: 56, borderRadius: '50%',
          backgroundColor: 'var(--em-accent)',
          boxShadow: 'var(--em-shadow-lg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: 'none', cursor: 'pointer',
        }}
        aria-label="Message team"
      >
        <MessageSquare size={24} strokeWidth={1.75} color="var(--em-text-inverse)" />
      </button>
    </div>
  );
}
