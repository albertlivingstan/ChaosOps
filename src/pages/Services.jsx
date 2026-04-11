import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { base44 } from '@/api/base44Client';
import TopBar from '@/components/layout/TopBar';
import StatusBadge from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Server, Cpu, MemoryStick, Activity, Trash2, Edit, Network, LayoutGrid } from 'lucide-react';
import { motion } from 'framer-motion';
import ServiceDependencyGraph from '@/components/services/ServiceDependencyGraph';

const LANGUAGES = ['nodejs', 'python', 'java', 'go', 'rust', 'terraform'];
const STATUSES = ['healthy', 'degraded', 'down', 'recovering'];

function MiniBar({ value, color }) {
  return (
    <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(value, 100)}%`, backgroundColor: `hsl(var(--${color}))` }} />
    </div>
  );
}

export default function Services() {
  const { toast } = useToast();
  const [services, setServices] = useState([]);
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'graph'
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', language: 'nodejs', status: 'healthy', replicas_desired: 3, replicas_ready: 3, cpu_usage: 30, memory_usage: 45, uptime_percentage: 99.9, avg_latency_ms: 120, version: 'v1.0.0', namespace: 'default' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [s, e] = await Promise.all([
      base44.entities.Microservice.list('-updated_date', 50),
      base44.entities.ChaosExperiment.filter({ status: 'running' }),
    ]);
    setServices(s);
    setExperiments(e);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openEdit = (svc) => {
    setEditTarget(svc);
    setForm({ ...svc });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let res;
      if (editTarget) {
        res = await base44.entities.Microservice.update(editTarget.id, form);
      } else {
        res = await base44.entities.Microservice.create(form);
      }

      if (!res) {
        toast({ title: 'Error', description: 'Failed to save service.', variant: 'destructive' });
        return;
      }

      setShowForm(false);
      setEditTarget(null);
      setForm({ name: '', description: '', language: 'nodejs', status: 'healthy', replicas_desired: 3, replicas_ready: 3, cpu_usage: 30, memory_usage: 45, uptime_percentage: 99.9, avg_latency_ms: 120, version: 'v1.0.0', namespace: 'default' });
      await load();
      toast({ title: 'Success', description: 'Service saved successfully.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    await base44.entities.Microservice.delete(id);
    await load();
  };

  return (
    <div>
      <TopBar title="Microservices" subtitle="Manage and monitor your service fleet" onRefresh={load} />
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          {/* View toggle */}
          <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === 'grid' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Grid
            </button>
            <button
              onClick={() => setViewMode('graph')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === 'graph' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Network className="w-3.5 h-3.5" /> Dependency Graph
            </button>
          </div>
          <Button onClick={() => { setEditTarget(null); setShowForm(true); }} className="gap-2">
            <Plus className="w-4 h-4" /> Register Service
          </Button>
        </div>

        {/* Graph view */}
        {viewMode === 'graph' && !loading && (
          <div className="mb-6">
            <ServiceDependencyGraph services={services} experiments={experiments} />
          </div>
        )}

        {viewMode === 'graph' ? null : loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-card border border-border rounded-xl animate-pulse" />)}
          </div>
        ) : services.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><Server className="w-6 h-6 text-primary" /></div>
            <p className="font-medium text-foreground">No services registered</p>
            <p className="text-sm text-muted-foreground">Add your first microservice to start monitoring.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {services.map(svc => (
              <motion.div key={svc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-xl p-5 hover:border-primary/20 transition-colors group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
                      <Server className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">{svc.name}</h3>
                      <p className="text-xs text-muted-foreground font-mono">{svc.version || 'v1.0.0'} · {svc.namespace}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(svc)}>
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(svc.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <StatusBadge status={svc.status || 'healthy'} className="mb-4" />

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground flex items-center gap-1"><Cpu className="w-3 h-3" />CPU</span>
                      <span className="text-foreground font-mono">{svc.cpu_usage || 0}%</span>
                    </div>
                    <MiniBar value={svc.cpu_usage || 0} color={svc.cpu_usage > 80 ? 'destructive' : svc.cpu_usage > 60 ? 'warning' : 'primary'} />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground flex items-center gap-1"><MemoryStick className="w-3 h-3" />Memory</span>
                      <span className="text-foreground font-mono">{svc.memory_usage || 0}%</span>
                    </div>
                    <MiniBar value={svc.memory_usage || 0} color={svc.memory_usage > 80 ? 'destructive' : svc.memory_usage > 60 ? 'warning' : 'success'} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border text-center">
                  <div>
                    <p className="text-xs font-mono text-foreground">{svc.replicas_ready}/{svc.replicas_desired}</p>
                    <p className="text-xs text-muted-foreground">Pods</p>
                  </div>
                  <div>
                    <p className="text-xs font-mono text-foreground">{svc.avg_latency_ms || 0}ms</p>
                    <p className="text-xs text-muted-foreground">Latency</p>
                  </div>
                  <div>
                    <p className="text-xs font-mono text-foreground">{svc.uptime_percentage || 99.9}%</p>
                    <p className="text-xs text-muted-foreground">Uptime</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-card border-border text-foreground max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Server className="w-4 h-4 text-primary" />{editTarget ? 'Edit Service' : 'Register Service'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-muted-foreground">Name</Label>
                <Input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className="bg-secondary border-border" placeholder="api-gateway" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-muted-foreground">Version</Label>
                <Input value={form.version} onChange={e => setForm(f => ({...f, version: e.target.value}))} className="bg-secondary border-border" placeholder="v1.0.0" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-muted-foreground">Language</Label>
                <Select value={form.language} onValueChange={v => setForm(f => ({...f, language: v}))}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {LANGUAGES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-muted-foreground">Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({...f, status: v}))}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-muted-foreground">Desired Pods</Label>
                <Input type="number" value={form.replicas_desired} onChange={e => setForm(f => ({...f, replicas_desired: +e.target.value}))} className="bg-secondary border-border" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-muted-foreground">Ready Pods</Label>
                <Input type="number" value={form.replicas_ready} onChange={e => setForm(f => ({...f, replicas_ready: +e.target.value}))} className="bg-secondary border-border" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-muted-foreground">CPU Usage %</Label>
                <Input type="number" value={form.cpu_usage} onChange={e => setForm(f => ({...f, cpu_usage: +e.target.value}))} className="bg-secondary border-border" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-muted-foreground">Memory Usage %</Label>
                <Input type="number" value={form.memory_usage} onChange={e => setForm(f => ({...f, memory_usage: +e.target.value}))} className="bg-secondary border-border" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-muted-foreground">Avg Latency (ms)</Label>
                <Input type="number" value={form.avg_latency_ms} onChange={e => setForm(f => ({...f, avg_latency_ms: +e.target.value}))} className="bg-secondary border-border" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-muted-foreground">Uptime %</Label>
                <Input type="number" step="0.1" value={form.uptime_percentage} onChange={e => setForm(f => ({...f, uptime_percentage: +e.target.value}))} className="bg-secondary border-border" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.name}>
              {saving ? 'Saving...' : editTarget ? 'Update' : 'Register'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}