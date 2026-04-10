import { format } from 'date-fns';
import StatusBadge from '@/components/shared/StatusBadge';
import PostMortemSection from './PostMortemSection';
import { Server, AlertTriangle, Clock, Zap, Timer } from 'lucide-react';

const intensityColor = { low: 'text-success', medium: 'text-warning', high: 'text-destructive', critical: 'text-destructive' };

export default function ReportCard({ experiment, forPdf = false }) {
  return (
    <div
      id={`report-${experiment.id}`}
      className={`bg-card border border-border rounded-xl p-5 ${forPdf ? '' : 'hover:border-primary/20 transition-colors'}`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="font-semibold text-foreground">{experiment.name}</h3>
              <StatusBadge status={experiment.status} />
              <span className={`text-xs font-medium uppercase tracking-wide ${intensityColor[experiment.intensity] || 'text-muted-foreground'}`}>
                {experiment.intensity}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground font-mono flex-wrap">
              <span className="flex items-center gap-1.5"><Server className="w-3 h-3" />{experiment.target_service}</span>
              <span className="flex items-center gap-1.5"><AlertTriangle className="w-3 h-3" />{experiment.chaos_type?.replace(/_/g, ' ')}</span>
              <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" />{experiment.duration_seconds}s duration</span>
              {experiment.recovery_time_seconds != null && (
                <span className="flex items-center gap-1.5"><Timer className="w-3 h-3" />{experiment.recovery_time_seconds}s recovery</span>
              )}
              {experiment.completed_at && (
                <span>{format(new Date(experiment.completed_at), 'MMM d, yyyy HH:mm')}</span>
              )}
            </div>
            {experiment.result_summary && (
              <p className="mt-2 text-xs text-muted-foreground bg-secondary rounded-md px-3 py-1.5">{experiment.result_summary}</p>
            )}
          </div>
        </div>
      </div>

      {/* Post-mortem — only for completed/failed */}
      {!forPdf && ['completed', 'failed', 'aborted'].includes(experiment.status) && (
        <PostMortemSection experiment={experiment} />
      )}
    </div>
  );
}