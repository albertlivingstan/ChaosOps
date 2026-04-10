import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertTriangle, Shield, Zap, Server, Database, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

const RISK_COLORS = {
  direct: { bg: 'bg-destructive/20', border: 'border-destructive/50', text: 'text-destructive', label: 'Direct Hit' },
  indirect: { bg: 'bg-warning/20', border: 'border-warning/50', text: 'text-warning', label: 'Indirect Risk' },
  safe: { bg: 'bg-success/10', border: 'border-success/30', text: 'text-success', label: 'Safe' },
};

const INTENSITY_BLAST = { low: 1, medium: 2, high: 3, critical: 4 };

// Simple mock dependency map — in production this would come from service mesh data
const DEPENDENCY_MAP = {
  'api-gateway': ['auth-service', 'user-service', 'payment-service'],
  'auth-service': ['user-service', 'postgres-db', 'redis-cache'],
  'user-service': ['postgres-db', 'notification-service'],
  'payment-service': ['postgres-db', 'user-service'],
  'notification-service': ['redis-cache'],
  'postgres-db': [],
  'redis-cache': [],
};

function getBlastRadius(targetService, intensity, allServices) {
  const blast = INTENSITY_BLAST[intensity] || 2;
  const directDeps = DEPENDENCY_MAP[targetService] || [];
  const indirectDeps = [];

  if (blast >= 2) {
    directDeps.forEach(dep => {
      const transitive = DEPENDENCY_MAP[dep] || [];
      transitive.forEach(t => {
        if (!directDeps.includes(t) && t !== targetService) indirectDeps.push(t);
      });
    });
  }

  return allServices.map(svc => {
    if (svc.name === targetService) return { ...svc, risk: 'direct', reason: 'Primary target' };
    if (directDeps.includes(svc.name)) return { ...svc, risk: 'direct', reason: 'Direct dependency' };
    if (blast >= 2 && indirectDeps.includes(svc.name)) return { ...svc, risk: 'indirect', reason: 'Transitive dependency' };
    return { ...svc, risk: 'safe', reason: 'Not in blast radius' };
  });
}

export default function BlastRadiusVisualizer({ targetService, intensity }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Microservice.list().then(s => {
      // Merge with demo services if empty
      const display = s.length ? s : [
        { id: 'd1', name: 'api-gateway' }, { id: 'd2', name: 'auth-service' },
        { id: 'd3', name: 'user-service' }, { id: 'd4', name: 'payment-service' },
        { id: 'd5', name: 'notification-service' }, { id: 'd6', name: 'postgres-db' },
        { id: 'd7', name: 'redis-cache' },
      ];
      setServices(display);
      setLoading(false);
    });
  }, []);

  if (!targetService || !intensity) return null;

  const analyzed = getBlastRadius(targetService, intensity, services);
  const direct = analyzed.filter(s => s.risk === 'direct');
  const indirect = analyzed.filter(s => s.risk === 'indirect');
  const safe = analyzed.filter(s => s.risk === 'safe');

  const overallRisk = direct.length >= 4 ? 'critical'
    : direct.length >= 2 || intensity === 'high' ? 'high'
    : direct.length === 1 && indirect.length <= 2 ? 'medium' : 'low';

  const riskLevelColors = {
    low: 'text-success bg-success/10 border-success/30',
    medium: 'text-warning bg-warning/10 border-warning/30',
    high: 'text-destructive bg-destructive/10 border-destructive/30',
    critical: 'text-destructive bg-destructive/15 border-destructive/50',
  };

  const getNodeIcon = (name) => {
    if (name?.includes('db') || name?.includes('data')) return Database;
    if (name?.includes('gateway') || name?.includes('api')) return Globe;
    return Server;
  };

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-warning" />
          <span className="text-xs font-semibold text-foreground uppercase tracking-wide">Blast Radius Preview</span>
        </div>
        <span className={cn('text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wide', riskLevelColors[overallRisk])}>
          {overallRisk} risk · {direct.length} affected
        </span>
      </div>

      {loading ? (
        <div className="h-16 bg-secondary rounded-lg animate-pulse" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {Object.entries({ direct, indirect, safe }).map(([riskType, svcs]) => {
            const cfg = RISK_COLORS[riskType];
            return (
              <div key={riskType} className={cn('rounded-lg border p-3', cfg.bg, cfg.border)}>
                <p className={cn('text-[10px] font-semibold uppercase tracking-wide mb-2', cfg.text)}>
                  {cfg.label} ({svcs.length})
                </p>
                <div className="space-y-1">
                  {svcs.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground">None</p>
                  ) : svcs.map(svc => {
                    const Icon = getNodeIcon(svc.name);
                    return (
                      <div key={svc.id} className="flex items-center gap-1.5 text-[10px]">
                        <Icon className={cn('w-3 h-3 shrink-0', cfg.text)} />
                        <span className="text-foreground font-mono truncate">{svc.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}