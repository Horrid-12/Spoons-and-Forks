import { useState, useRef, useCallback, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
}

export const PullToRefresh = ({ onRefresh, children }: PullToRefreshProps) => {
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const THRESHOLD = 80;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (refreshing) return;
    const el = containerRef.current;
    if (el && el.scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      setPulling(true);
    }
  }, [refreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling || refreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) {
      setPullDistance(Math.min(delta * 0.5, 120));
    }
  }, [pulling, refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!pulling) return;
    if (pullDistance >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPullDistance(40);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
    setPulling(false);
  }, [pulling, pullDistance, refreshing, onRefresh]);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="flex items-center justify-center overflow-hidden transition-all duration-300"
        style={{ height: pullDistance > 0 || refreshing ? `${refreshing ? 40 : pullDistance}px` : '0px' }}
      >
        {refreshing ? (
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--accent, #5865F2)' }} />
        ) : pullDistance >= THRESHOLD ? (
          <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'var(--accent, #5865F2)' }}>Release to refresh</span>
        ) : (
          <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'var(--onSurfaceVariant, #8e9297)' }}>Pull to refresh</span>
        )}
      </div>
      {children}
    </div>
  );
};
