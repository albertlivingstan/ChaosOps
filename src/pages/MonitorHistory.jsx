import { useState, useEffect } from 'react';
import TopBar from '@/components/layout/TopBar';
import { base44 } from '@/api/base44Client';
import { Globe, Trash2, ShieldCheck, Activity, Calendar as CalendarIcon, ExternalLink } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export default function MonitorHistory() {
  const [websites, setWebsites] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWebsites = async () => {
    setLoading(true);
    const data = await base44.entities.MonitoredWebsite.list('-last_analyzed');
    setWebsites(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchWebsites();
  }, []);

  const handleDelete = async (id, url) => {
    const success = await base44.entities.MonitoredWebsite.delete(id);
    if (success) {
      setWebsites(prev => prev.filter(w => w.id !== id));
      toast({ title: "Deleted", description: `Removed targeting for ${url}` });
    } else {
      toast({ title: "Error", description: "Could not remove target", variant: "destructive" });
    }
  };

  // Helper date formatter
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString(undefined, { 
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

  return (
    <div>
      <TopBar title="Monitor History" subtitle="Track performance and manage actively monitored applications" />
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        
        <div className="bg-card border border-border shadow-lg rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-secondary/30 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              Target Applications
            </h3>
            <span className="text-sm font-medium bg-primary/20 text-primary px-3 py-1 rounded-full">
              {websites.length} Monitored
            </span>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground flex items-center justify-center gap-2">
                <Activity className="w-4 h-4 animate-spin" /> Loading configurations...
              </div>
            ) : websites.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Globe className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p>No websites are currently being monitored.</p>
                <p className="text-xs mt-1">Go to Web Analyzer to scan your first target.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 text-xs text-muted-foreground uppercase tracking-wider">
                    <th className="text-left font-medium p-4">URL / Endpoint</th>
                    <th className="text-left font-medium p-4">Status</th>
                    <th className="text-left font-medium p-4">Performance</th>
                    <th className="text-left font-medium p-4">Bugs Rectified</th>
                    <th className="text-left font-medium p-4">Last Scanned</th>
                    <th className="text-right font-medium p-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {websites.map(site => (
                    <tr key={site.id} className="hover:bg-secondary/20 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${site.status === 'Active' ? 'bg-success pulse-green' : 'bg-muted'}`} />
                          <span className="font-semibold text-foreground">{site.url.replace(/^https?:\/\//, '')}</span>
                          <a href={site.url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100">
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </td>
                      <td className="p-4 text-xs font-medium text-foreground">{site.status}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                           <div className="w-full max-w-[80px] bg-secondary rounded-full h-1.5 overflow-hidden">
                             <div className={`h-full ${site.performance_score > 80 ? 'bg-success' : site.performance_score > 50 ? 'bg-warning' : 'bg-destructive'}`} style={{ width: `${site.performance_score || 0}%` }} />
                           </div>
                           <span className="text-xs font-mono">{site.performance_score || 0}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 font-mono text-primary font-medium">
                          <ShieldCheck className="w-4 h-4" />
                          {site.bugs_rectified || 0} Auto-Fixed
                        </div>
                      </td>
                      <td className="p-4 text-xs text-muted-foreground flex items-center gap-1.5">
                        <CalendarIcon className="w-3 h-3" />
                        {formatDate(site.last_analyzed)}
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => handleDelete(site.id, site.url)}
                          className="opacity-0 group-hover:opacity-100 p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                          title="Delete Target"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
