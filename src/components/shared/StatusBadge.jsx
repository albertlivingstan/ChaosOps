import { cn } from '@/lib/utils';

const statusConfig = {
  healthy: { label: 'Healthy', dot: 'bg-success', text: 'text-success', bg: 'bg-success/10', border: 'border-success/20' },
  degraded: { label: 'Degraded', dot: 'bg-warning', text: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20' },
  down: { label: 'Down', dot: 'bg-destructive', text: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/20' },
  recovering: { label: 'Recovering', dot: 'bg-primary', text: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
  running: { label: 'Running', dot: 'bg-primary', text: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
  completed: { label: 'Completed', dot: 'bg-success', text: 'text-success', bg: 'bg-success/10', border: 'border-success/20' },
  failed: { label: 'Failed', dot: 'bg-destructive', text: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/20' },
  pending: { label: 'Pending', dot: 'bg-muted-foreground', text: 'text-muted-foreground', bg: 'bg-muted', border: 'border-border' },
  aborted: { label: 'Aborted', dot: 'bg-warning', text: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20' },
  critical: { label: 'Critical', dot: 'bg-destructive pulse-red', text: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/20' },
  warning: { label: 'Warning', dot: 'bg-warning', text: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20' },
  info: { label: 'Info', dot: 'bg-primary', text: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
};

export default function StatusBadge({ status, className }) {
  const cfg = statusConfig[status] || statusConfig.info;
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
      cfg.bg, cfg.text, cfg.border, className
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
      {cfg.label}
    </span>
  );
}