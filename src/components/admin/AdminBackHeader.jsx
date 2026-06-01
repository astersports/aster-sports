import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

// Frank-reported 2026-05-20 ("Most of the sections are missing a back
// button"). One shared component so every admin sub-page gets the same
// back affordance — placed above the existing page <h1>, no other
// layout impact. Defaults to navigate(-1) which is "previous history
// entry"; pages can pass a literal route via `to` if they want a fixed
// destination (e.g., "/" to always return to admin home).
export default function AdminBackHeader({ to }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => (to ? navigate(to) : navigate(-1))}
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
