import { useState } from 'react';
import TopBar from '@/components/layout/TopBar';
import { Activity, Cpu, MemoryStick, Network, Clock } from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadialBarChart, RadialBar, Legend
} from 'recharts';

// Mock metric data generators
const makeTimeData = (points, base, variance) =>
  Array.from({ length: points }, (_, i) => ({
    t: `${String(i).padStart(2, '0')}:00`,
    v: Math.max(0, Math.min(100, base + (Math.random() - 0.5) * variance * 2)),
  }));

const cpuData = makeTimeData(24, 45, 20);
const memData = makeTimeData(24, 60, 15);
const latencyData = Array.from({ length: 24 }, (_, i) => ({
  t: `${String(i).padStart(2, '0')}:00`,
  p50: 80 + Math.random() * 40,
  p95: 150 + Math.random() * 80,
  p99: 250 + Math.random() * 100,
}));
const rpsData = makeTimeData(24, 320, 120);

const radialData = [
  { name: 'CPU', value: 48, fill: 'hsl(199,89%,58%)' },
  { name: 'Memory', value: 62, fill: 'hsl(142,71%,45%)' },
  { name: 'Disk', value: 35, fill: 'hsl(38,92%,50%)' },
  { name: 'Network', value: 71, fill: 'hsl(280,65%,60%)' },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((e, i) => (
        <p key={i} style={{ color: e.color }}>{e.name}: {typeof e.value === 'number' ? e.value.toFixed(1) : e.value}</p>
      ))}
    </div>
  );
};

function MetricChart({ title, data, dataKey, color, unit, height = 140 }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-3.5 h-3.5 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <span className="ml-auto text-lg font-bold text-foreground font-mono">
          {typeof data[data.length - 1]?.[dataKey] === 'number' ? data[data.length - 1][dataKey].toFixed(1) : '--'}
          <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>
        </span>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,47%,15%)" />
          <XAxis dataKey="t" tick={{ fill: 'hsl(215,20%,55%)', fontSize: 10 }} axisLine={false} tickLine={false} interval={5} />
          <YAxis tick={{ fill: 'hsl(215,20%,55%)', fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey={dataKey} stroke={color} fill={`url(#grad-${dataKey})`} strokeWidth={2} name={dataKey} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Monitoring() {
  const [timeRange, setTimeRange] = useState('24h');

  const podMetrics = [
    { name: 'api-gateway', cpu: 42, mem: 58, rps: 340 },
    { name: 'user-service', cpu: 28, mem: 44, rps: 180 },
    { name: 'payment-service', cpu: 65, mem: 72, rps: 95 },
    { name: 'auth-service', cpu: 18, mem: 35, rps: 420 },
    { name: 'notification-svc', cpu: 8, mem: 22, rps: 55 },
  ];

  return (
    <div>
      <TopBar title="Monitoring" subtitle="Prometheus metrics & system performance" />
      <div className="p-6 space-y-6">

        {/* Time range selector */}
        <div className="flex gap-2">
          {['1h', '6h', '24h', '7d'].map(r => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${timeRange === r ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-muted-foreground border-border hover:text-foreground'}`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Top metrics grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MetricChart title="CPU Usage" data={cpuData} dataKey="v" color="hsl(199,89%,58%)" unit="%" />
          <MetricChart title="Memory Usage" data={memData} dataKey="v" color="hsl(142,71%,45%)" unit="%" />
        </div>

        {/* Latency + RPS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Response Latency Percentiles</h3>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={latencyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,47%,15%)" />
                <XAxis dataKey="t" tick={{ fill: 'hsl(215,20%,55%)', fontSize: 10 }} axisLine={false} tickLine={false} interval={5} />
                <YAxis tick={{ fill: 'hsl(215,20%,55%)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="p50" stroke="hsl(142,71%,45%)" strokeWidth={2} dot={false} name="p50" />
                <Line type="monotone" dataKey="p95" stroke="hsl(38,92%,50%)" strokeWidth={2} dot={false} name="p95" />
                <Line type="monotone" dataKey="p99" stroke="hsl(0,72%,55%)" strokeWidth={2} dot={false} name="p99" />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-3 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-2 h-0.5 bg-success inline-block" />p50</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-0.5 bg-warning inline-block" />p95</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-0.5 bg-destructive inline-block" />p99</span>
            </div>
          </div>

          {/* Radial resource usage */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Resource Utilization</h3>
            <ResponsiveContainer width="100%" height={160}>
              <RadialBarChart cx="50%" cy="50%" innerRadius="30%" outerRadius="90%" data={radialData} startAngle={90} endAngle={-270}>
                <RadialBar dataKey="value" cornerRadius={4} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {radialData.map(d => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.fill }} />
                  <span className="text-muted-foreground">{d.name}</span>
                  <span className="font-mono text-foreground ml-auto">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Per-service table */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Per-Service Metrics</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="text-left py-2 pr-4 font-medium">Service</th>
                  <th className="text-right py-2 px-4 font-medium">CPU %</th>
                  <th className="text-right py-2 px-4 font-medium">Memory %</th>
                  <th className="text-right py-2 px-4 font-medium">RPS</th>
                  <th className="text-right py-2 pl-4 font-medium">Health</th>
                </tr>
              </thead>
              <tbody>
                {podMetrics.map(m => (
                  <tr key={m.name} className="border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors">
                    <td className="py-3 pr-4 font-mono text-xs text-foreground">{m.name}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-mono text-xs ${m.cpu > 60 ? 'text-warning' : 'text-foreground'}`}>{m.cpu}%</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-mono text-xs ${m.mem > 70 ? 'text-destructive' : 'text-foreground'}`}>{m.mem}%</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs text-foreground">{m.rps}/s</td>
                    <td className="py-3 pl-4 text-right">
                      <span className={`text-xs font-medium ${m.cpu < 70 && m.mem < 70 ? 'text-success' : 'text-warning'}`}>
                        {m.cpu < 70 && m.mem < 70 ? '● Nominal' : '● Elevated'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}