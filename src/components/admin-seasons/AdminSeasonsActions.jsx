import { Plus } from 'lucide-react';
import Button from '../shared/Button';

// Actions cluster for AdminSeasonsPage — the "New" / bulk-action
// surface that sits in the page-header row. Extracted from
// AdminSeasonsPage in the preemptive split arc per L99 platform
// audit PART 5 Phase 4 / PQ3 (2026-05-21). Pure presentational; the
// onNew callback opens the SeasonFormSheet in the parent page.
export default function AdminSeasonsActions({ onNew }) {
  return (
    <Button onClick={onNew}>
      <Plus size={18} strokeWidth={1.75} /> New
    </Button>
  );
}
