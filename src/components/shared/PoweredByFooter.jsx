// "Powered by Aster Sports" attribution — the gold constellation mark + a link
// to astersports.io. Per the brand model (CLAUDE.md): the app is Aster Sports,
// tenant brands live post-auth, and every surface carries the "Powered by"
// mark. Mounted in AppShell (every authenticated page) + the non-shell public
// pages so it appears on each page. `links` adds Privacy/Terms (public pages).
export default function PoweredByFooter({ links = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexWrap: 'wrap', padding: '24px 16px 12px', fontSize: 12, color: 'var(--as-text-tertiary)' }}>
      <a href="https://astersports.io/" target="_blank" rel="noopener noreferrer" aria-label="Powered by Aster Sports"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'inherit', fontWeight: 500, textDecoration: 'none' }}>
        <img src="/brand/aster-mark-gold.svg" alt="" width={14} height={14} style={{ display: 'block' }} />
        Powered by Aster Sports
      </a>
      {links && (
        <span>· <a href="/privacy" style={{ color: 'inherit', textDecoration: 'underline' }}>Privacy</a> · <a href="/terms" style={{ color: 'inherit', textDecoration: 'underline' }}>Terms</a></span>
      )}
    </div>
  );
}
