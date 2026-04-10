import { useState } from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const DEFAULT_THRESHOLDS = {
  latency_ms: 500,
  error_rate: 5,
  cpu: 90,
};

function ThresholdBar({ label, value, max, threshold, unit, breach }) {
  const pct = Math.min(100, (value / max) * 100);
  const thresholdPct = Math.min(100, (threshold / max) * 100);
  return (
    <div>
      <div className="flex items-center justify-between text-[10px] mb-1">
        <span className="text-muted-foreground uppercase tracking-wide">{label}</span>
        <span className={cn('font-mono font-semibold', breach ? 'text-destructive' : 'text-foreground')}>
          {value}{unit} <span className="text-muted-foreground font-normal">/ {threshold}{unit} max</span>
        </span>
      </div>
      <div className="relative h-2 bg-secondary rounded-full overflow-visible">
        {/* Threshold marker */}
        <div className="absolute top-0 h-full w-0.5 bg-warning/60 z-10" style={{ left: `${thresholdPct}%` }} />
        {/* Value bar */}
        <div
          className={cn('h-full rounded-full transition-all duration-500', breach ? 'bg-destructive' : 'bg-success')}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function SteadyStateMonitor({ metrics, experiment, onAbort }) {
  const [thresholds] = useState(DEFAULT_THRESHOLDS);

  if (!metrics || experiment?.status !== 'running') return null;

  const breaches = {
    latency: metrics.latency > thresholds.latency_ms,
    error: metrics.errorRate > thresholds.error_rate,
    cpu: metrics.cpu > thresholds.cpu,
  };
  const anyBreach = Object.values(breaches).some(Boolean);
  const breachCount = Object.values(breaches).filter(Boolean).length;

  return (
    <div className={cn(
      'mt-3 rounded-lg border p-3 transition-colors',
      anyBreach ? 'border-destructive/40 bg-destructive/5' : 'border-success/30 bg-success/5'
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {anyBreach
            ? <ShieldAlert className="w-3.5 h-3.5 text-destructive" />
            : <ShieldCheck className="w-3.5 h-3.5 text-success" />}
          <span className={cn('text-xs font-semibold uppercase tracking-wide', anyBreach ? 'text-destructive' : 'text-success')}>
            Steady State {anyBreach ? `BREACH (${breachCount})` : 'OK'}
          </span>
        </div>
        {anyBreach && (
          <button
            onClick={onAbort}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors animate-pulse"
          >
            <AlertTriangle className="w-3 h-3" /> AUTO-ABORT
          </button>
        )}
      </div>

      <div className="space-y-2.5">
        <ThresholdBar label="Latency" value={metrics.latency} max={Math.max(metrics.latency * 1.5, thresholds.latency_ms * 1.2)} threshold={thresholds.latency_ms} unit="ms" breach={breaches.latency} />
        <ThresholdBar label="Error Rate" value={metrics.errorRate} max={Math.max(metrics.errorRate * 1.5, thresholds.error_rate * 3)} threshold={thresholds.error_rate} unit="%" breach={breaches.error} />
        <ThresholdBar label="CPU" value={metrics.cpu} max={100} threshold={thresholds.cpu} unit="%" breach={breaches.cpu} />
      </div>

      {!anyBreach && (
        <div className="flex items-center gap-1.5 mt-2 text-[10px] text-success">
          <CheckCircle className="w-3 h-3" />
          All metrics within steady-state thresholds
        </div>
      )}
    </div>
  );
}