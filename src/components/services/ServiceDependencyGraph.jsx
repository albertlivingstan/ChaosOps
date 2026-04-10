import { useState, useRef, useEffect, useCallback } from 'react';
import { Zap, Server, Cpu, Activity, Clock, Shield } from 'lucide-react';

// Deterministic layout: place nodes in a layered circle
function computeLayout(services, width, height) {
  if (services.length === 0) return [];
  const cx = width / 2;
  const cy = height / 2;
  const r = Math.min(width, height) * 0.36;
  return services.map((svc, i) => {
    const angle = (i / services.length) * 2 * Math.PI - Math.PI / 2;
    return {
      ...svc,
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  });
}

// Build a fake but deterministic dependency graph based on service index
function buildEdges(nodes) {
  const edges = [];
  if (nodes.length < 2) return edges;
  // Each node connects to 1-2 "downstream" nodes based on index
  nodes.forEach((node, i) => {
    const targets = [(i + 1) % nodes.length, (i + 2) % nodes.length];
    targets.slice(0, i % 2 === 0 ? 2 : 1).forEach(j => {
      if (j !== i) edges.push({ from: node.id, to: nodes[j].id });
    });
  });
  return edges;
}

const STATUS_COLORS = {
  healthy: '#22c55e',
  degraded: '#f59e0b',
  down: '#ef4444',
  recovering: '#38bdf8',
};

const CHAOS_COLOR = '#ef4444';
const CHAOS_RING_COLOR = '#f97316';

function NodeTooltip({ node, chaosExp }) {
  return (
    <div className="pointer-events-none absolute z-50 bg-card border border-border rounded-xl shadow-2xl p-4 w-56 text-xs"
      style={{ left: node.x + 20, top: node.y - 60 }}>
      <div className="flex items-center gap-2 mb-2">
        <Server className="w-3.5 h-3.5 text-primary shrink-0" />
        <span className="font-semibold text-foreground truncate">{node.name}</span>
      </div>
      <div className="space-y-1.5 text-muted-foreground">
        <div className="flex justify-between">
          <span className="flex items-center gap-1"><Cpu className="w-3 h-3" />CPU</span>
          <span className="font-mono text-foreground">{node.cpu_usage ?? '–'}%</span>
        </div>
        <div className="flex justify-between">
          <span className="flex items-center gap-1"><Activity className="w-3 h-3" />Memory</span>
          <span className="font-mono text-foreground">{node.memory_usage ?? '–'}%</span>
        </div>
        <div className="flex justify-between">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Latency</span>
          <span className="font-mono text-foreground">{node.avg_latency_ms ?? '–'}ms</span>
        </div>
        <div className="flex justify-between">
          <span className="flex items-center gap-1"><Shield className="w-3 h-3" />Uptime</span>
          <span className="font-mono text-foreground">{node.uptime_percentage ?? 99.9}%</span>
        </div>
        <div className="flex justify-between">
          <span>Pods</span>
          <span className="font-mono text-foreground">{node.replicas_ready ?? 0}/{node.replicas_desired ?? 0}</span>
        </div>
      </div>
      {chaosExp && (
        <div className="mt-2 pt-2 border-t border-border">
          <div className="flex items-center gap-1.5 text-orange-400 font-semibold">
            <Zap className="w-3 h-3" />
            <span>Chaos Active</span>
          </div>
          <p className="text-muted-foreground mt-0.5 truncate">{chaosExp.chaos_type?.replace(/_/g, ' ')} · {chaosExp.intensity}</p>
        </div>
      )}
    </div>
  );
}

export default function ServiceDependencyGraph({ services, experiments }) {
  const containerRef = useRef(null);
  const [dims, setDims] = useState({ w: 800, h: 480 });
  const [hovered, setHovered] = useState(null);
  const [pulse, setPulse] = useState(0);

  // Measure container
  useEffect(() => {
    const obs = new ResizeObserver(entries => {
      const { width } = entries[0].contentRect;
      setDims({ w: width, h: Math.max(380, width * 0.55) });
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // Pulse animation for chaos nodes
  useEffect(() => {
    const id = setInterval(() => setPulse(p => p + 1), 700);
    return () => clearInterval(id);
  }, []);

  const runningExp = experiments.filter(e => e.status === 'running');
  const affectedServices = new Set(runningExp.map(e => e.target_service));

  const nodes = computeLayout(services, dims.w, dims.h);
  const edges = buildEdges(nodes);

  const getNode = (id) => nodes.find(n => n.id === id);
  const getRunningChaos = (name) => runningExp.find(e => e.target_service === name);

  const isEdgeAffected = (edge) => {
    const fromNode = getNode(edge.from);
    const toNode = getNode(edge.to);
    return (fromNode && affectedServices.has(fromNode.name)) || (toNode && affectedServices.has(toNode.name));
  };

  const NODE_R = Math.max(22, Math.min(32, dims.w / (services.length * 2.5 + 1)));

  return (
    <div ref={containerRef} className="relative w-full bg-card border border-border rounded-xl overflow-hidden">
      {/* Legend */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-3 text-xs">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <span key={status} className="flex items-center gap-1.5 bg-secondary/80 px-2 py-1 rounded-md">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
            <span className="text-muted-foreground capitalize">{status}</span>
          </span>
        ))}
        <span className="flex items-center gap-1.5 bg-secondary/80 px-2 py-1 rounded-md">
          <span className="w-2.5 h-2.5 rounded-full border-2" style={{ borderColor: CHAOS_RING_COLOR, background: 'transparent' }} />
          <span className="text-orange-400 font-medium">Chaos Active</span>
        </span>
      </div>

      {/* Running experiments badge */}
      {runningExp.length > 0 && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-orange-500/15 border border-orange-500/30 text-orange-400 px-3 py-1.5 rounded-lg text-xs font-medium">
          <Zap className="w-3.5 h-3.5" />
          {runningExp.length} chaos injection{runningExp.length > 1 ? 's' : ''} active
        </div>
      )}

      <svg width={dims.w} height={dims.h} className="block">
        <defs>
          <filter id="glow-green">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glow-red">
            <feGaussianBlur stdDeviation="5" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="6" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="hsl(222,47%,25%)" />
          </marker>
          <marker id="arrowhead-chaos" markerWidth="8" markerHeight="6" refX="6" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#f97316" />
          </marker>
        </defs>

        {/* Edges */}
        {edges.map((edge, i) => {
          const from = getNode(edge.from);
          const to = getNode(edge.to);
          if (!from || !to) return null;
          const affected = isEdgeAffected(edge);
          const pulsing = affected && pulse % 2 === 0;
          return (
            <line
              key={i}
              x1={from.x} y1={from.y}
              x2={to.x} y2={to.y}
              stroke={affected ? (pulsing ? '#f97316' : '#f9731660') : 'hsl(222,47%,22%)'}
              strokeWidth={affected ? 2 : 1}
              strokeDasharray={affected ? '5 3' : 'none'}
              markerEnd={affected ? 'url(#arrowhead-chaos)' : 'url(#arrowhead)'}
              style={{ transition: 'stroke 0.35s, stroke-width 0.35s' }}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map(node => {
          const isAffected = affectedServices.has(node.name);
          const chaos = getRunningChaos(node.name);
          const color = STATUS_COLORS[node.status] || STATUS_COLORS.healthy;
          const isHovered = hovered?.id === node.id;
          const ringPulse = isAffected && pulse % 2 === 0;

          return (
            <g
              key={node.id}
              transform={`translate(${node.x}, ${node.y})`}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHovered(node)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Chaos outer ring pulse */}
              {isAffected && (
                <circle
                  r={NODE_R + 10}
                  fill="none"
                  stroke={CHAOS_RING_COLOR}
                  strokeWidth={ringPulse ? 2 : 1}
                  opacity={ringPulse ? 0.8 : 0.3}
                  style={{ transition: 'all 0.4s ease' }}
                />
              )}

              {/* Glow ring on hover */}
              {isHovered && (
                <circle r={NODE_R + 6} fill={color} opacity={0.15} />
              )}

              {/* Main node circle */}
              <circle
                r={NODE_R}
                fill={`${color}18`}
                stroke={isAffected ? CHAOS_RING_COLOR : color}
                strokeWidth={isAffected ? 2.5 : isHovered ? 2 : 1.5}
                filter={isAffected ? 'url(#glow-red)' : isHovered ? 'url(#glow-green)' : undefined}
                style={{ transition: 'all 0.2s ease' }}
              />

              {/* Icon */}
              <foreignObject x={-8} y={-8} width={16} height={16} style={{ pointerEvents: 'none' }}>
                <div xmlns="http://www.w3.org/1999/xhtml" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                  {isAffected
                    ? <Zap style={{ width: 12, height: 12, color: CHAOS_RING_COLOR }} />
                    : <Server style={{ width: 12, height: 12, color }} />
                  }
                </div>
              </foreignObject>

              {/* Label */}
              <text
                y={NODE_R + 14}
                textAnchor="middle"
                fill={isAffected ? CHAOS_RING_COLOR : isHovered ? color : 'hsl(215,20%,65%)'}
                fontSize={10}
                fontFamily="JetBrains Mono, monospace"
                fontWeight={isHovered || isAffected ? '600' : '400'}
                style={{ transition: 'fill 0.2s' }}
              >
                {node.name.length > 14 ? node.name.slice(0, 13) + '…' : node.name}
              </text>

              {/* Status dot */}
              <circle cx={NODE_R - 4} cy={-(NODE_R - 4)} r={4} fill={color} stroke="hsl(222,47%,9%)" strokeWidth={1.5} />
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {hovered && (
        <NodeTooltip
          node={hovered}
          chaosExp={getRunningChaos(hovered.name)}
        />
      )}

      {services.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
          <Server className="w-8 h-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No services to display</p>
        </div>
      )}
    </div>
  );
}