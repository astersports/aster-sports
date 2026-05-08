// Lightweight phone formatter for parent-facing surfaces.
// On blur in profile forms, normalize to "(XXX) XXX-XXXX" when the input
// looks like a 10-digit US number. Falls back to whatever the user typed
// (international, partial, extension) so we don't destroy non-US numbers.

export function formatPhone(input) {
  const raw = String(input ?? '').trim();
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return raw;
}
