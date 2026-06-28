// L99 enhancement pass — pure helpers for the admin members directory.
// Search/filter/sort + display derivations, kept side-effect-free so the
// page stays thin and the logic is unit-testable. No IO, no tokens.

// Substring match across guardian name / email / phone + kid names.
export function matchesGuardian(g, q) {
  if (!q) return true;
  const haystack = [
    g.first_name, g.last_name, g.email, g.phone,
    ...(g.kids || []).flatMap((k) => [k.first_name, k.last_name]),
  ].filter(Boolean).join(' ').toLowerCase();
  return haystack.includes(q.toLowerCase());
}

// Link-state filter: all guardians, only those with linked kids, or only
// those missing kid links (the admin's "needs attention" view).
export function passesLinkFilter(g, filter) {
  const count = (g.kids || []).length;
  if (filter === 'linked') return count > 0;
  if (filter === 'unlinked') return count === 0;
  return true;
}

export const fullName = (g) =>
  `${g.first_name || ''} ${g.last_name || ''}`.trim() || '(unnamed)';

export const kidNames = (g) =>
  (g.kids || [])
    .map((k) => `${k.first_name || ''} ${k.last_name || ''}`.trim())
    .filter(Boolean);

export const contactLine = (g) => [g.email, g.phone].filter(Boolean).join(' · ');

export const initialsOf = (g) => {
  const parts = [g.first_name, g.last_name].filter(Boolean);
  const letters = parts.map((p) => p[0]?.toUpperCase()).filter(Boolean).join('');
  return letters || '?';
};

// Sort comparator factory. 'name' = last,first asc (matches the hook's
// query order); 'kids' = most kid links first, name tiebreak.
export function sortGuardians(list, sortKey) {
  const byName = (a, b) =>
    `${a.last_name || ''}${a.first_name || ''}`.localeCompare(
      `${b.last_name || ''}${b.first_name || ''}`,
      undefined, { sensitivity: 'base' },
    );
  const copy = [...list];
  if (sortKey === 'kids') {
    copy.sort((a, b) => (b.kids?.length || 0) - (a.kids?.length || 0) || byName(a, b));
  } else {
    copy.sort(byName);
  }
  return copy;
}

// Aggregate counts for the summary stat row.
export function summarize(guardians) {
  const list = guardians || [];
  const kidLinks = list.reduce((s, g) => s + (g.kids?.length || 0), 0);
  const unlinked = list.filter((g) => (g.kids?.length || 0) === 0).length;
  return { guardians: list.length, kidLinks, unlinked };
}
