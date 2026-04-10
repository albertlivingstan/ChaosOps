import TopBar from '@/components/layout/TopBar';
import { GitBranch, CheckCircle, XCircle, Clock, Play, RefreshCw, Package, Box, GitCommit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { motion } from 'framer-motion';

const PIPELINES = [
  {
    id: 1, name: 'api-gateway', branch: 'main', commit: 'a3f21c9', message: 'feat: add rate limiting middleware',
    status: 'success', duration: '3m 42s', triggered: '2 min ago',
    stages: [
      { name: 'Checkout', status: 'success', duration: '0:05' },
      { name: 'Install', status: 'success', duration: '0:48' },
      { name: 'Lint', status: 'success', duration: '0:12' },
      { name: 'Test', status: 'success', duration: '1:20' },
      { name: 'Build Image', status: 'success', duration: '0:55' },
      { name: 'Push Registry', status: 'success', duration: '0:22' },
      { name: 'Deploy K8s', status: 'success', duration: '0:22' },
    ]
  },
  {
    id: 2, name: 'payment-service', branch: 'feature/stripe-v2', commit: 'b1d9e33', message: 'fix: handle webhook timeout errors',
    status: 'running', duration: '1m 18s', triggered: '5 min ago',
    stages: [
      { name: 'Checkout', status: 'success', duration: '0:04' },
      { name: 'Install', status: 'success', duration: '0:52' },
      { name: 'Lint', status: 'success', duration: '0:10' },
      { name: 'Test', status: 'running', duration: '—' },
      { name: 'Build Image', status: 'pending', duration: '—' },
      { name: 'Push Registry', status: 'pending', duration: '—' },
      { name: 'Deploy K8s', status: 'pending', duration: '—' },
    ]
  },
  {
    id: 3, name: 'user-service', branch: 'main', commit: 'c5a8b11', message: 'chore: bump dependencies',
    status: 'failed', duration: '2m 01s', triggered: '12 min ago',
    stages: [
      { name: 'Checkout', status: 'success', duration: '0:05' },
      { name: 'Install', status: 'success', duration: '0:44' },
      { name: 'Lint', status: 'success', duration: '0:09' },
      { name: 'Test', status: 'failed', duration: '1:03' },
      { name: 'Build Image', status: 'skipped', duration: '—' },
      { name: 'Push Registry', status: 'skipped', duration: '—' },
      { name: 'Deploy K8s', status: 'skipped', duration: '—' },
    ]
  },
  {
    id: 4, name: 'auth-service', branch: 'main', commit: 'e2f77a0', message: 'perf: optimize JWT validation',
    status: 'success', duration: '4m 12s', triggered: '1h ago',
    stages: [
      { name: 'Checkout', status: 'success', duration: '0:04' },
      { name: 'Install', status: 'success', duration: '0:51' },
      { name: 'Lint', status: 'success', duration: '0:11' },
      { name: 'Test', status: 'success', duration: '1:44' },
      { name: 'Build Image', status: 'success', duration: '1:02' },
      { name: 'Push Registry', status: 'success', duration: '0:20' },
      { name: 'Deploy K8s', status: 'success', duration: '0:20' },
    ]
  },
];

const stageColors = {
  success: 'bg-success text-success-foreground',
  failed: 'bg-destructive text-destructive-foreground',
  running: 'bg-primary text-primary-foreground animate-pulse',
  pending: 'bg-secondary text-muted-foreground border border-border',
  skipped: 'bg-secondary/50 text-muted-foreground/50',
};

const statusIcon = {
  success: <CheckCircle className="w-4 h-4 text-success" />,
  failed: <XCircle className="w-4 h-4 text-destructive" />,
  running: <RefreshCw className="w-4 h-4 text-primary animate-spin" />,
  pending: <Clock className="w-4 h-4 text-muted-foreground" />,
};

export default function Pipeline() {
  const [expanded, setExpanded] = useState(null);

  return (
    <div>
      <TopBar title="CI/CD Pipeline" subtitle="GitHub Actions — build, test, deploy" />
      <div className="p-6 space-y-6">

        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Runs Today', value: '24', icon: Play, color: 'text-primary' },
            { label: 'Passed', value: '19', icon: CheckCircle, color: 'text-success' },
            { label: 'Failed', value: '3', icon: XCircle, color: 'text-destructive' },
            { label: 'Avg Build Time', value: '3m 28s', icon: Clock, color: 'text-warning' },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
              <s.icon className={`w-6 h-6 ${s.color} shrink-0`} />
              <div>
                <p className="text-xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Pipeline runs */}
        <div className="space-y-3">
          {PIPELINES.map(pipeline => (
            <motion.div key={pipeline.id} layout className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/20 transition-colors">
              <div
                className="flex items-center gap-4 p-5 cursor-pointer"
                onClick={() => setExpanded(expanded === pipeline.id ? null : pipeline.id)}
              >
                <div className="shrink-0">{statusIcon[pipeline.status]}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-semibold text-foreground text-sm">{pipeline.name}</span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground font-mono bg-secondary px-2 py-0.5 rounded">
                      <GitBranch className="w-3 h-3" />{pipeline.branch}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                      <GitCommit className="w-3 h-3" />{pipeline.commit}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">{pipeline.message}</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{pipeline.duration}</span>
                  <span>{pipeline.triggered}</span>
                </div>
              </div>

              {expanded === pipeline.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-border px-5 pb-5 pt-4"
                >
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Pipeline Stages</p>
                  <div className="flex flex-wrap gap-2">
                    {pipeline.stages.map((stage, i) => (
                      <div key={i} className="flex flex-col items-center gap-1.5">
                        <div className={`px-3 py-1.5 rounded-lg text-xs font-medium ${stageColors[stage.status]}`}>
                          {stage.name}
                        </div>
                        <span className="text-xs text-muted-foreground font-mono">{stage.duration}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}