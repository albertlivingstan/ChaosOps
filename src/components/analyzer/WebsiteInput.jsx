import { useState } from 'react';
import { Search, Globe, Link as LinkIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function WebsiteInput({ onAnalyze, isAnalyzing }) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url && !isAnalyzing) {
      onAnalyze(url);
    }
  };

  return (
    <div className="bg-card border border-border shadow-lg rounded-xl p-6 relative overflow-hidden">
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
      
      <div className="relative z-10">
        <h2 className="text-xl font-semibold mb-2 text-foreground flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary" />
          Web Target Analysis
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Enter a website URL to instantly detect bugs, performance bottlenecks, and service misconfigurations before client delivery.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <LinkIcon className="w-4 h-4 text-muted-foreground" />
            </div>
            <input
              type="url"
              className="block w-full pl-10 pr-3 py-3 border border-border rounded-lg bg-secondary/50 text-foreground focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-all"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              disabled={isAnalyzing}
            />
          </div>
          <button
            type="submit"
            disabled={!url || isAnalyzing}
            className={cn(
              "flex items-center justify-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-primary-foreground transition-all shrink-0",
              (!url || isAnalyzing) ? "bg-primary/50 cursor-not-allowed" : "bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-background"
            )}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing Target...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Run Analysis
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
