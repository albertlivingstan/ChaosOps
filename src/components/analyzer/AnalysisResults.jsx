import { ShieldAlert, Cpu, CheckCircle2, Zap, AlertTriangle, Bug } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AnalysisResults({ url, results }) {
  if (!results) return null;

  return (
    <div className="space-y-6 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {results.stats.map((stat, idx) => (
          <div key={idx} className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className={cn("p-2 rounded-lg", stat.colorClass)}>
                <stat.icon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">{stat.label}</h3>
            </div>
            <p className="text-2xl font-bold text-foreground font-mono">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Detected Bugs / Issues */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm hidden md:block">
          <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <Bug className="w-4 h-4 text-destructive" />
            Detected Bugs & Vulnerabilities
          </h3>
          <div className="space-y-3">
            {results.issues.length > 0 ? (
              results.issues.map((issue, idx) => (
                <div key={idx} className="flex gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50">
                  {issue.severity === 'high' ? (
                    <ShieldAlert className="w-5 h-5 text-destructive shrink-0" />
                  ) : issue.severity === 'medium' ? (
                    <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                  )}
                  <div>
                    <h4 className="text-sm font-medium text-foreground">{issue.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{issue.detail}</p>
                    {issue.fix && (
                      <div className="mt-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded inline-block">
                        Fix: {issue.fix}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No critical issues detected.</p>
            )}
          </div>
        </div>

        {/* Service Information */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-primary" />
            Service Dependencies
          </h3>
          <div className="space-y-3">
            {results.services.map((svc, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-secondary/30 border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-success pulse-green"></div>
                  <div>
                    <h4 className="text-sm font-mono font-medium text-foreground">{svc.name}</h4>
                    <p className="text-xs text-muted-foreground">Version: {svc.version}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono text-foreground">{svc.latency}ms</p>
                  <p className="text-[10px] text-muted-foreground uppercase">{svc.type}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="md:hidden bg-card border border-border rounded-xl p-5 shadow-sm">
          <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <Bug className="w-4 h-4 text-destructive" />
            Detected Bugs
          </h3>
          <div className="space-y-3">
            {results.issues.map((issue, idx) => (
              <div key={idx} className="flex gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50">
                {issue.severity === 'high' ? (
                  <ShieldAlert className="w-5 h-5 text-destructive shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
                )}
                <div>
                  <h4 className="text-sm font-medium text-foreground">{issue.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{issue.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
