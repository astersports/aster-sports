// Single source for public (unauthenticated) share URLs. The
// /schedule/:teamId route (App.jsx) renders PublicSchedulePage with no
// auth gate, so this URL is safe to put on a QR / share to families.
export function publicScheduleUrl(teamId, origin) {
  const base = origin || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}/schedule/${teamId}`;
}
