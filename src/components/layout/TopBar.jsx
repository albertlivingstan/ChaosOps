import { Bell, Search, RefreshCw, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useLocation, useNavigate } from 'react-router-dom';

export default function TopBar({ title, subtitle, onRefresh }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isRoot = pathname === '/';

  return (
    <header
      className="border-b border-border bg-card/50 backdrop-blur-sm flex flex-col sticky top-0 z-30"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="h-14 flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          {/* Mobile back button */}
          {!isRoot && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 md:hidden"
              onClick={() => navigate(-1)}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}
          <div>
            <h1 className="text-base font-semibold text-foreground">{title}</h1>
            {subtitle && <p className="text-xs text-muted-foreground hidden md:block">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input placeholder="Search..." className="pl-9 h-8 w-48 bg-secondary border-border text-sm" />
          </div>
          {onRefresh && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onRefresh}>
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8 relative">
            <Bell className="w-3.5 h-3.5" />
            <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-destructive">3</Badge>
          </Button>
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-semibold">
            AD
          </div>
        </div>
      </div>
    </header>
  );
}