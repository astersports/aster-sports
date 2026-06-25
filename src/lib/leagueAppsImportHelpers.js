// Pure parsing helpers for the LeagueApps import (extracted to keep
// leagueAppsImport.js under the 150-line cap, CLAUDE.md §6).

export function parseDollars(val) {
  if (typeof val === 'number') return Math.round(val * 100);
  const cleaned = String(val).replace(/[$,]/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : Math.round(n * 100);
}

export function normalizeMethod(m) {
  const lower = (m || '').toLowerCase();
  if (lower.includes('zelle')) return 'zelle';
  if (lower.includes('venmo')) return 'venmo';
  if (lower.includes('cash')) return 'cash';
  if (lower.includes('check')) return 'check';
  if (lower.includes('stripe') || lower.includes('card') || lower.includes('credit')) return 'stripe';
  return 'other';
}
