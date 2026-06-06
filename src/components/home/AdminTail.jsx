import ProgramHealthCard from '../admin/ProgramHealthCard';
import QuickActions from '../admin/QuickActions';

// AdminTail — slot 5 (RoleTail) for admin home. Program health KPIs
// (ProgramHealthCard, fed by useProgramHealthMetrics) + the shortcut grid
// (QuickActions — navigation chrome, not a card). Both are reused as-is from
// the pre-redesign admin home.
const LABEL = {
  fontSize: 11, fontWeight: 600, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: 'var(--as-text-meta)', marginBottom: 8, padding: '0 2px',
};

export default function AdminTail({ season, nowMs }) {
  return (
    <>
      <ProgramHealthCard season={season} nowMs={nowMs} />
      <section className="min-w-0" aria-label="Shortcuts">
        <div style={LABEL}>Shortcuts</div>
        <QuickActions />
      </section>
    </>
  );
}
