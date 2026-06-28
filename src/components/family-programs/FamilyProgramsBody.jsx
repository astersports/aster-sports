import { useMemo, useState } from 'react';
import { Compass } from 'lucide-react';
import ChildProgramCard from '../family/ChildProgramCard';
import FamilyBalanceCard from '../family/FamilyBalanceCard';
import FamilyOpenCard from '../family/FamilyOpenCard';
import CollapsibleSection from '../shared/CollapsibleSection';
import EmptyState from '../shared/EmptyState';
import FamilySummaryStrip from './FamilySummaryStrip';
import FuturesAcademySpotlight from './FuturesAcademySpotlight';
import ChildFilterChips from './ChildFilterChips';

// Loaded-state body for My Family (L99 enhancement). Owns the per-child filter,
// the at-a-glance summary, the Futures Academy spotlight (headline, never a
// footnote — §4), and a collapsible "Programs open now" section (§16.14 detail
// pattern). Pure presentation over the assembled data; --as-* tokens only.
export default function FamilyProgramsBody({ children, balances, open }) {
  const [childId, setChildId] = useState(null);

  const futuresNames = useMemo(
    () => children
      .filter((c) => c.enrollments.some((e) => e.status === 'futures_academy'))
      .map((c) => c.firstName),
    [children],
  );
  const futuresSlug = useMemo(
    () => open.find((p) => /futures|academy/i.test(p.name || ''))?.slug || null,
    [open],
  );
  const visible = childId == null ? children : children.filter((c) => c.id === childId);

  return (
    <div className="as-fade-in">
      <FamilySummaryStrip children={children} balances={balances} openCount={open.length} />
      <FuturesAcademySpotlight enrolledNames={futuresNames} openSlug={futuresSlug} />
      <ChildFilterChips children={children} selectedId={childId} onSelect={setChildId} />

      {visible.length === 0 ? (
        <EmptyState icon={Compass} title="Nothing for this filter" description="Pick “Everyone” to see all of your family’s programs." />
      ) : (
        visible.map((child) => <ChildProgramCard key={child.id} child={child} />)
      )}

      {balances.map((row) => <FamilyBalanceCard key={row.programId} row={row} />)}

      {open.length > 0 && (
        <CollapsibleSection
          title="Programs open now"
          sectionKey="family-open-programs"
          defaultOpen
          count={open.length}
          subtitle={`${open.length} open`}
        >
          <div style={{ padding: '0 1px' }}>
            {open.map((program) => <FamilyOpenCard key={program.id} program={program} />)}
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
}
