import { useState } from 'react';
import { Clock, Check, BellRing } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DailyMonitorToggle({ isEnabled, onToggle }) {
  return (
    <div className="bg-gradient-to-r from-card to-card/50 border border-border rounded-xl p-5 shadow-sm mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-full bg-primary/10 text-primary">
          <Clock className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-foreground">Daily Scheduled Monitoring</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-lg">
            Automatically analyze this target every 24 hours. ChaosOps will alert you if performance degrades or new vulnerabilities are detected.
          </p>
        </div>
      </div>
      
      <button
        onClick={onToggle}
        className={cn(
          "relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
          isEnabled ? "bg-primary" : "bg-muted"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
            isEnabled ? "translate-x-6" : "translate-x-0"
          )}
        >
          {isEnabled ? (
            <Check className="absolute inset-0 m-auto h-4 w-4 text-primary" />
          ) : (
            <BellRing className="absolute inset-0 m-auto h-4 w-4 text-muted-foreground" />
          )}
        </span>
      </button>
    </div>
  );
}
