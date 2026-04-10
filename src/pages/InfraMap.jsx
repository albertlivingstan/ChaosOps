import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import TopBar from '@/components/layout/TopBar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, RefreshCw, Play, Server, Database, Globe, Cpu, MemoryStick, Activity } from 'lucide-react';

const NODE_TYPES = {
  service: { icon: Server, color: 'hsl(var(--primary))', bg: 'hsl(var(--primary) / 0.15)' },
  database: { icon: Database, color: 'hsl(var(--warning))', bg: 'hsl(var(--warning) / 0.15)' },
  gateway: { icon: Globe, color: 'hsl(var(--chart-4))', bg: 'hsl(var(--chart-4) / 0.15)' },
};

const STATUS_COLORS = {
  healthy: 'hsl(var(--success))',
  degraded: 'hsl(var(--warning))',
  down: 'hsl(var(--destructive))',
  recovering: 'hsl(var(--primary))',
};

// Deterministic positions for nodes in a layered graph
function computePositions(services) {
  const layers = [
    services.filter(s => s.name?.includes('gateway') || s.name?.includes('api')),
    services.filter(s => !s.name?.includes('gateway') && !s.name?.includes('api') && !s.name?.includes('db') && !s.name?.includes('data')),
    services.filter(s => s.name?.includes('db') || s.name?.includes('data')),
  ].map((l, li) => l.length ? l : (li === 1 ? services.slice(1, -1) : []));

  // Fallback: distribute evenly if layers are empty
  const allLayered = layers.flat();
  const unLayered = services.filter(s => !allLayered.includes(s));
  if (unLayered.length) layers[1].push(...unLayered);

  const W = 800, H = 500;
  const positions = {};
  layers.forEach((layer, li) => {
    if (!layer.length) return;
    const y = 80 + li * (H / (layers.filter(l => l.length).length + 0.5));
    layer.forEach((svc, si) => {
      const x = (W / (layer.length + 1)) * (si + 1);
      positions[svc.id] = { x, y };
    });
  });
  return positions;
}

// Simple dependency links: each inner node connects to a gateway, each db connects to inner nodes
function computeEdges(services, positions) {
  const edges = [];
  const gateways = services.filter(s => s.name?.includes('gateway') || s.name?.includes('api'));
  const dbs = services.filter(s => s.name?.includes('db') || s.name?.includes('data') || s.name?.includes('cache'));
  const inner = services.filter(s => !gateways.includes(s) && !dbs.includes(s));

  gateways.forEach(g => {
    inner.slice(0, 4).forEach(i => {
      if (positions[g.id] && positions[i.id]) edges.push({ from: g.id, to: i.id });
    });
  });
  dbs.forEach(db => {
    inner.slice(0, 3).forEach(i => {
      if (positions[db.id] && positions[i.id]) edges.push({ from: i.id, to: db.id });
    });
  });

  // If no structured edges, connect sequentially
  if (!edges.length && services.length > 1) {
    for (let i = 0; i < services.length - 1; i++) {
      if (positions[services[i].id] && positions[services[i + 1].id]) {
        edges.push({ from: services[i].id, to: services[i + 1].id });
      }
    }
  }
  return edges;
}

export default function InfraMap() {
  const [services, setServices] = useState([]);
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [positions, setPositions] = useState({});
  const [edges, setEdges] = useState([]);
  const svgRef = useRef(null);

  const load = async () => {
    setLoading(true);
    const [s, e] = await Promise.all([
      base44.entities.Microservice.list(),
      base44.entities.ChaosExperiment.filter({ status: 'running' }),
    ]);
    // Seed demo services if empty
    const display = s.length ? s : [
      { id: 'demo1', name: 'api-gateway', status: 'healthy', cpu_usage: 28, memory_usage: 45, avg_latency_ms: 32, requests_per_second: 1200 },
      { id: 'demo2', name: 'auth-service', status: 'healthy', cpu_usage: 34, memory_usage: 52, avg_latency_ms: 18, requests_per_second: 450 },
      { id: 'demo3', name: 'user-service', status: 'degraded', cpu_usage: 71, memory_usage: 68, avg_latency_ms: 142, requests_per_second: 320 },
      { id: 'demo4', name: 'payment-service', status: 'healthy', cpu_usage: 22, memory_usage: 38, avg_latency_ms: 55, requests_per_second: 180 },
      { id: 'demo5', name: 'notification-service', status: 'healthy', cpu_usage: 15, memory_usage: 30, avg_latency_ms: 22, requests_per_second: 90 },
      { id: 'demo6', name: 'postgres-db', status: 'healthy', cpu_usage: 40, memory_usage: 78, avg_latency_ms: 8, requests_per_second: 800 },
      { id: 'demo7', name: 'redis-cache', status: 'healthy', cpu_usage: 12, memory_usage: 55, avg_latency_ms: 2, requests_per_second: 2400 },
    ];
    const pos = computePositions(display);
    const edg = computeEdges(display, pos);
    setServices(display);
    setExperiments(e);
    setPositions(pos);
    setEdges(edg);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const activeExperimentServices = new Set(experiments.map(e => e.target_service));
  const selectedNode = services.find(s => s.id === selected);

  const getNodeType = (svc) => {
    if (svc.name?.includes('gateway') || svc.name?.includes('api')) return 'gateway';
    if (svc.name?.includes('db') || svc.name?.includes('cache') || svc.name?.includes('data')) return 'database';
    return 'service';
  };

  return (
    <div>
      <TopBar title="Infrastructure Map" subtitle="Live service architecture & blast radius preview" onRefresh={load} />
      <div className="p-6 space-y-5">

        {/* Legend */}
        <div className="flex items-center gap-4 flex-wrap">
          {[
            { color: 'hsl(var(--success))', label: 'Healthy' },
            { color: 'hsl(var(--warning))', label: 'Degraded' },
            { color: 'hsl(var(--destructive))', label: 'Down' },
            { color: 'hsl(var(--primary))', label: 'Recovering' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
              {label}
            </div>
          ))}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" />
            Chaos Injection Active
          </div>
          <div className="ml-auto text-xs text-muted-foreground font-mono">{services.length} nodes · {edges.length} connections</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* SVG Graph */}
          <div className="lg:col-span-2 bg-card border border-border rounded-xl overflow-hidden" style={{ minHeight: 520 }}>
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
              </div>
            ) : (
              <svg ref={svgRef} viewBox="0 0 800 500" className="w-full h-full" style={{ minHeight: 520 }}>
                {/* Background grid */}
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.5" />
                  </pattern>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>
                <rect width="800" height="500" fill="url(#grid)" />

                {/* Edges */}
                {edges.map((e, i) => {
                  const from = positions[e.from];
                  const to = positions[e.to];
                  if (!from || !to) return null;
                  const isChaos = activeExperimentServices.has(services.find(s => s.id === e.from)?.name) ||
                                  activeExperimentServices.has(services.find(s => s.id === e.to)?.name);
                  return (
                    <line key={i}
                      x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                      stroke={isChaos ? 'hsl(var(--destructive))' : 'hsl(var(--border))'}
                      strokeWidth={isChaos ? 2 : 1}
                      strokeDasharray={isChaos ? '6 3' : '0'}
                      opacity={isChaos ? 0.8 : 0.6}
                    />
                  );
                })}

                {/* Nodes */}
                {services.map(svc => {
                  const pos = positions[svc.id];
                  if (!pos) return null;
                  const type = getNodeType(svc);
                  const color = STATUS_COLORS[svc.status] || STATUS_COLORS.healthy;
                  const typeConfig = NODE_TYPES[type];
                  const isChaosTarget = activeExperimentServices.has(svc.name);
                  const isSelected = selected === svc.id;
                  const r = 34;

                  return (
                    <g key={svc.id} transform={`translate(${pos.x},${pos.y})`} style={{ cursor: 'pointer' }}
                       onClick={() => setSelected(selected === svc.id ? null : svc.id)}>
                      {/* Glow ring for chaos target */}
                      {isChaosTarget && (
                        <circle r={r + 10} fill="hsl(var(--destructive) / 0.15)" stroke="hsl(var(--destructive))" strokeWidth="1.5" strokeDasharray="4 2">
                          <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="4s" repeatCount="indefinite" />
                        </circle>
                      )}
                      {/* Selection ring */}
                      {isSelected && <circle r={r + 6} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" opacity="0.6" />}
                      {/* Node background */}
                      <circle r={r} fill={typeConfig.bg} stroke={color} strokeWidth={isSelected ? 2.5 : 1.5} filter={isSelected ? 'url(#glow)' : ''} />
                      {/* Status dot */}
                      <circle cx={r - 4} cy={-(r - 4)} r={5} fill={color} />
                      {/* Label */}
                      <text y={r + 14} textAnchor="middle" fill="hsl(var(--foreground))" fontSize="9" fontFamily="JetBrains Mono, monospace" fontWeight="500">
                        {svc.name?.length > 14 ? svc.name.slice(0, 13) + '…' : svc.name}
                      </text>
                      {/* CPU text */}
                      <text y={5} textAnchor="middle" fill={typeConfig.color} fontSize="11" fontFamily="JetBrains Mono, monospace" fontWeight="600">
                        {svc.cpu_usage != null ? `${Math.round(svc.cpu_usage)}%` : '—'}
                      </text>
                      <text y={18} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="8" fontFamily="JetBrains Mono, monospace">CPU</text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>

          {/* Node detail panel */}
          <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4">
            {selectedNode ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: NODE_TYPES[getNodeType(selectedNode)]?.bg }}>
                    {(() => { const Icon = NODE_TYPES[getNodeType(selectedNode)]?.icon || Server; return <Icon className="w-5 h-5" style={{ color: NODE_TYPES[getNodeType(selectedNode)]?.color }} />; })()}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground font-mono">{selectedNode.name}</h3>
                    <p className="text-xs text-muted-foreground capitalize">{selectedNode.status}</p>
                  </div>
                </div>

                {activeExperimentServices.has(selectedNode.name) && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20">
                    <Zap className="w-3.5 h-3.5 text-destructive animate-pulse" />
                    <span className="text-xs text-destructive font-medium">Chaos injection active</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'CPU', value: selectedNode.cpu_usage != null ? `${Math.round(selectedNode.cpu_usage)}%` : '—', icon: Cpu, danger: selectedNode.cpu_usage > 80 },
                    { label: 'Memory', value: selectedNode.memory_usage != null ? `${Math.round(selectedNode.memory_usage)}%` : '—', icon: MemoryStick, danger: selectedNode.memory_usage > 85 },
                    { label: 'Latency', value: selectedNode.avg_latency_ms != null ? `${selectedNode.avg_latency_ms}ms` : '—', icon: Activity, danger: selectedNode.avg_latency_ms > 300 },
                    { label: 'RPS', value: selectedNode.requests_per_second != null ? `${selectedNode.requests_per_second}` : '—', icon: Server, danger: false },
                  ].map(({ label, value, icon: Icon, danger }) => (
                    <div key={label} className={`rounded-lg p-3 border ${danger ? 'border-destructive/30 bg-destructive/5' : 'border-border bg-secondary'}`}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon className={`w-3 h-3 ${danger ? 'text-destructive' : 'text-muted-foreground'}`} />
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
                      </div>
                      <p className={`text-base font-bold font-mono ${danger ? 'text-destructive' : 'text-foreground'}`}>{value}</p>
                    </div>
                  ))}
                </div>

                {selectedNode.version && (
                  <div className="text-xs text-muted-foreground font-mono bg-secondary rounded px-3 py-2">
                    v{selectedNode.version} · {selectedNode.namespace || 'default'} · {selectedNode.replicas_ready}/{selectedNode.replicas_desired} replicas
                  </div>
                )}

                <div className="pt-2 border-t border-border mt-auto">
                  <p className="text-xs text-muted-foreground mb-2">Quick Actions</p>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 gap-1.5 text-xs h-8 bg-primary/20 text-primary hover:bg-primary/30 border-0">
                      <Zap className="w-3 h-3" /> Inject Chaos
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 gap-1.5 text-xs h-8">
                      <Activity className="w-3 h-3" /> Monitor
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-12 gap-3 text-center">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Server className="w-6 h-6 text-primary/40" />
                </div>
                <p className="text-sm text-muted-foreground">Click a node to inspect service details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}