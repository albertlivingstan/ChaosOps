import { useLiveMetrics } from '@/hooks/useLiveMetrics';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Cpu, MemoryStick, Activity, Wifi, AlertCircle, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

function MetricCard({ label, value, unit, icon: Icon, color, danger }) {
  return (
    <div className={cn(
      'bg-secondary rounded-lg p-3 flex items-center gap-3 border transition-colors',
      danger ? 'border-destructive/40 bg-destructive/5' : 'border-border'
    )}>
      <div className={cn('w-8 h-8 rounded-md flex items-center justify-center shrink-0', `bg-${color}/10`)}>
        <Icon className={cn('w-4 h-4', `text-${color}`)} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className={cn('text-base font-bold font-mono leading-tight', danger ? 'text-destructive' : 'text-foreground')}>
          {value ?? '—'}<span className="text-xs font-normal text-muted-foreground ml-0.5">{unit}</span>
        </p>
      </div>
    </div>
  );
}

function SparkLine({ data, dataKey, color, label }) {
  return (
    <div className="bg-secondary rounded-lg p-3 border border-border">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">{label}</p>
      <ResponsiveContainer width="100%" height={56}>
        <AreaChart data={data} margin={{ top: 2, right: 0, left: -30, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="ts" hide />
          <YAxis hide domain={['auto', 'auto']} />
          <Tooltip
            contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 6, fontSize: 10 }}
            labelFormatter={() => ''}
            formatter={(v) => [v, label]}
          />
          <Area
            type="monotoneX"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#grad-${dataKey})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function LiveMetricsDashboard({ experiment, service }) {
  const { current, history } = useLiveMetrics(experiment, service);

  if (experiment.status !== 'running') return null;

  const cpuDanger = current?.cpu > 80;
  const latencyDanger = current?.latency > 500;
  const errorDanger = current?.errorRate > 5;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3 }}
        className="mt-4 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <Radio className="w-3.5 h-3.5 text-primary animate-pulse" />
          <span className="text-xs font-semibold text-primary uppercase tracking-widest">Live Metrics</span>
          <span className="text-xs text-muted-foreground font-mono">· {service?.name || experiment.target_service}</span>
          <span className="ml-auto text-[10px] text-muted-foreground font-mono">↻ 1.5s</span>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          <MetricCard label="CPU" value={current?.cpu} unit="%" icon={Cpu} color="primary" danger={cpuDanger} />
          <MetricCard label="Memory" value={current?.memory} unit="%" icon={MemoryStick} color="warning" danger={current?.memory > 85} />
          <MetricCard label="Latency" value={current?.latency} unit="ms" icon={Activity} color="chart-2" danger={latencyDanger} />
          <MetricCard label="Error Rate" value={current?.errorRate} unit="%" icon={AlertCircle} color="destructive" danger={errorDanger} />
        </div>

        {/* Sparkline charts */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <SparkLine data={history} dataKey="cpu" color="hsl(var(--primary))" label="CPU %" />
          <SparkLine data={history} dataKey="latency" color="hsl(var(--chart-3))" label="Latency ms" />
          <SparkLine data={history} dataKey="errorRate" color="hsl(var(--destructive))" label="Error Rate %" />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}