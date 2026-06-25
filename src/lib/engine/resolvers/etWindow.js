// Shared ET-anchored event-window bound for the briefing resolvers.
//
// The resolvers filter events with `.lte('start_at', <upperBound>)` where the
// window is a YYYY-MM-DD date string. A naive `${end}T23:59:59Z` upper bound
// is UTC, so a Saturday-night ET game (e.g. 9pm ET = 01:00 UTC Sunday) falls
// OUTSIDE the window and silently drops from the briefing. This builds the
// END-of-ET-day instant for the given date so the window covers the whole ET
// day regardless of the runtime/host timezone.

const NY_TZ = 'America/New_York';

// UTC ISO timestamp for 23:59:59.999 ET on the given YYYY-MM-DD date.
// DST-safe: derives the ET→UTC offset for that specific date via Intl.
export function etDayEndUtc(dateStr) {
  // ET wall-clock end-of-day for the date.
  const [y, m, d] = dateStr.split('-').map(Number);
  // Find the UTC offset (minutes) ET is behind UTC on this date by formatting
  // a noon-UTC instant (stable, never crosses the date) back into ET parts.
  const noonUtc = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const etHour = Number(
    new Intl.DateTimeFormat('en-US', { timeZone: NY_TZ, hour: '2-digit', hour12: false }).format(noonUtc),
  );
  // noonUtc is 12:00 UTC; etHour is the ET hour at that instant → offset.
  const offsetHours = 12 - (etHour === 24 ? 0 : etHour); // 4 (EDT) or 5 (EST)
  // 23:59:59.999 ET == (24:00 - offset) UTC of the same date, minus 1ms.
  return new Date(Date.UTC(y, m - 1, d, 23 + offsetHours, 59, 59, 999)).toISOString();
}
