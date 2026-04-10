import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Sparkles, ChevronDown, ChevronUp, AlertTriangle, Wrench, ShieldCheck, Loader2 } from 'lucide-react';

const PATCH_ICONS = { critical: AlertTriangle, warning: Wrench, info: ShieldCheck };
const PATCH_COLORS = { critical: 'text-destructive', warning: 'text-warning', info: 'text-primary' };

export default function PostMortemSection({ experiment }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const generate = async () => {
    setLoading(true);
    setOpen(true);
    const data = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a site reliability engineer. A chaos experiment just completed with the following details:
- Name: ${experiment.name}
- Target service: ${experiment.target_service}
- Chaos type: ${experiment.chaos_type?.replace(/_/g, ' ')}
- Intensity: ${experiment.intensity}
- Duration: ${experiment.duration_seconds}s
- Status: ${experiment.status}
- Recovery time: ${experiment.recovery_time_seconds ?? 'unknown'}s
- Result summary: ${experiment.result_summary || 'No summary provided'}

Generate a structured post-mortem report with:
1. A 2-sentence executive summary of what happened and impact.
2. Root cause analysis (1-3 bullet points).
3. Exactly 3-5 specific infrastructure patch recommendations. Each patch must have: a severity (critical/warning/info), a short title, and a 1-sentence action description.
4. A resilience improvement score delta (e.g. +5 or -3) as a number.`,
      response_json_schema: {
        type: 'object',
        properties: {
          executive_summary: { type: 'string' },
          root_causes: { type: 'array', items: { type: 'string' } },
          patches: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                severity: { type: 'string' },
                title: { type: 'string' },
                action: { type: 'string' },
              },
            },
          },
          resilience_delta: { type: 'number' },
        },
      },
    });
    setResult(data);
    setLoading(false);
  };

  return (
    <div className="mt-3 border-t border-border pt-3">
      <div className="flex items-center justify-between">
        <button
          onClick={() => result ? setOpen(o => !o) : generate()}
          className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
        >
          <Sparkles className="w-3.5 h-3.5" />
          {result ? 'Post-Mortem Report' : 'Generate Post-Mortem'}
          {result && (open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
        </button>
        {result && (
          <span className={`text-xs font-mono font-bold ${result.resilience_delta >= 0 ? 'text-success' : 'text-destructive'}`}>
            {result.resilience_delta >= 0 ? '+' : ''}{result.resilience_delta} resilience
          </span>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing experiment data...
        </div>
      )}

      {result && open && (
        <div className="mt-3 space-y-4 text-xs">
          {/* Summary */}
          <div className="bg-secondary/60 rounded-lg p-3">
            <p className="text-muted-foreground font-medium mb-1 uppercase tracking-wide text-[10px]">Executive Summary</p>
            <p className="text-foreground leading-relaxed">{result.executive_summary}</p>
          </div>

          {/* Root causes */}
          <div>
            <p className="text-muted-foreground font-medium mb-2 uppercase tracking-wide text-[10px]">Root Cause Analysis</p>
            <ul className="space-y-1">
              {result.root_causes?.map((cause, i) => (
                <li key={i} className="flex items-start gap-2 text-foreground">
                  <span className="text-primary mt-0.5">•</span> {cause}
                </li>
              ))}
            </ul>
          </div>

          {/* Patches */}
          <div>
            <p className="text-muted-foreground font-medium mb-2 uppercase tracking-wide text-[10px]">Infrastructure Patches</p>
            <div className="space-y-2">
              {result.patches?.map((patch, i) => {
                const Icon = PATCH_ICONS[patch.severity] || Wrench;
                const color = PATCH_COLORS[patch.severity] || 'text-muted-foreground';
                return (
                  <div key={i} className="flex items-start gap-2.5 bg-secondary/40 rounded-lg p-2.5">
                    <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${color}`} />
                    <div>
                      <p className={`font-semibold ${color}`}>{patch.title}</p>
                      <p className="text-muted-foreground mt-0.5 leading-relaxed">{patch.action}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}