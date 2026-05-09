// Shared HTML escape helper for engine renderers. Wave-1 renderers each
// inline their own copy; new wave-2 renderers import this single source.
// Don't backport into wave-1 in this wave — out of scope.

export function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
