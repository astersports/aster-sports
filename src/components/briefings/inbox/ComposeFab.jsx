// Wave 3.12 — mobile floating action button. Visible only on small
// viewports (matchMedia gate). Persistent during scroll.

import { Mail } from 'lucide-react';
import { useEffect, useState } from 'react';

const fabStyle = {
  position: 'fixed', bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))', right: 16, zIndex: 1000,
  width: 56, height: 56, borderRadius: 28, border: 'none',
  backgroundColor: 'var(--em-accent)', color: 'var(--em-text-inverse)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  boxShadow: '0 4px 12px rgba(74, 143, 212, 0.3)', cursor: 'pointer',
};

export default function ComposeFab({ onClick }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setShow(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  if (!show) return null;
  return (
    <button type="button" aria-label="Compose briefing" onClick={onClick} className="sf-press" style={fabStyle}>
      <Mail size={24} strokeWidth={1.75} />
    </button>
  );
}
