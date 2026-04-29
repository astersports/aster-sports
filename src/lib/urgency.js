// Maps secondsUntil into the urgency CSS class used on countdown spans
// across NextUpCardMin/Med/Max and ThisWeekRow. Returns '' for >24h
// (the base sf-countdown class supplies the default accent color).
export function urgencyClass(secondsUntil) {
  if (secondsUntil < 3600) return 'sf-urgency-1h';
  if (secondsUntil < 21600) return 'sf-urgency-6h';
  if (secondsUntil < 86400) return 'sf-urgency-24h';
  return '';
}
