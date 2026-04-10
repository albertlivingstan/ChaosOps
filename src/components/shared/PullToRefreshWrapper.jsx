import { useRef } from 'react';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PullToRefreshWrapper({ onRefresh, children, className }) {
  const containerRef = useRef(null);
  const { pullDistance, refreshing } = usePullToRefresh(onRefresh, containerRef);

  const THRESHOLD = 72;
  const triggered = pullDistance >= THRESHOLD;

  return (
    <div ref={containerRef} className={cn('overflow-y-auto h-full', className)} style={{ overscrollBehavior: 'none' }}>
      {/* Pull indicator */}
      <div
        className="flex items-center justify-center overflow-hidden transition-[height] duration-150 ease-out"
        style={{ height: pullDistance > 0 ? `${pullDistance}px` : refreshing ? `${THRESHOLD}px` : 0 }}
      >
        <div className={cn(
          'flex items-center gap-2 text-xs font-medium transition-colors',
          triggered || refreshing ? 'text-primary' : 'text-muted-foreground'
        )}>
          <RefreshCw className={cn('w-4 h-4 transition-transform', refreshing && 'animate-spin', triggered && !refreshing && 'rotate-180')} />
          {refreshing ? 'Refreshing…' : triggered ? 'Release to refresh' : 'Pull to refresh'}
        </div>
      </div>
      {children}
    </div>
  );
}