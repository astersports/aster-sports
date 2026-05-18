// Tournament weekend detection for Wave 3.5 §C3 auto-placeholder flow.
// Pure helpers — no React, no Supabase. Tested in isolation.
//
// hasWeekendDays: true when the [start, end] inclusive date range
// contains at least one Saturday AND one Sunday. Trigger condition for
// the "create placeholder events?" modal.
//
// weekendDaysInRange: returns the actual weekend dates (ISO YYYY-MM-DD)
// that fall in the range — modal pre-checks these per-team rows.

function parseLocalDate(yyyyMmDd) {
  // Anchor at noon to avoid tz boundary flips on the dow calc.
  return new Date(`${yyyyMmDd}T12:00:00`);
}

export function hasWeekendDays(startStr, endStr) {
  if (!startStr || !endStr) return false;
  if (startStr > endStr) return false;
  const start = parseLocalDate(startStr);
  const end = parseLocalDate(endStr);
  let hasSat = false; let hasSun = false;
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dow = d.getDay();
    if (dow === 6) hasSat = true;
    if (dow === 0) hasSun = true;
    if (hasSat && hasSun) return true;
  }
  return false;
}

export function weekendDaysInRange(startStr, endStr) {
  if (!startStr || !endStr) return [];
  if (startStr > endStr) return [];
  const start = parseLocalDate(startStr);
  const end = parseLocalDate(endStr);
  const out = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dow = d.getDay();
    if (dow === 0 || dow === 6) {
      out.push({
        iso: d.toISOString().slice(0, 10),
        dow,
        label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/New_York' }),
      });
    }
  }
  return out;
}
