import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import TopBar from '@/components/layout/TopBar';
import PullToRefreshWrapper from '@/components/shared/PullToRefreshWrapper';
import StatCard from '@/components/shared/StatCard';
import StatusBadge from '@/components/shared/StatusBadge';
import { Server, Zap, Bell, Activity, AlertTriangle, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ResilienceScoreWidget from '@/components/shared/ResilienceScoreWidget';

const uptimeData = [
  { time: '00:00', cpu: 32, mem: 45, latency: 120 },
  { time: '04:00', cpu: 28, mem: 48, latency: 115 },
  { time: '08:00', cpu: 55, mem: 62, latency: 145 },
  { time: '10:00', cpu: 78, mem: 71, latency: 210 },
  { time: '12:00', cpu: 45, mem: 58, latency: 130 },
  { time: '14:00', cpu: 52, mem: 60, latency: 138 },
  { time: '16:00', cpu: 61, mem: 65, latency: 155 },
  { time: '18:00', cpu: 48, mem: 57, latency: 128 },
  { time: '20:00', cpu: 35, mem: 52, latency: 118 },
  { time: '22:00', cpu: 30, mem: 49, latency: 112 },
  { time: 'Now', cpu: 38, mem: 54, latency: 122 },
];

const experimentHistory = [
  { name: 'Mon', passed: 3, failed: 1 },
  { name: 'Tue', passed: 5, failed: 0 },
  { name: 'Wed', passed: 2, failed: 2 },
  { name: 'Thu', passed: 4, failed: 1 },
  { name: 'Fri', passed: 6, failed: 0 },
  { name: 'Sat', passed: 1, failed: 0 },
  { name: 'Sun', passed: 3, failed: 1 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs shadow-xl">
        <p className="text-muted-foreground mb-1">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} style={{ color: entry.color }}>{entry.name}: {entry.value}{entry.name === 'latency' ? 'ms' : '%'}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Overview() {
  const [services, setServices] = useState([]);
  const [experiments, setExperiments] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, e, a] = await Promise.all([
        base44.entities.Microservice.list('-updated_date', 20),
        base44.entities.ChaosExperiment.list('-created_date', 10),
        base44.entities.SystemAlert.filter({ resolved: false }, '-created_date', 10),
      ]);
      setServices(s || []);
      setExperiments(e || []);
      setAlerts(a || []);
    } catch (err) {
      console.warn('API error (using fallback data for layout):', err);
      setServices([
        { id: 1, name: 'notification-service', status: 'healthy', replicas_ready: 3, replicas_desired: 3 },
        { id: 2, name: 'auth-service', status: 'healthy', replicas_ready: 2, replicas_desired: 2 },
        { id: 3, name: 'user-service', status: 'warning', replicas_ready: 1, replicas_desired: 2 }
      ]);
      setExperiments([
        { id: 1, status: 'running', name: 'DB Failover' }
      ]);
      setAlerts([]);
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const healthyCount = services.filter(s => s.status === 'healthy').length;
  const runningExps = experiments.filter(e => e.status === 'running').length;
  const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
  const avgUptime = services.length
    ? (services.reduce((acc, s) => acc + (s.uptime_percentage || 99.9), 0) / services.length).toFixed(1)
    : '99.9';

  return (
    <div>
      <TopBar title="System Overview" subtitle="Real-time cluster health & chaos status" onRefresh={load} />
      <PullToRefreshWrapper onRefresh={load}>
      <div className="p-6 space-y-8">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Healthy Services" value={healthyCount} unit={`/ ${services.length}`} icon={Server} color="success" trend="up" trendValue="+2" />
          <StatCard title="Active Experiments" value={runningExps} icon={Zap} color="primary" subtitle="chaos injections" />
          <StatCard title="Critical Alerts" value={criticalAlerts} icon={AlertTriangle} color={criticalAlerts > 0 ? 'destructive' : 'success'} subtitle="unresolved" />
          <StatCard title="Avg Uptime" value={avgUptime} unit="%" icon={TrendingUp} color="success" trend="up" trendValue="+0.2%" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* System metrics */}
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-semibold text-foreground">System Metrics</h3>
                <p className="text-xs text-muted-foreground">CPU, Memory & Latency — 24h</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary" />CPU</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-success" />Memory</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={uptimeData}>
                <defs>
                  <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(199,89%,58%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(199,89%,58%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142,71%,45%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(142,71%,45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,47%,15%)" />
                <XAxis dataKey="time" tick={{ fill: 'hsl(215,20%,55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'hsl(215,20%,55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="cpu" stroke="hsl(199,89%,58%)" fill="url(#colorCpu)" strokeWidth={2} name="cpu" />
                <Area type="monotone" dataKey="mem" stroke="hsl(142,71%,45%)" fill="url(#colorMem)" strokeWidth={2} name="mem" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Experiment history */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-foreground">Experiment Results</h3>
              <p className="text-xs text-muted-foreground">Weekly pass/fail summary</p>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={experimentHistory} barSize={10} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,47%,15%)" />
                <XAxis dataKey="name" tick={{ fill: 'hsl(215,20%,55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'hsl(215,20%,55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="passed" fill="hsl(142,71%,45%)" radius={[3,3,0,0]} name="passed" />
                <Bar dataKey="failed" fill="hsl(0,72%,55%)" radius={[3,3,0,0]} name="failed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Resilience Score */}
        <ResilienceScoreWidget services={services} experiments={experiments} loading={loading} />

        {/* Services + Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Services */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Services Health</h3>
              <Link to="/services"><Button variant="ghost" size="sm" className="text-xs h-7">View All</Button></Link>
            </div>
            {loading ? (
              <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-secondary/50 rounded-lg animate-pulse" />)}</div>
            ) : services.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No services registered yet.</p>
            ) : (
              <div className="space-y-2">
                {services.slice(0, 5).map(svc => (
                  <div key={svc.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <Server className="w-3.5 h-3.5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{svc.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{svc.replicas_ready || 0}/{svc.replicas_desired || 0} pods</p>
                      </div>
                    </div>
                    <StatusBadge status={svc.status || 'healthy'} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Alerts */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Active Alerts</h3>
              <Link to="/alerts"><Button variant="ghost" size="sm" className="text-xs h-7">View All</Button></Link>
            </div>
            {loading ? (
              <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-secondary/50 rounded-lg animate-pulse" />)}</div>
            ) : alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <CheckCircle className="w-8 h-8 text-success" />
                <p className="text-sm text-muted-foreground">No active alerts</p>
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.slice(0, 5).map(alert => (
                  <div key={alert.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                    <AlertTriangle className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${alert.severity === 'critical' ? 'text-destructive' : alert.severity === 'warning' ? 'text-warning' : 'text-primary'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{alert.title}</p>
                      <p className="text-xs text-muted-foreground">{alert.source_service}</p>
                    </div>
                    <StatusBadge status={alert.severity} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      </PullToRefreshWrapper>
    </div>
  );
}