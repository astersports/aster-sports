import { MessageSquare, Share } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CoachQuickActions({ teamId }) {
  const navigate = useNavigate();
  const actions = [
    { icon: MessageSquare, label: 'Message', onClick: () => navigate(`/messages?team=${teamId}`) },
    { icon: Share, label: 'Schedule', onClick: () => navigate(`/schedule?team=${teamId}`) },
  ];

  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 12, marginBottom: 4 }}>
      {actions.map(a => (
        <button key={a.label} type="button" onClick={a.onClick} className="sf-press"
          style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            minHeight: 44, padding: '8px 4px', borderRadius: 10, border: '1px solid var(--em-border-default)',
            backgroundColor: 'var(--em-bg-card)', color: 'var(--em-accent)', fontSize: 11, fontWeight: 500 }}>
          <a.icon size={18} strokeWidth={1.75} />
          {a.label}
        </button>
      ))}
    </div>
  );
}
