import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import TopBar from '@/components/layout/TopBar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, BookOpen, Zap, Search, Tag, Play, Trash2, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CHAOS_TYPES = ['pod_kill', 'network_latency', 'cpu_stress', 'memory_stress', 'disk_fill', 'service_crash', 'network_loss'];
const INTENSITIES = ['low', 'medium', 'high', 'critical'];

const BUILTIN_TEMPLATES = [
  { id: 'b1', name: 'CPU Spike', description: 'Stress CPU to 90%+ and observe latency degradation', chaos_type: 'cpu_stress', intensity: 'high', duration_seconds: 120, tags: ['performance', 'cpu'], use_count: 42, builtin: true },
  { id: 'b2', name: 'Pod Kill', description: 'Kill a random pod and verify auto-restart and traffic rerouting', chaos_type: 'pod_kill', intensity: 'medium', duration_seconds: 60, tags: ['resilience', 'k8s'], use_count: 87, builtin: true },
  { id: 'b3', name: 'Network Blackout', description: 'Drop all outbound traffic to simulate network partition', chaos_type: 'network_loss', intensity: 'critical', duration_seconds: 30, tags: ['network', 'partition'], use_count: 19, builtin: true },
  { id: 'b4', name: 'Memory Leak Sim', description: 'Gradually consume memory until OOM or graceful restart', chaos_type: 'memory_stress', intensity: 'medium', duration_seconds: 180, tags: ['memory', 'oom'], use_count: 31, builtin: true },
  { id: 'b5', name: 'High Latency Injection', description: 'Add 500ms network delay to all service calls', chaos_type: 'network_latency', intensity: 'high', duration_seconds: 90, tags: ['latency', 'network'], use_count: 55, builtin: true },
  { id: 'b6', name: 'DNS Failure', description: 'Simulate DNS resolution failures for service discovery', chaos_type: 'service_crash', intensity: 'low', duration_seconds: 60, tags: ['dns', 'discovery'], use_count: 14, builtin: true },
];

const intensityColors = {
  low: 'bg-success/10 text-success border-success/20',
  medium: 'bg-warning/10 text-warning border-warning/20',
  high: 'bg-destructive/10 text-destructive border-destructive/20',
  critical: 'bg-destructive/20 text-destructive border-destructive/40',
};

export default function Library() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', chaos_type: '', intensity: 'medium', duration_seconds: 60, tags: '', steady_state_latency_ms: 200, steady_state_error_rate: 1 });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.ExperimentTemplate.list('-use_count', 100);
    setTemplates(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const allTemplates = [...BUILTIN_TEMPLATES, ...templates];
  const allTags = ['all', ...new Set(allTemplates.flatMap(t => t.tags || []))];

  const filtered = allTemplates.filter(t => {
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase());
    const matchTag = tagFilter === 'all' || (t.tags || []).includes(tagFilter);
    return matchSearch && matchTag;
  });

  const handleCreate = async () => {
    setSaving(true);
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    await base44.entities.ExperimentTemplate.create({ ...form, tags, use_count: 0 });
    setShowForm(false);
    setForm({ name: '', description: '', chaos_type: '', intensity: 'medium', duration_seconds: 60, tags: '', steady_state_latency_ms: 200, steady_state_error_rate: 1 });
    await load();
    setSaving(false);
  };

  const handleDelete = async (id) => {
    await base44.entities.ExperimentTemplate.delete(id);
    await load();
  };

  return (
    <div>
      <TopBar title="Experiment Library" subtitle="Reusable chaos experiment templates" onRefresh={load} />
      <div className="p-6 space-y-5">

        {/* Controls */}
        <div className="flex items-center gap-3 flex-wrap justify-between">
          <div className="flex items-center gap-3 flex-wrap flex-1">
            <div className="relative min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input placeholder="Search templates..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-secondary border-border text-sm h-9" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {allTags.slice(0, 8).map(tag => (
                <button key={tag} onClick={() => setTagFilter(tag)} className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${tagFilter === tag ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-muted-foreground border-border hover:text-foreground'}`}>
                  {tag !== 'all' && <Tag className="w-2.5 h-2.5" />}
                  {tag}
                </button>
              ))}
            </div>
          </div>
          <Button onClick={() => setShowForm(true)} className="gap-2 shrink-0">
            <Plus className="w-4 h-4" /> New Template
          </Button>
        </div>

        {/* Template grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-40 bg-card border border-border rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <BookOpen className="w-10 h-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No templates found</p>
          </div>
        ) : (
          <AnimatePresence>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((t, i) => (
                <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3 hover:border-primary/30 transition-colors group">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Zap className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{t.name}</h3>
                        {t.builtin && <span className="text-[10px] text-primary font-mono uppercase tracking-wide">built-in</span>}
                      </div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border uppercase tracking-wide ${intensityColors[t.intensity]}`}>{t.intensity}</span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed flex-1">{t.description || 'No description'}</p>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded">{t.chaos_type?.replace(/_/g, ' ')}</span>
                    <span className="text-[10px] font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded">{t.duration_seconds}s</span>
                    {(t.tags || []).map(tag => (
                      <span key={tag} className="text-[10px] text-primary/70 bg-primary/10 px-2 py-0.5 rounded-full">#{tag}</span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-border">
                    <span className="text-[10px] text-muted-foreground">{t.use_count || 0} uses</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="ghost" className="h-7 px-2 gap-1 text-xs text-primary" onClick={() => {}}>
                        <Play className="w-3 h-3" /> Use
                      </Button>
                      {!t.builtin && (
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(t.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-card border-border text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-primary" /> New Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs">Name</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="bg-secondary border-border" placeholder="e.g. Region Failover Test" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs">Description</Label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="bg-secondary border-border" placeholder="What does this test?" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-xs">Chaos Type</Label>
                <Select value={form.chaos_type} onValueChange={v => setForm(f => ({ ...f, chaos_type: v }))}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent className="bg-card border-border">{CHAOS_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-xs">Intensity</Label>
                <Select value={form.intensity} onValueChange={v => setForm(f => ({ ...f, intensity: v }))}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border">{INTENSITIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-xs">Duration (s)</Label>
                <Input type="number" value={form.duration_seconds} onChange={e => setForm(f => ({ ...f, duration_seconds: +e.target.value }))} className="bg-secondary border-border" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-xs">Max Error Rate (%)</Label>
                <Input type="number" value={form.steady_state_error_rate} onChange={e => setForm(f => ({ ...f, steady_state_error_rate: +e.target.value }))} className="bg-secondary border-border" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs">Tags (comma separated)</Label>
              <Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} className="bg-secondary border-border" placeholder="performance, k8s, network" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !form.name || !form.chaos_type} className="gap-2">
              <Plus className="w-3.5 h-3.5" /> {saving ? 'Saving...' : 'Save Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}