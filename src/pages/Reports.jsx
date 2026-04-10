import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import TopBar from '@/components/layout/TopBar';
import ReportCard from '@/components/reports/ReportCard';
import PdfExportButton from '@/components/reports/PdfExportButton';
import { FileText, CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';

const STATUS_FILTERS = [
  { value: 'all', label: 'All', icon: FileText },
  { value: 'completed', label: 'Completed', icon: CheckCircle },
  { value: 'failed', label: 'Failed', icon: XCircle },
  { value: 'aborted', label: 'Aborted', icon: AlertTriangle },
  { value: 'running', label: 'Running', icon: Clock },
];

export default function Reports() {
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.ChaosExperiment.list('-created_date', 100);
    setExperiments(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = filterStatus === 'all'
    ? experiments
    : experiments.filter(e => e.status === filterStatus);

  const counts = {
    completed: experiments.filter(e => e.status === 'completed').length,
    failed: experiments.filter(e => e.status === 'failed').length,
    aborted: experiments.filter(e => e.status === 'aborted').length,
  };

  return (
    <div>
      <TopBar
        title="Experiment Reports"
        subtitle="PDF-ready summaries & AI post-mortem analysis"
        onRefresh={load}
      />
      <div className="p-6 space-y-6">

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-success shrink-0" />
            <div>
              <p className="text-2xl font-bold font-mono text-foreground">{counts.completed}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <XCircle className="w-5 h-5 text-destructive shrink-0" />
            <div>
              <p className="text-2xl font-bold font-mono text-foreground">{counts.failed}</p>
              <p className="text-xs text-muted-foreground">Failed</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
            <div>
              <p className="text-2xl font-bold font-mono text-foreground">{counts.aborted}</p>
              <p className="text-xs text-muted-foreground">Aborted</p>
            </div>
          </div>
        </div>

        {/* Filters + export */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-2 flex-wrap">
            {STATUS_FILTERS.map(f => {
              const Icon = f.icon;
              const active = filterStatus === f.value;
              return (
                <button
                  key={f.value}
                  onClick={() => setFilterStatus(f.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {f.label}
                  {f.value !== 'all' && (
                    <span className={`ml-0.5 ${active ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      ({experiments.filter(e => e.status === f.value).length})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <PdfExportButton experiments={filtered} filterStatus={filterStatus} />
        </div>

        {/* Report cards */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-card border border-border rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <p className="text-base font-medium text-foreground">No experiments match this filter</p>
            <p className="text-sm text-muted-foreground">Try a different status filter or run some experiments first.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(exp => (
              <ReportCard key={exp.id} experiment={exp} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}