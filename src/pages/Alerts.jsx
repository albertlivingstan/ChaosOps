import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import TopBar from '@/components/layout/TopBar';
import StatusBadge from '@/components/shared/StatusBadge';
import PullToRefreshWrapper from '@/components/shared/PullToRefreshWrapper';
import MobileDrawerDialog from '@/components/shared/MobileDrawerDialog';
import MobileDrawerSelect from '@/components/shared/MobileDrawerSelect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bell, Plus, CheckCheck, Trash2, AlertTriangle, Info, AlertOctagon } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const SEVERITIES = [
  { value: 'info', label: 'Info' },
  { value: 'warning', label: 'Warning' },
  { value: 'critical', label: 'Critical' },
];
const ALERT_TYPES = [
  { value: 'health_check', label: 'Health Check' },
  { value: 'performance', label: 'Performance' },
  { value: 'chaos_event', label: 'Chaos Event' },
  { value: 'deployment', label: 'Deployment' },
  { value: 'scaling', label: 'Scaling' },
];

const severityIcon = {
  critical: <AlertOctagon className="w-4 h-4 text-destructive" />,
  warning: <AlertTriangle className="w-4 h-4 text-warning" />,
  info: <Info className="w-4 h-4 text-primary" />,
};

const EMPTY_FORM = { title: '', message: '', severity: 'warning', source_service: '', alert_type: 'health_check' };

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const a = await base44.entities.SystemAlert.list('-created_date', 100);
    setAlerts(a);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Optimistic acknowledge
  const handleAcknowledge = async (id) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
    await base44.entities.SystemAlert.update(id, { acknowledged: true });
  };

  // Optimistic resolve
  const handleResolve = async (id) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, resolved: true, acknowledged: true } : a));
    await base44.entities.SystemAlert.update(id, { resolved: true, acknowledged: true });
  };

  // Optimistic delete
  const handleDelete = async (id) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
    await base44.entities.SystemAlert.delete(id);
  };

  const handleCreate = async () => {
    setSaving(true);
    const newAlert = await base44.entities.SystemAlert.create({ ...form, acknowledged: false, resolved: false });
    setAlerts(prev => [newAlert, ...prev]);
    setShowForm(false);
    setForm(EMPTY_FORM);
    setSaving(false);
  };

  const filtered = filter === 'all' ? alerts : filter === 'active' ? alerts.filter(a => !a.resolved) : alerts.filter(a => a.resolved);

  const formContent = (
    <div className="space-y-4 py-2">
      <div className="space-y-1.5">
        <Label className="text-muted-foreground text-xs">Title</Label>
        <Input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="Alert title" className="bg-secondary border-border" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-muted-foreground text-xs">Message</Label>
        <Input value={form.message} onChange={e => setForm(f => ({...f, message: e.target.value}))} placeholder="Alert description" className="bg-secondary border-border" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-muted-foreground text-xs">Severity</Label>
          <MobileDrawerSelect value={form.severity} onValueChange={v => setForm(f => ({...f, severity: v}))} options={SEVERITIES} placeholder="Severity" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-muted-foreground text-xs">Type</Label>
          <MobileDrawerSelect value={form.alert_type} onValueChange={v => setForm(f => ({...f, alert_type: v}))} options={ALERT_TYPES} placeholder="Type" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-muted-foreground text-xs">Source Service</Label>
        <Input value={form.source_service} onChange={e => setForm(f => ({...f, source_service: e.target.value}))} placeholder="api-gateway" className="bg-secondary border-border" />
      </div>
    </div>
  );

  const formFooter = (
    <>
      <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
      <Button onClick={handleCreate} disabled={saving || !form.title}>
        {saving ? 'Creating...' : 'Create Alert'}
      </Button>
    </>
  );

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Alerts" subtitle="System notifications and anomaly detection" onRefresh={load} />

      <PullToRefreshWrapper onRefresh={load} className="flex-1">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div className="flex gap-2">
              {['all', 'active', 'resolved'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 text-xs rounded-lg border capitalize transition-all ${filter === f ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-muted-foreground border-border hover:text-foreground'}`}>
                  {f}
                  <span className="ml-1.5 opacity-60">
                    {f === 'all' ? alerts.length : f === 'active' ? alerts.filter(a => !a.resolved).length : alerts.filter(a => a.resolved).length}
                  </span>
                </button>
              ))}
            </div>
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="w-4 h-4" /> New Alert
            </Button>
          </div>

          {loading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-card border border-border rounded-xl animate-pulse" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <Bell className="w-10 h-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No alerts found</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              <div className="space-y-3">
                {filtered.map(alert => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.18 }}
                    className={`bg-card border rounded-xl p-5 transition-colors ${alert.resolved ? 'border-border opacity-60' : alert.severity === 'critical' ? 'border-destructive/30' : alert.severity === 'warning' ? 'border-warning/30' : 'border-border hover:border-primary/20'}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="mt-0.5 shrink-0">{severityIcon[alert.severity]}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap mb-1">
                          <h3 className="font-semibold text-foreground text-sm">{alert.title}</h3>
                          <StatusBadge status={alert.severity} />
                          {alert.acknowledged && !alert.resolved && (
                            <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">Acknowledged</span>
                          )}
                          {alert.resolved && (
                            <span className="text-xs text-success bg-success/10 border border-success/20 px-2 py-0.5 rounded-full">Resolved</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{alert.message}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          {alert.source_service && <span>{alert.source_service}</span>}
                          {alert.alert_type && <span className="capitalize">{alert.alert_type?.replace(/_/g,' ')}</span>}
                          {alert.created_date && <span>{format(new Date(alert.created_date), 'MMM d, HH:mm')}</span>}
                        </div>
                      </div>
                      {!alert.resolved && (
                        <div className="flex items-center gap-2 shrink-0">
                          {!alert.acknowledged && (
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handleAcknowledge(alert.id)}>
                              <CheckCheck className="w-3 h-3" /> Ack
                            </Button>
                          )}
                          <Button size="sm" variant="outline" className="h-7 text-xs text-success border-success/30 hover:bg-success/10" onClick={() => handleResolve(alert.id)}>
                            Resolve
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(alert.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </div>
      </PullToRefreshWrapper>

      <MobileDrawerDialog
        open={showForm}
        onOpenChange={setShowForm}
        title="New Alert"
        icon={<Bell className="w-4 h-4 text-primary" />}
        footer={formFooter}
      >
        {formContent}
      </MobileDrawerDialog>
    </div>
  );
}