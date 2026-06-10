import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Users } from 'lucide-react';
import { useFamilyPrograms } from '../hooks/useFamilyPrograms';
import ChildProgramCard from '../components/family/ChildProgramCard';
import FamilyBalanceCard from '../components/family/FamilyBalanceCard';
import FamilyOpenCard from '../components/family/FamilyOpenCard';
import EmptyState from '../components/shared/EmptyState';
import LoadingSkeleton from '../components/shared/LoadingSkeleton';

// Parent "My Family" (PR-B1): what each child is registered for, what the family
// owes (one number from family_balances), and what's open to register into.
// Parent-scoped reads; negative contract — no org rollup, no other families, no
// admin controls.
export default function FamilyProgramsPage() {
  const navigate = useNavigate();
  const { data, loading, error } = useFamilyPrograms();
  const children = data?.children || [];
  const balances = data?.familyBalances || [];
  const open = data?.openPrograms || [];
  const hasAnything = children.some((c) => c.enrollments.length > 0) || open.length > 0;

  return (
    <div style={wrap}>
      <button type="button" onClick={() => navigate(-1)} className="as-press" aria-label="Go back" style={back}>
        <ChevronLeft size={20} strokeWidth={1.75} /> Back
      </button>
      <h1 style={h1}>My Family</h1>

      {loading ? (
        <LoadingSkeleton variant="card" count={3} />
      ) : error ? (
        <div role="alert" style={errStyle}>Couldn’t load your family right now. Try again in a moment.</div>
      ) : !hasAnything ? (
        <EmptyState icon={Users} title="No programs yet" description="We’ll show your registrations and what’s open right here when it opens." />
      ) : (
        <>
          {children.map((child) => <ChildProgramCard key={child.id} child={child} />)}
          {balances.map((row) => <FamilyBalanceCard key={row.programId} row={row} />)}
          {open.length > 0 && (
            <>
              <div style={secLabel}>Programs open now</div>
              {open.map((program) => <FamilyOpenCard key={program.id} program={program} />)}
            </>
          )}
        </>
      )}
    </div>
  );
}

const wrap = { minHeight: '100vh', backgroundColor: 'var(--as-bg-page)', padding: '16px 16px 32px', maxWidth: 600, margin: '0 auto' };
const back = { display: 'flex', alignItems: 'center', minHeight: 44, padding: '0 8px 0 0', background: 'none', border: 'none', color: 'var(--as-accent)', fontSize: 15, fontWeight: 500, marginBottom: 8 };
const h1 = { fontSize: 24, fontWeight: 700, color: 'var(--as-text-primary)', margin: '0 0 14px' };
const errStyle = { padding: '12px 14px', borderRadius: 10, backgroundColor: 'var(--as-danger-soft)', color: 'var(--as-danger)', fontSize: 14 };
const secLabel = { fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--as-text-meta)', margin: '8px 4px 8px' };
