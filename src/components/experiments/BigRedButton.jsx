import { useState } from 'react';
import { AlertTriangle, RotateCcw, ShieldOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BigRedButton({ onRollback, experimentName, className }) {
  const [phase, setPhase] = useState('idle'); // idle | confirm | rolling | done

  const handleClick = async () => {
    if (phase === 'idle') { setPhase('confirm'); return; }
    if (phase === 'confirm') {
      setPhase('rolling');
      await new Promise(r => setTimeout(r, 1800));
      await onRollback?.();
      setPhase('done');
      setTimeout(() => setPhase('idle'), 3000);
    }
  };

  const configs = {
    idle: {
      label: 'Emergency Rollback',
      icon: ShieldOff,
      cls: 'bg-destructive/10 text-destructive border-destructive/40 hover:bg-destructive hover:text-destructive-foreground',
    },
    confirm: {
      label: 'Confirm Rollback?',
      icon: AlertTriangle,
      cls: 'bg-destructive text-destructive-foreground border-destructive animate-pulse',
    },
    rolling: {
      label: 'Rolling Back…',
      icon: Loader2,
      cls: 'bg-destructive/20 text-destructive border-destructive/30 cursor-not-allowed',
      spin: true,
    },
    done: {
      label: 'Rollback Complete',
      icon: RotateCcw,
      cls: 'bg-success/10 text-success border-success/30',
    },
  };

  const cfg = configs[phase];
  const Icon = cfg.icon;

  return (
    <div className={cn('flex flex-col items-start gap-2', className)}>
      <button
        disabled={phase === 'rolling' || phase === 'done'}
        onClick={handleClick}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-all duration-200 select-none',
          cfg.cls
        )}
      >
        <Icon className={cn('w-4 h-4', cfg.spin && 'animate-spin')} />
        {cfg.label}
      </button>
      {phase === 'confirm' && (
        <p className="text-[10px] text-muted-foreground">
          This will abort <span className="text-foreground font-medium">{experimentName}</span> and trigger k8s rollback.{' '}
          <button className="text-muted-foreground underline hover:text-foreground" onClick={() => setPhase('idle')}>Cancel</button>
        </p>
      )}
    </div>
  );
}