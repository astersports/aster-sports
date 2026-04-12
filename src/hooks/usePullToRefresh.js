import { useState, useRef, useCallback } from 'react';

export function usePullToRefresh(onRefresh) {
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);

  const onTouchStart = useCallback((e) => {
    if (window.scrollY === 0 || e.currentTarget.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    }
  }, []);

  const onTouchEnd = useCallback(async (e) => {
    if (!pulling.current) return;
    pulling.current = false;
    const diff = e.changedTouches[0].clientY - startY.current;
    if (diff > 80) {
      setRefreshing(true);
      navigator.vibrate?.(20);
      await onRefresh?.();
      setRefreshing(false);
    }
  }, [onRefresh]);

  return { refreshing, onTouchStart, onTouchEnd };
}
