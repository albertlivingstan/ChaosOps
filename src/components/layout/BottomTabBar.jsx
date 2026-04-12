import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Zap, BookOpen, Map, Bell, Settings, Globe } from 'lucide-react';

const tabs = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/experiments', label: 'Chaos', icon: Zap },
  { path: '/library', label: 'Library', icon: BookOpen },
  { path: '/web-analyzer', label: 'Web', icon: Globe },
  { path: '/infra-map', label: 'Infra', icon: Map },
  { path: '/alerts', label: 'Alerts', icon: Bell },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function BottomTabBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const handleTabPress = (path) => {
    if (pathname === path) {
      // Already on this tab root — no-op (already at root)
      // If deeper in a tab stack, pop back to root
      navigate(path, { replace: true });
    } else {
      navigate(path);
    }
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-sm border-t border-border flex items-stretch"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {tabs.map(({ path, label, icon: Icon }) => {
        const active = pathname === path || (path !== '/' && pathname.startsWith(path));
        return (
          <button
            key={path}
            onClick={() => handleTabPress(path)}
            className={cn(
              'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] font-medium transition-colors active:opacity-70',
              active ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <Icon className={cn('w-5 h-5 transition-all', active && 'drop-shadow-[0_0_6px_hsl(var(--primary)/0.6)] scale-110')} />
            <span className={cn('transition-colors', active && 'text-primary')}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}