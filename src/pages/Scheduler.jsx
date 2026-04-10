import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import TopBar from '@/components/layout/TopBar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Calendar, Clock, Repeat, Zap, Server, Trash2, CalendarDays, Swords, Play } from 'lucide-react';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday } from 'date-fns';
import { motion } from 'framer-motion';

const CHAOS_TYPES = ['pod_kill', 'network_latency', 'cpu_stress', 'memory_stress', 'disk_fill', 'service_crash', 'network_loss'];
const INTENSITIES = ['low', 'medium', 'high', 'critical'];
const RECURRENCES = ['none', 'daily', 'weekly', 'monthly'];

const recurrenceIcon = { none: Clock, daily: Repeat, weekly: Repeat, monthly: Calendar };
const intensityColors = { low: 'text-success', medium: 'text-warning', high: 'text-destructive', critical: 'text-destructive' };

export default function Scheduler() {
  const [scheduled, setScheduled] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [form, setForm] = useState({
    name: '', target_service: '', chaos_type: '', intensity: 'medium',
    duration_seconds: 60, scheduled_at: '', recurrence: 'none', gameday_mode: false, notes: ''
  });

  const load = async () => {
    setLoading(true);
    const [s, svc] = await Promise.all([
      base44.entities.ScheduledExperiment.list('-scheduled_at', 100),
      base44.entities.Microservice.list(),
    ]);
    setScheduled(s);
    setServices(svc);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    setSaving(true);
    await base44.entities.ScheduledExperiment.create({ ...form, status: 'scheduled' });
    setShowForm(false);
    setForm({ name: '', target_service: '', chaos_type: '', intensity: 'medium', duration_seconds: 60, scheduled_at: '', recurrence: 'none', gameday_mode: false, notes: '' });
    await load();
    setSaving(false);
  };

  const handleDelete = async (id) => {
    await base44.entities.ScheduledExperiment.delete(id);
    await load();
  };

  const handleCancel = async (id) => {
    await base44.entities.ScheduledExperiment.update(id, { status: 'cancelled' });
    await load();
  };

  // Calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startOffset = getDay(monthStart);

  const getEventsForDay = (day) => scheduled.filter(s => s.scheduled_at && isSameDay(new Date(s.scheduled_at), day));
  const dayItems = selectedDay ? getEventsForDay(selectedDay) : [];
  const upcoming = scheduled.filter(s => s.status === 'scheduled').sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
  const gamedayItems = scheduled.filter(s => s.gameday_mode);

  return (
    <div>
      <TopBar title="Scheduler & GameDay" subtitle="Plan and automate chaos experiments" onRefresh={load} />
      <div className="p-6 space-y-6">

        <div className="flex items-center justify-between">
          <div className="flex gap-4 text-sm">
            <div className="bg-card border border-border rounded-lg px-4 py-2 text-center">
              <p className="text-xl font-bold font-mono text-foreground">{upcoming.length}</p>
              <p className="text-xs text-muted-foreground">Upcoming</p>
            </div>
            <div className="bg-card border border-border rounded-lg px-4 py-2 text-center">
              <p className="text-xl font-bold font-mono text-foreground">{gamedayItems.length}</p>
              <p className="text-xs text-muted-foreground">GameDay</p>
            </div>
            <div className="bg-card border border-border rounded-lg px-4 py-2 text-center">
              <p className="text-xl font-bold font-mono text-foreground">{scheduled.filter(s => s.recurrence !== 'none').length}</p>
              <p className="text-xs text-muted-foreground">Recurring</p>
            </div>
          </div>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Schedule Experiment
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary" />
                {format(currentMonth, 'MMMM yyyy')}
              </h2>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() - 1))}>‹</Button>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setCurrentMonth(new Date())}>Today</Button>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() + 1))}>›</Button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                <div key={d} className="text-center text-[10px] text-muted-foreground font-medium py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array(startOffset).fill(null).map((_, i) => <div key={`e-${i}`} />)}
              {days.map(day => {
                const events = getEventsForDay(day);
                const isSelected = selectedDay && isSameDay(day, selectedDay);
                return (
                  <button key={day.toISOString()} onClick={() => setSelectedDay(isSameDay(day, selectedDay) ? null : day)}
                    className={`relative aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-colors ${
                      isSelected ? 'bg-primary text-primary-foreground' :
                      isToday(day) ? 'bg-primary/20 text-primary font-semibold' :
                      'hover:bg-secondary text-foreground'
                    }`}>
                    <span>{format(day, 'd')}</span>
                    {events.length > 0 && (
                      <div className="flex gap-0.5 absolute bottom-1">
                        {events.slice(0, 3).map((e, i) => (
                          <span key={i} className={`w-1 h-1 rounded-full ${e.gameday_mode ? 'bg-warning' : 'bg-primary'}`} />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {selectedDay && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground mb-2">{format(selectedDay, 'MMM d, yyyy')} — {dayItems.length} event{dayItems.length !== 1 ? 's' : ''}</p>
                {dayItems.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No experiments scheduled for this day.</p>
                ) : dayItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between py-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      {item.gameday_mode && <Swords className="w-3 h-3 text-warning" />}
                      <span className="text-foreground font-medium">{item.name}</span>
                      <span className="text-muted-foreground font-mono">{item.scheduled_at && format(new Date(item.scheduled_at), 'HH:mm')}</span>
                    </div>
                    <span className={`font-medium ${intensityColors[item.intensity]}`}>{item.intensity}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming list */}
          <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Upcoming
            </h2>
            {loading ? (
              <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-secondary rounded-lg animate-pulse" />)}</div>
            ) : upcoming.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No upcoming experiments</p>
            ) : (
              <div className="space-y-2 overflow-y-auto max-h-[400px]">
                {upcoming.map(item => {
                  const RecurIcon = recurrenceIcon[item.recurrence] || Clock;
                  return (
                    <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="bg-secondary rounded-lg p-3 flex items-start justify-between gap-2 group">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          {item.gameday_mode && <Swords className="w-3 h-3 text-warning shrink-0" />}
                          <p className="text-xs font-medium text-foreground truncate">{item.name}</p>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                          <span>{item.scheduled_at && format(new Date(item.scheduled_at), 'MMM d, HH:mm')}</span>
                          {item.recurrence !== 'none' && <span className="flex items-center gap-0.5"><RecurIcon className="w-2.5 h-2.5" />{item.recurrence}</span>}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-[10px] bg-card px-1.5 py-0.5 rounded font-mono">{item.chaos_type?.replace(/_/g,' ')}</span>
                          <span className={`text-[10px] font-medium ${intensityColors[item.intensity]}`}>{item.intensity}</span>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* GameDay section */}
        {gamedayItems.length > 0 && (
          <div className="bg-card border border-warning/30 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
              <Swords className="w-4 h-4 text-warning" /> GameDay Mode
              <Badge className="bg-warning/10 text-warning border-warning/20 text-[10px]">Active</Badge>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {gamedayItems.map(item => (
                <div key={item.id} className="bg-warning/5 border border-warning/20 rounded-lg p-3">
                  <p className="text-sm font-medium text-foreground mb-1">{item.name}</p>
                  <p className="text-xs text-muted-foreground mb-2">{item.notes || 'No notes'}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-muted-foreground">{item.target_service}</span>
                    <Button size="sm" className="h-6 px-2 text-[10px] gap-1 bg-warning text-warning-foreground hover:bg-warning/90">
                      <Play className="w-2.5 h-2.5" /> Inject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-card border-border text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /> Schedule Experiment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs">Name</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="bg-secondary border-border" placeholder="e.g. Weekly Resilience Test" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs">Target Service</Label>
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
                <Label className="text-muted-foreground text-xs">Chaos Type</Label>
                <Select value={form.chaos_type} onValueChange={v => setForm(f => ({ ...f, chaos_type: v }))}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent className="bg-card border-border">{CHAOS_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g,' ')}</SelectItem>)}</SelectContent>
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
                <Label className="text-muted-foreground text-xs">Scheduled At</Label>
                <Input type="datetime-local" value={form.scheduled_at} onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))} className="bg-secondary border-border text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-xs">Recurrence</Label>
                <Select value={form.recurrence} onValueChange={v => setForm(f => ({ ...f, recurrence: v }))}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border">{RECURRENCES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs">Notes</Label>
              <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="bg-secondary border-border" placeholder="Optional notes..." />
            </div>
            <div className="flex items-center justify-between bg-warning/5 border border-warning/20 rounded-lg p-3">
              <div>
                <p className="text-sm text-foreground flex items-center gap-2"><Swords className="w-3.5 h-3.5 text-warning" /> GameDay Mode</p>
                <p className="text-xs text-muted-foreground mt-0.5">Enable for manual team fault injection sessions</p>
              </div>
              <Switch checked={form.gameday_mode} onCheckedChange={v => setForm(f => ({ ...f, gameday_mode: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !form.name || !form.target_service || !form.chaos_type || !form.scheduled_at} className="gap-2">
              <Calendar className="w-3.5 h-3.5" /> {saving ? 'Scheduling...' : 'Schedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}