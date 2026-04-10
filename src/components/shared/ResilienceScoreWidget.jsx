import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ShieldCheck, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

// Deterministically generate a 8-week resilience trend per service
function generateTrend(baseScore) {
  const weeks = ['W-7', 'W-6', 'W-5', 'W-4', 'W-3', 'W-2', 'W-1', 'Now'];
  let score = Math.max(20, baseScore - 15);
  return weeks.map((w, i) => {
    const delta = (Math.sin(i * 1.2) * 6) + (i * (baseScore - score) / 7);
    score = Math.min(100, Math.max(10, score + delta));
    return { week: w, score: Math.round(score) };
  });
}

// Calculate resilience score (0–100) from service + experiment data
function calcScore(service, experiments) {
  const uptime = service.uptime_percentage ?? 99;
  const latency = service.avg_latency_ms ?? 100;
  const cpu = service.cpu_usage ?? 30;

  // Uptime contributes 40 points
  const uptimeScore = (uptime / 100) * 40;

  // Latency contributes 30 points (<=100ms = full, >500ms = 0)
  const latencyScore = Math.max(0, 30 - ((latency - 100) / 400) * 30);

  // CPU contributes 15 points (<=50% = full, >=95% = 0)
  const cpuScore = Math.max(0, 15 - ((cpu - 50) / 45) * 15);

  // Experiment success contributes 15 points
  const serviceExps = experiments.filter(e =>
    e.target_service === service.name && ['completed', 'failed', 'aborted'].includes(e.status)
  );
  const successCount = serviceExps.filter(e => e.status === 'completed').length;
  const expScore = serviceExps.length > 0 ? (successCount / serviceExps.length) * 15 : 10;

  return Math.round(Math.min(100, uptimeScore + latencyScore + cpuScore + expScore));
}

function ScoreRing({ score }) {
  const radius = 18;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? 'hsl(142,71%,45%)' : score >= 60 ? 'hsl(38,92%,50%)' : 'hsl(0,72%,55%)';

  return (
    <svg width="48" height="48" viewBox="0 0 48 48" className="shrink-0">
      <circle cx="24" cy="24" r={radius} fill="none" stroke="hsl(222,47%,15%)" strokeWidth="4" />
      <circle
        cx="24" cy="24" r={radius} fill="none"
        stroke={color} strokeWidth="4"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 24 24)"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text x="24" y="28" textAnchor="middle" fill={color} fontSize="11" fontWeight="600" fontFamily="JetBrains Mono, monospace">
        {score}
      </text>
    </svg>
  );
}

const ResilienceTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs shadow-xl">
        <p className="text-muted-foreground mb-1">{label}</p>
        <p style={{ color: 'hsl(199,89%,58%)' }}>Score: {payload[0].value}</p>
      </div>
    );
  }
  return null;
};

export default function ResilienceScoreWidget({ services, experiments, loading }) {
  const scored = useMemo(() => {
    return services
      .map(svc => {
        const score = calcScore(svc, experiments);
        const trend = generateTrend(score);
        const prev = trend[trend.length - 2].score;
        const delta = score - prev;
        return { ...svc, score, trend, delta };
      })
      .sort((a, b) => b.score - a.score);
  }, [services, experiments]);

  // Aggregate trend: average all services per week
  const aggregateTrend = useMemo(() => {
    if (scored.length === 0) return [];
    const weeks = scored[0]?.trend?.map(t => t.week) ?? [];
    return weeks.map((w, i) => ({
      week: w,
      score: Math.round(scored.reduce((sum, s) => sum + s.trend[i].score, 0) / scored.length),
    }));
  }, [scored]);

  const avgScore = scored.length
    ? Math.round(scored.reduce((s, x) => s + x.score, 0) / scored.length)
    : 0;

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">Resilience Score</h3>
            <p className="text-xs text-muted-foreground">Uptime · Latency · Chaos success rate</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold font-mono text-primary">{avgScore}</p>
          <p className="text-xs text-muted-foreground">cluster avg</p>
        </div>
      </div>

      {/* Trend line */}
      {aggregateTrend.length > 0 && (
        <div className="mb-5">
          <p className="text-xs text-muted-foreground mb-2">8-week cluster resilience trend</p>
          <ResponsiveContainer width="100%" height={90}>
            <LineChart data={aggregateTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="resLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="hsl(199,89%,58%)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(142,71%,45%)" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,47%,15%)" />
              <XAxis dataKey="week" tick={{ fill: 'hsl(215,20%,55%)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: 'hsl(215,20%,55%)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ResilienceTooltip />} />
              <Line
                type="monotone" dataKey="score"
                stroke="url(#resLine)" strokeWidth={2.5}
                dot={{ fill: 'hsl(142,71%,45%)', r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: 'hsl(199,89%,58%)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Per-service scores */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-secondary/50 rounded-lg animate-pulse" />)}
        </div>
      ) : scored.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No services to score.</p>
      ) : (
        <div className="space-y-2.5">
          {scored.slice(0, 5).map(svc => (
            <div key={svc.id} className="flex items-center gap-3">
              <ScoreRing score={svc.score} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground truncate">{svc.name}</p>
                  <span className={`flex items-center gap-0.5 text-xs font-mono ${
                    svc.delta > 0 ? 'text-success' : svc.delta < 0 ? 'text-destructive' : 'text-muted-foreground'
                  }`}>
                    {svc.delta > 0 ? <TrendingUp className="w-3 h-3" /> : svc.delta < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                    {svc.delta > 0 ? '+' : ''}{svc.delta}
                  </span>
                </div>
                {/* Mini spark bar */}
                <div className="flex items-end gap-px mt-1 h-4">
                  {svc.trend.map((t, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-sm"
                      style={{
                        height: `${(t.score / 100) * 16}px`,
                        background: i === svc.trend.length - 1
                          ? (svc.score >= 80 ? 'hsl(142,71%,45%)' : svc.score >= 60 ? 'hsl(38,92%,50%)' : 'hsl(0,72%,55%)')
                          : 'hsl(222,47%,20%)',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {scored.length > 5 && (
        <div className="mt-3 pt-3 border-t border-border">
          <Link to="/services">
            <Button variant="ghost" size="sm" className="text-xs h-7 w-full">View all {scored.length} services</Button>
          </Link>
        </div>
      )}
    </div>
  );
}