import { useState, useEffect } from 'react';
import TopBar from '@/components/layout/TopBar';
import { Settings, Server, Bell, Shield, Database, GitBranch, UserX, Slack, CloudLightning, Webhook, Key, CheckCircle, Save, Loader2, Code } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

const INTEGRATIONS = [
  { id: 'slack', name: 'Slack', description: 'Send alerts and experiment notifications to Slack channels', icon: Slack, color: 'text-warning', connected: false, placeholder: 'https://hooks.slack.com/services/...' },
  { id: 'pagerduty', name: 'PagerDuty', description: 'Trigger PagerDuty incidents on critical experiment failures', icon: CloudLightning, color: 'text-destructive', connected: false, placeholder: 'pdl+abcdef...' },
  { id: 'webhook', name: 'Custom Webhook', description: 'POST experiment events to any HTTP endpoint', icon: Webhook, color: 'text-primary', connected: true, placeholder: 'https://your-api.com/chaos-events' },
  { id: 'terraform', name: 'Terraform Cloud', description: 'Trigger IaC infrastructure chaos states via API', icon: Code, color: 'text-purple-400', connected: false, placeholder: 'tfc_api_token...' },
];

export default function SettingsPage() {
  const [integrations, setIntegrations] = useState(INTEGRATIONS);
  const [apiKeys, setApiKeys] = useState({});
  const [clusterConfig, setClusterConfig] = useState({ apiServer: 'https://k8s-prod-01.internal:6443', namespace: 'production' });
  const [ciCd, setCiCd] = useState({ githubRepo: 'org/chaosops', containerRegistry: 'ghcr.io/org/chaosops' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load existing settings on mount
  useEffect(() => {
    let mounted = true;
    import('@/api/base44Client').then(async (m) => {
      try {
        const res = await m.base44.entities.Setting.list();
        if (res && res.length > 0 && mounted) {
          const s = res[0];
          if (s.integrations && s.integrations.length) {
            // merge stored integrations state with definitions
            setIntegrations(INTEGRATIONS.map(intg => {
              const stored = s.integrations.find(i => i.id === intg.id);
              return stored ? { ...intg, connected: stored.connected } : intg;
            }));
          }
          if (s.githubConfig) {
            setApiKeys(s.githubConfig.apiKeys || {});
            if (s.githubConfig.ciCd) setCiCd(s.githubConfig.ciCd);
            if (s.githubConfig.clusterConfig) setClusterConfig(s.githubConfig.clusterConfig);
          }
        }
      } catch (err) { console.error('Failed to load settings', err); }
      finally { if (mounted) setLoading(false); }
    });
    return () => { mounted = false; };
  }, []);

  const toggleIntegration = (id) => {
    setIntegrations(prev => prev.map(i => i.id === id ? { ...i, connected: !i.connected } : i));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const m = await import('@/api/base44Client');
      const existing = await m.base44.entities.Setting.list();
      const data = { key: 'global', integrations, githubConfig: { apiKeys, ciCd, clusterConfig } };
      if (existing.length > 0) {
        await m.base44.entities.Setting.update(existing[0].id, data);
      } else {
        await m.base44.entities.Setting.create(data);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to save settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground p-20 gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm">Decrypting system configuration...</p>
    </div>
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <TopBar title="Settings" subtitle="Platform configuration & preferences" />
      
      <div className="p-6 max-w-4xl space-y-6 mx-auto pb-24">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="bg-card border border-border/50 shadow-xl shadow-black/20 rounded-xl p-6 transition-all hover:border-primary/30">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Server className="w-4 h-4 text-primary" />
              </div>
              <h2 className="text-sm font-semibold text-foreground tracking-wide">Cluster Edge Config</h2>
            </div>
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Kubernetes API Server</Label>
                <Input value={clusterConfig.apiServer} onChange={e => setClusterConfig(p => ({ ...p, apiServer: e.target.value }))} className="bg-secondary/50 border-border/50 focus:border-primary font-mono text-xs h-9 transition-colors" />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Default Target Namespace</Label>
                <Input value={clusterConfig.namespace} onChange={e => setClusterConfig(p => ({ ...p, namespace: e.target.value }))} className="bg-secondary/50 border-border/50 focus:border-primary font-mono text-xs h-9 transition-colors" />
              </div>
            </div>
          </section>

          <section className="bg-card border border-border/50 shadow-xl shadow-black/20 rounded-xl p-6 transition-all hover:border-primary/30">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-primary/10 rounded-lg">
                <GitBranch className="w-4 h-4 text-primary" />
              </div>
              <h2 className="text-sm font-semibold text-foreground tracking-wide">CI/CD & GitOps Integration</h2>
            </div>
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Source Repository</Label>
                <Input value={ciCd.githubRepo} onChange={e => setCiCd(p => ({ ...p, githubRepo: e.target.value }))} className="bg-secondary/50 border-border/50 focus:border-primary font-mono text-xs h-9 transition-colors" placeholder="e.g. org/chaosops" />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Container Registry</Label>
                <Input value={ciCd.containerRegistry} onChange={e => setCiCd(p => ({ ...p, containerRegistry: e.target.value }))} className="bg-secondary/50 border-border/50 focus:border-primary font-mono text-xs h-9 transition-colors" placeholder="e.g. ghcr.io/org" />
              </div>
            </div>
          </section>
        </div>

        <section className="bg-card border border-border/50 shadow-xl shadow-black/20 rounded-xl p-6 transition-all hover:border-warning/30">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-warning/10 rounded-lg">
              <Shield className="w-4 h-4 text-warning" />
            </div>
            <h2 className="text-sm font-semibold text-foreground tracking-wide">Chaos Mitigation Engine</h2>
          </div>
          <div className="space-y-5 divide-y divide-border/30">
            {[
              { label: 'Auto-abort on critical threshold', description: 'Instantly halt active experiments if system health drops below 50%', defaultChecked: true },
              { label: 'Enforce Production Guard', description: 'Strictly prohibit mutating experiments on production namespace routing', defaultChecked: false },
              { label: 'Require approval for critical tier', description: 'High/critical intensity plans mandate strict 2-MFA manual approval', defaultChecked: true },
            ].map((item, idx) => (
              <div key={item.label} className={`flex items-center justify-between gap-4 ${idx > 0 ? 'pt-5' : ''}`}>
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-1 tracking-wide">{item.description}</p>
                </div>
                <Switch defaultChecked={item.defaultChecked} className="data-[state=checked]:bg-warning" />
              </div>
            ))}
          </div>
        </section>

        {/* Integrations */}
        <section className="bg-card border border-border/50 shadow-xl shadow-black/20 rounded-xl p-6 transition-all hover:border-primary/30">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Webhook className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-sm font-semibold text-foreground tracking-wide">External Integrations</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {integrations.map(intg => {
              const Icon = intg.icon;
              return (
                <div key={intg.id} className={`border rounded-xl p-4 transition-all duration-300 ${intg.connected ? 'bg-secondary/20 border-primary/30' : 'bg-transparent border-border/50 hover:border-border'}`}>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-secondary/80 flex items-center justify-center shadow-inner">
                        <Icon className={`w-5 h-5 ${intg.color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-foreground">{intg.name}</p>
                          {intg.connected && (
                            <Badge className="bg-success/15 text-success hover:bg-success/20 border-0 text-[9px] px-1.5 py-0 gap-1 tracking-wider uppercase font-bold">
                              <CheckCircle className="w-3 h-3" /> Active
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">{intg.description}</p>
                      </div>
                    </div>
                    <Switch checked={intg.connected} onCheckedChange={() => toggleIntegration(intg.id)} />
                  </div>
                  {intg.connected && (
                    <div className="flex items-center gap-3 pt-3 border-t border-border/30">
                      <Key className="w-4 h-4 text-primary/70 shrink-0" />
                      <Input
                        placeholder={intg.placeholder}
                        value={apiKeys[intg.id] || ''}
                        onChange={e => setApiKeys(prev => ({ ...prev, [intg.id]: e.target.value }))}
                        className="bg-background border-border/50 focus:border-primary text-primary font-mono text-[11px] h-8 shadow-inner"
                        type="password"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <div className="flex items-center justify-end gap-4 p-4 bg-secondary/30 rounded-xl border border-primary/20 backdrop-blur-sm sticky bottom-6 z-10 shadow-2xl">
          {saveSuccess && (
            <span className="text-xs font-bold text-success animate-in fade-in slide-in-from-right-4 tracking-widest uppercase">
              Configuration Saved Successfully
            </span>
          )}
          <Button 
            className="gap-2 min-w-[140px] shadow-lg shadow-primary/20 font-semibold tracking-wide" 
            onClick={handleSave} 
            disabled={saving}
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Committing...</>
            ) : (
              <><Save className="w-4 h-4" /> Save Configuration</>
            )}
          </Button>
        </div>

        <section className="bg-destructive/5 border border-destructive/20 rounded-xl p-6 mt-10">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <UserX className="w-4 h-4 text-destructive" />
                <h2 className="text-sm font-semibold text-destructive tracking-wide">Danger Zone</h2>
              </div>
              <p className="text-xs text-muted-foreground">
                Permanently purge your instance configuration. This action cannot be undone.
              </p>
            </div>
            <Button variant="destructive" className="gap-2 shadow-lg shadow-destructive/20">
              <UserX className="w-4 h-4" /> Purge Account
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}