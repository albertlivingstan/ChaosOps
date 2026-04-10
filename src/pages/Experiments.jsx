import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import TopBar from '@/components/layout/TopBar';
import StatusBadge from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Zap, Play, Square, Trash2, Clock, Server, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import LiveMetricsDashboard from '@/components/experiments/LiveMetricsDashboard';
import PullToRefreshWrapper from '@/components/shared/PullToRefreshWrapper';
import SteadyStateMonitor from '@/components/experiments/SteadyStateMonitor';
import BlastRadiusVisualizer from '@/components/experiments/BlastRadiusVisualizer';
import BigRedButton from '@/components/experiments/BigRedButton';
import { useLiveMetrics } from '@/hooks/useLiveMetrics';

const CHAOS_TYPES = ['pod_kill', 'network_latency', 'cpu_stress', 'memory_stress', 'disk_fill', 'service_crash', 'network_loss'];
const INTENSITIES = ['low', 'medium', 'high', 'critical'];

const intensityColor = { low: 'text-success', medium: 'text-warning', high: 'text-destructive', critical: 'text-destructive' };

// Wrapper that gives SteadyStateMonitor access to live metrics
function RunningExperimentExtras({ exp, service, onAbort }) {
  const { current } = useLiveMetrics(exp, service);
  return (
    <>
      <SteadyStateMonitor metrics={current} experiment={exp} onAbort={() => onAbort(exp.id)} />
      <div className="mt-3">
        <BigRedButton experimentName={exp.name} onRollback={() => onAbort(exp.id)} />
      </div>
    </>
  );
}

export default function Experiments() {
  const [experiments, setExperiments] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', target_service: '', chaos_type: '', intensity: 'medium', duration_seconds: 60, auto_abort: true });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [e, s] = await Promise.all([
      base44.entities.ChaosExperiment.list('-created_date', 50),
      base44.entities.Microservice.list(),
    ]);
    setExperiments(e);
    setServices(s);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    setSaving(true);
    await base44.entities.ChaosExperiment.create({ ...form, status: 'pending' });
    setShowForm(false);
    setForm({ name: '', target_service: '', chaos_type: '', intensity: 'medium', duration_seconds: 60, auto_abort: true });
    await load();
    setSaving(false);
  };

  const handleStatusChange = async (id, newStatus) => {
    // Optimistic update
    setExperiments(prev => prev.map(e => e.id === id ? {
      ...e,
      status: newStatus,
      ...(newStatus === 'running' ? { started_at: new Date().toISOString() } : {}),
      ...(newStatus === 'completed' || newStatus === 'aborted' ? { completed_at: new Date().toISOString() } : {}),
    } : e));
    await base44.entities.ChaosExperiment.update(id, {
      status: newStatus,
      ...(newStatus === 'running' ? { started_at: new Date().toISOString() } : {}),
      ...(newStatus === 'completed' || newStatus === 'aborted' ? { completed_at: new Date().toISOString() } : {}),
    });
  };

  const handleDelete = async (id) => {
    // Optimistic remove
    setExperiments(prev => prev.filter(e => e.id !== id));
    await base44.entities.ChaosExperiment.delete(id);
  };

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="Chaos Experiments"
        subtitle="Inject controlled failures into your services"
        onRefresh={load}
      />
      <PullToRefreshWrapper onRefresh={load} className="flex-1">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-4 text-sm">
            {['pending','running','completed','failed'].map(s => (
              <div key={s} className="flex items-center gap-2">
                <StatusBadge status={s} />
                <span className="text-muted-foreground">{experiments.filter(e => e.status === s).length}</span>
              </div>
            ))}
          </div>
          <Button onClick={() => setShowForm(true)} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="w-4 h-4" /> New Experiment
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-card border border-border rounded-xl animate-pulse" />)}</div>
        ) : experiments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><Zap className="w-6 h-6 text-primary" /></div>
            <p className="text-base font-medium text-foreground">No experiments yet</p>
            <p className="text-sm text-muted-foreground">Create your first chaos experiment to test system resilience.</p>
            <Button onClick={() => setShowForm(true)} className="mt-2 gap-2">
              <Plus className="w-4 h-4" /> New Experiment
            </Button>
          </div>
        ) : (
          <AnimatePresence>
            <div className="space-y-3">
              {experiments.map(exp => (
                <motion.div
                key={exp.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-card border rounded-xl p-5 transition-colors ${exp.status === 'running' ? 'border-primary/40 shadow-[0_0_16px_hsl(var(--primary)/0.08)]' : 'border-border hover:border-primary/20'}`}
                >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${exp.status === 'running' ? 'bg-primary/20' : 'bg-primary/10'}`}>
                      <Zap className={`w-4 h-4 text-primary ${exp.status === 'running' ? 'animate-pulse' : ''}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-semibold text-foreground">{exp.name}</h3>
                        <StatusBadge status={exp.status} />
                        <span className={`text-xs font-medium uppercase tracking-wide ${intensityColor[exp.intensity] || 'text-muted-foreground'}`}>{exp.intensity}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground font-mono flex-wrap">
                        <span className="flex items-center gap-1.5"><Server className="w-3 h-3" />{exp.target_service}</span>
                        <span className="flex items-center gap-1.5"><AlertTriangle className="w-3 h-3" />{exp.chaos_type?.replace(/_/g,' ')}</span>
                        <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" />{exp.duration_seconds}s</span>
                        {exp.created_date && <span>{format(new Date(exp.created_date), 'MMM d, HH:mm')}</span>}
                      </div>
                      {exp.result_summary && (
                        <p className="mt-2 text-xs text-muted-foreground bg-secondary rounded-md px-3 py-1.5">{exp.result_summary}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {exp.status === 'pending' && (
                      <Button size="sm" variant="outline" className="h-8 gap-1.5 text-success border-success/30 hover:bg-success/10" onClick={() => handleStatusChange(exp.id, 'running')}>
                        <Play className="w-3 h-3" /> Run
                      </Button>
                    )}
                    {exp.status === 'running' && (
                      <Button size="sm" variant="outline" className="h-8 gap-1.5 text-warning border-warning/30 hover:bg-warning/10" onClick={() => handleStatusChange(exp.id, 'aborted')}>
                        <Square className="w-3 h-3" /> Abort
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(exp.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Blast radius — show for pending experiments */}
                {exp.status === 'pending' && (
                  <BlastRadiusVisualizer targetService={exp.target_service} intensity={exp.intensity} />
                )}

                {/* Live metrics + steady state + rollback — only when running */}
                <LiveMetricsDashboard
                  experiment={exp}
                  service={services.find(s => s.name === exp.target_service)}
                />
                {exp.status === 'running' && (
                  <RunningExperimentExtras
                    exp={exp}
                    service={services.find(s => s.name === exp.target_service)}
                    onAbort={(id) => handleStatusChange(id, 'aborted')}
                  />
                )}
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
      </PullToRefreshWrapper>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-card border-border text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Zap className="w-4 h-4 text-primary" /> New Chaos Experiment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Experiment Name</Label>
              <Input placeholder="e.g. Kill API Gateway" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="bg-secondary border-border" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Target Service</Label>
              <Select value={form.target_service} onValueChange={v => setForm(f => ({ ...f, target_service: v }))}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select service" /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {services.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                  {['api-gateway','user-service','payment-service','auth-service'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-muted-foreground">Chaos Type</Label>
                <Select value={form.chaos_type} onValueChange={v => setForm(f => ({ ...f, chaos_type: v }))}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {CHAOS_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g,' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-muted-foreground">Intensity</Label>
                <Select value={form.intensity} onValueChange={v => setForm(f => ({ ...f, intensity: v }))}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {INTENSITIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Duration (seconds)</Label>
              <Input type="number" value={form.duration_seconds} onChange={e => setForm(f => ({ ...f, duration_seconds: +e.target.value }))} className="bg-secondary border-border" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !form.name || !form.target_service || !form.chaos_type} className="gap-2">
              <Zap className="w-3.5 h-3.5" /> {saving ? 'Creating...' : 'Create Experiment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}