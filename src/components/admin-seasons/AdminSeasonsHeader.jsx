import AdminBackHeader from '../admin/AdminBackHeader';

// Header zone for AdminSeasonsPage — back nav + page title row.
// Extracted from AdminSeasonsPage in the preemptive split arc per
// L99 platform audit PART 5 Phase 4 / PQ3 (2026-05-21). Pure
// presentational. The "New" / bulk action affordances live in
// AdminSeasonsActions; this surface owns the title strip alone so
// the back-nav + heading rhythm matches other admin-manager pages.
export default function AdminSeasonsHeader({ title = 'Seasons', actions = null }) {
  return (
    <>
      <AdminBackHeader />
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-bold" style={{ color: 'var(--em-text-primary)', fontSize: 20 }}>
          {title}
        </h1>
        {actions}
      </div>
    </>
  );
}
