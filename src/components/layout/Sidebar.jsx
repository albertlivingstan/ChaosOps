import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Zap, Server, Bell, Activity, GitBranch, Settings, ChevronRight, FileText,
  BookOpen, Calendar, Map
} from 'lucide-react';

const navGroups = [
  {
    label: 'Platform',
    items: [
      { path: '/', label: 'Overview', icon: LayoutDashboard },
      { path: '/experiments', label: 'Experiments', icon: Zap },
      { path: '/library', label: 'Experiment Library', icon: BookOpen },
      { path: '/scheduler', label: 'Scheduler & GameDay', icon: Calendar },
    ],
  },
  {
    label: 'Observability',
    items: [
      { path: '/services', label: 'Services', icon: Server },
      { path: '/monitoring', label: 'Monitoring', icon: Activity },
      { path: '/infra-map', label: 'Infra Map', icon: Map },
      { path: '/alerts', label: 'Alerts', icon: Bell },
      { path: '/reports', label: 'Reports', icon: FileText },
      { path: '/pipeline', label: 'CI/CD Pipeline', icon: GitBranch },
    ],
  },
];

export default function Sidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-card border-r border-border flex flex-col z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
          <Zap className="w-4 h-4 text-primary" />
        </div>
        <div>
          <span className="font-semibold text-foreground text-sm tracking-wide">ChaosOps</span>
          <div className="text-xs text-muted-foreground font-mono">v2.4.1</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        {navGroups.map(group => (
          <div key={group.label}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-3 mb-2">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map(({ path, label, icon: Icon }) => {
                const active = pathname === path;
                return (
                  <Link
                    key={path}
                    to={path}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 group',
                      active
                        ? 'bg-primary/15 text-primary font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1 text-sm">{label}</span>
                    {active && <ChevronRight className="w-3 h-3 opacity-60" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 border-t border-border pt-4">
        <Link
          to="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </Link>
        <div className="mt-3 mx-3 px-3 py-2 bg-success/10 border border-success/20 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success pulse-green inline-block" />
            <span className="text-xs text-success font-medium">Cluster Online</span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 font-mono">k8s-prod-01</div>
        </div>
      </div>
    </aside>
  );
}