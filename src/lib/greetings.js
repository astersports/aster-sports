// Pure-functional greeting helpers extracted from ParentHomePage so the
// page has headroom under the 150-line cap. NY-anchored greeting matches
// the rest of the codebase per 3d-d.

export function firstNameFrom(user) {
  const f = (user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || '').split(/[\s.@]/)[0];
  return f ? f.charAt(0).toUpperCase() + f.slice(1) : 'there';
}

export function greetingFor() {
  const h = parseInt(new Date().toLocaleString('en-US', { timeZone: 'America/New_York', hour: 'numeric', hour12: false }), 10);
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}
