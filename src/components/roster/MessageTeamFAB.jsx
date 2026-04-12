// Floating action button pinned to the bottom-right of the team
// detail page. Position is fixed so it doesn't scroll with content;
// z-index 40 sits below BottomNav (z-50) and above in-page content.
export default function MessageTeamFAB() {
  return (
    <div style={{
      position: 'fixed',
      bottom: 'calc(80px + env(safe-area-inset-bottom, 0px) + 16px)',
      right: 16,
      zIndex: 40,
    }}>
      <button
        type="button"
        onClick={() => { navigator.vibrate?.(10); /* TODO: navigate to compose with team pre-selected */ }}
        className="sf-press sf-bounce-tap"
        style={{
          width: 56, height: 56, borderRadius: '50%',
          backgroundColor: 'var(--sf-accent)',
          boxShadow: 'var(--sf-shadow-lg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: 'none',
        }}
        aria-label="Message team"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--sf-text-inverse)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </button>
    </div>
  );
}
