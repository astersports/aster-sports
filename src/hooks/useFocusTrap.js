import { useEffect, useRef } from 'react';

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Captures Tab/Shift-Tab inside `containerRef`, autoFocuses the first
// focusable child on open, and restores focus to the previously-focused
// element on unmount. Pass `enabled=false` to disable when the modal is
// not visible (avoids stealing focus from the page underneath).
export function useFocusTrap(enabled = true) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!enabled) return undefined;
    const container = containerRef.current;
    if (!container) return undefined;
    const previouslyFocused = document.activeElement;

    const focusables = () => Array.from(container.querySelectorAll(FOCUSABLE));
    const first = focusables()[0];
    if (first) Promise.resolve().then(() => first.focus());

    const handleKey = (e) => {
      if (e.key !== 'Tab') return;
      const list = focusables();
      if (list.length === 0) return;
      const firstEl = list[0];
      const lastEl = list[list.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    container.addEventListener('keydown', handleKey);
    return () => {
      container.removeEventListener('keydown', handleKey);
      if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus();
    };
  }, [enabled]);

  return containerRef;
}
