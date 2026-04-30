export function groupByDate(list) {
  const groups = {};
  list.forEach((a) => {
    const d = a.start_at
      ? new Date(a.start_at).toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
      : 'unknown';
    if (!groups[d]) groups[d] = [];
    groups[d].push(a);
  });
  return Object.entries(groups);
}

export function formatDateHeader(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
  const label = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  return dateStr === today ? `${label} · TODAY` : label;
}
