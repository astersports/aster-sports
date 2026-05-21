// Shared modal backdrop. Extracted per L99 platform audit P2.5 D3
// (5+ identical callsites). Locks the canonical backdrop contract
// from CLAUDE.md §7: `rgba(0,0,0,0.3)` — never `bg-black/50`
// (anti-pattern #11). Full-screen fixed overlay per anti-pattern
// #18 (no CSS % or dvh for overlay heights).
//
// Callers wrap their modal content as children and stop propagation
// on the inner element to prevent backdrop-click dismissal when
// tapping the content itself.
//
// NOTE: BottomSheet and FullScreenForm intentionally do NOT use
// this component — they carry their own backdrop logic for
// sheet-rise + viewport-pinned sizing. Follow-up PR can consolidate
// if the contracts converge.

export default function ModalBackground({ onClick, zIndex = 1000, children }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
        zIndex,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
