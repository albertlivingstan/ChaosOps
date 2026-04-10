import { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

// Simulates realistic metric drift during chaos based on type & intensity
function mutateMetrics(base, chaosType, intensity, tick) {
  const intensityMult = { low: 1.1, medium: 1.4, high: 1.8, critical: 2.5 }[intensity] || 1.2;
  const spike = (base, factor, noise) =>
    Math.min(100, Math.max(0, base * factor + (Math.random() - 0.4) * noise));

  let cpu = base.cpu;
  let memory = base.memory;
  let latency = base.latency;
  let rps = base.rps;
  let errorRate = base.errorRate;

  switch (chaosType) {
    case 'cpu_stress':
      cpu = spike(base.cpu, intensityMult, 8);
      latency = spike(base.latency, 1 + (intensityMult - 1) * 0.5, 15);
      break;
    case 'memory_stress':
      memory = spike(base.memory, intensityMult, 6);
      latency = spike(base.latency, 1.1, 10);
      break;
    case 'network_latency':
      latency = spike(base.latency, intensityMult * 2.5, 30);
      rps = spike(base.rps, 1 / intensityMult, 5);
      break;
    case 'network_loss':
      rps = spike(base.rps, 1 / intensityMult, 8);
      errorRate = Math.min(100, base.errorRate + intensityMult * 10 + Math.random() * 5);
      latency = spike(base.latency, intensityMult, 20);
      break;
    case 'pod_kill':
    case 'service_crash':
      cpu = spike(base.cpu, 0.3, 5);
      rps = spike(base.rps, 0.2, 3);
      errorRate = Math.min(100, base.errorRate + intensityMult * 20 + Math.random() * 10);
      break;
    case 'disk_fill':
      latency = spike(base.latency, intensityMult * 1.5, 20);
      cpu = spike(base.cpu, 1.2, 5);
      break;
    default:
      cpu = spike(base.cpu, intensityMult * 0.9, 5);
      latency = spike(base.latency, intensityMult * 0.8, 10);
  }

  return {
    cpu: +cpu.toFixed(1),
    memory: +memory.toFixed(1),
    latency: +latency.toFixed(0),
    rps: +rps.toFixed(1),
    errorRate: +errorRate.toFixed(2),
    ts: Date.now(),
  };
}

const HISTORY_LENGTH = 30;

export function useLiveMetrics(experiment, service) {
  const [history, setHistory] = useState([]);
  const [current, setCurrent] = useState(null);
  const baseRef = useRef(null);
  const intervalRef = useRef(null);
  const tickRef = useRef(0);

  const seedBase = useCallback((svc) => {
    return {
      cpu: svc?.cpu_usage ?? 30,
      memory: svc?.memory_usage ?? 45,
      latency: svc?.avg_latency_ms ?? 120,
      rps: svc?.requests_per_second ?? 200,
      errorRate: 0.1,
    };
  }, []);

  useEffect(() => {
    if (!experiment || experiment.status !== 'running') {
      clearInterval(intervalRef.current);
      return;
    }

    baseRef.current = seedBase(service);
    tickRef.current = 0;

    // Seed initial point
    const initial = { ...baseRef.current, ts: Date.now() };
    setCurrent(initial);
    setHistory([initial]);

    intervalRef.current = setInterval(() => {
      tickRef.current += 1;
      const next = mutateMetrics(
        baseRef.current,
        experiment.chaos_type,
        experiment.intensity,
        tickRef.current
      );
      // Slowly drift base toward chaotic state
      baseRef.current = {
        cpu: baseRef.current.cpu * 0.85 + next.cpu * 0.15,
        memory: baseRef.current.memory * 0.9 + next.memory * 0.1,
        latency: baseRef.current.latency * 0.8 + next.latency * 0.2,
        rps: baseRef.current.rps * 0.9 + next.rps * 0.1,
        errorRate: baseRef.current.errorRate * 0.8 + next.errorRate * 0.2,
      };
      setCurrent(next);
      setHistory(h => [...h.slice(-HISTORY_LENGTH + 1), next]);
    }, 1500);

    return () => clearInterval(intervalRef.current);
  }, [experiment?.id, experiment?.status, service]);

  return { current, history };
}