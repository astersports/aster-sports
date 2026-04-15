export function groupByDate(list) {
  const groups = {};
  list.forEach((a) => {
    const d = a.start_at ? a.start_at.slice(0, 10) : 'unknown';
    if (!groups[d]) groups[d] = [];
    groups[d].push(a);
  });
  return Object.entries(groups);
}

export function formatDateHeader(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  const today = new Date().toISOString().slice(0, 10);
  const label = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  return dateStr === today ? `${label} · TODAY` : label;
}
