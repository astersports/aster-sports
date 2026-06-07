// Pure grouping + display mapping for the /admin/programs index (PR-3, render R1).
// Kept client-free so it's unit-testable (AP#27).
//
// Draft    = not launched yet (status='draft') — pre-launch, awaiting activate().
// Active   = running now (status not draft/archived, started on/before today).
// Upcoming = active-status but starts later (F12: 'active' is lifecycle, not
//            "running" — a future-dated active camp belongs under Upcoming).
// Archived = retired.

import { programRule } from './programRegistry';

// Badge label + variant read PROGRAM_TYPE_REGISTRY (single source). Locked --as
// tokens only (the render's teal is not a token — §0 anti-drift #1/#2).
export function programBadge(programType) {
  const r = programRule(programType);
  return { label: r.label, variant: r.badgeVariant };
}

export function groupPrograms(programs, today = new Date()) {
  const todayStr = today.toISOString().slice(0, 10);
  const draft = [], active = [], upcoming = [], archived = [];
  for (const p of programs || []) {
    if (p.status === 'draft') draft.push(p);
    else if (p.status === 'archived') archived.push(p);
    else if (p.startDate && p.startDate > todayStr) upcoming.push(p);
    else active.push(p);
  }
  return [
    { key: 'active', label: 'Active · running now', programs: active },
    { key: 'upcoming', label: 'Upcoming · starts later', programs: upcoming },
    { key: 'draft', label: 'Draft · not launched', programs: draft },
    { key: 'archived', label: 'Archived', programs: archived },
  ].filter((g) => g.programs.length > 0);
}
