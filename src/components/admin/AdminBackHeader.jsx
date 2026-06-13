import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useGoBack } from '../../hooks/useGoBack';

// Frank-reported 2026-05-20 ("Most of the sections are missing a back
// button"). One shared component so every admin sub-page gets the same
// back affordance — placed above the existing page <h1>, no other
// layout impact. Defaults to back-or-Home (useGoBack: pops history, or
// falls back to Home when opened cold so the button is never a no-op);
// pages can pass a literal route via `to` for a fixed destination.
export default function AdminBackHeader({ to }) {
  const navigate = useNavigate();
  const goBack = useGoBack();
  return (
    <button
      type="button"
      onClick={to ? () => navigate(to) : goBack}
      aria-label="Back"
      className="as-press"
      style={{
        minHeight: 44,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 2,
        marginBottom: 4,
        padding: '0 8px 0 0',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: 'var(--as-accent)',
        fontSize: 15,
        fontFamily: 'inherit',
      }}
    >
      <ChevronLeft size={20} strokeWidth={2} aria-hidden="true" />
      Back
    </button>
  );
}
