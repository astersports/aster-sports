// Wave 3.12 — mobile floating action button. Visible only on small
// viewports (matchMedia gate). Persistent during scroll.
//
// Wave 4.1d-2 §2.1 — z-index lowered from 1000 (covered Messages icon
// in bottom nav) to 30, and bottom shifted from 16px to 80px so the
// button sits ABOVE the bottom nav (~64px) without overlapping it.
// In-card "Compose" buttons sit at z 1 in their own stacking context
// so the FAB no longer crowds them either.

import { Mail } from 'lucide-react';
import { useEffect, useState } from 'react';

const fabStyle = {
  position: 'fixed', bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))', right: 16, zIndex: 30,
  width: 56, height: 56, borderRadius: 28, border: 'none',
  backgroundColor: 'var(--em-accent)', color: 'var(--em-text-inverse)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  boxShadow: 'var(--em-shadow-md)', cursor: 'pointer',
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
