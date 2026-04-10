import { useEffect, useRef, useState } from 'react';

const THRESHOLD = 72; // px pulled before triggering
const RESISTANCE = 2.5; // drag resistance factor

export function usePullToRefresh(onRefresh, containerRef) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const pulling = useRef(false);

  useEffect(() => {
    const el = containerRef?.current;
    if (!el) return;

    const onTouchStart = (e) => {
      if (el.scrollTop === 0) {
        startY.current = e.touches[0].clientY;
        pulling.current = true;
      }
    };

    const onTouchMove = (e) => {
      if (!pulling.current || startY.current === null) return;
      const delta = (e.touches[0].clientY - startY.current) / RESISTANCE;
      if (delta > 0 && el.scrollTop === 0) {
        setPullDistance(Math.min(delta, THRESHOLD * 1.5));
        if (delta > 10) e.preventDefault(); // prevent scroll while pulling
      }
    };

    const onTouchEnd = async () => {
      if (!pulling.current) return;
      pulling.current = false;
      startY.current = null;
      if (pullDistance >= THRESHOLD && !refreshing) {
        setRefreshing(true);
        setPullDistance(THRESHOLD);
        await onRefresh();
        setRefreshing(false);
      }
      setPullDistance(0);
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [containerRef, onRefresh, pullDistance, refreshing]);

  return { pullDistance, refreshing };
}