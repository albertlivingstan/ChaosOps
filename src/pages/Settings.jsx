import TopBar from '@/components/layout/TopBar';
import { Settings, Server, Bell, Shield, Database, GitBranch, UserX, Slack, CloudLightning, Webhook, Key, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

const INTEGRATIONS = [
  { id: 'slack', name: 'Slack', description: 'Send alerts and experiment notifications to Slack channels', icon: Slack, color: 'text-warning', connected: false, placeholder: 'https://hooks.slack.com/services/...' },
  { id: 'pagerduty', name: 'PagerDuty', description: 'Trigger PagerDuty incidents on critical experiment failures', icon: CloudLightning, color: 'text-destructive', connected: false, placeholder: 'pdl+abcdef...' },
  { id: 'webhook', name: 'Custom Webhook', description: 'POST experiment events to any HTTP endpoint', icon: Webhook, color: 'text-primary', connected: true, placeholder: 'https://your-api.com/chaos-events' },
];

export default function SettingsPage() {
  const [integrations, setIntegrations] = useState(INTEGRATIONS);
  const [apiKeys, setApiKeys] = useState({});

  const toggleIntegration = (id) => {
    setIntegrations(prev => prev.map(i => i.id === id ? { ...i, connected: !i.connected } : i));
  };

  return (
    <div>
      <TopBar title="Settings" subtitle="Platform configuration & preferences" />
      <div className="p-6 max-w-2xl space-y-6">

        <section className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Server className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Cluster Config</h2>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs">Kubernetes API Server</Label>
              <Input defaultValue="https://k8s-prod-01.internal:6443" className="bg-secondary border-border font-mono text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs">Default Namespace</Label>
              <Input defaultValue="production" className="bg-secondary border-border font-mono text-sm" />
            </div>
          </div>
        </section>

        <section className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Chaos Safety</h2>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Auto-abort on critical threshold', description: 'Abort experiments if system health drops below 50%', defaultChecked: true },
              { label: 'Production guard', description: 'Prevent experiments on production namespace', defaultChecked: false },
              { label: 'Require approval for critical experiments', description: 'High/critical intensity needs manual approval', defaultChecked: true },
            ].map(item => (
              <div key={item.label} className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                </div>
                <Switch defaultChecked={item.defaultChecked} />
              </div>
            ))}
          </div>
        </section>

        <section className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Alert Notifications</h2>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Email alerts for critical severity', defaultChecked: true },
              { label: 'Slack webhook notifications', defaultChecked: false },
              { label: 'Notify on experiment completion', defaultChecked: true },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <p className="text-sm text-foreground">{item.label}</p>
                <Switch defaultChecked={item.defaultChecked} />
              </div>
            ))}
          </div>
        </section>

        <section className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <GitBranch className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">CI/CD Integration</h2>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs">GitHub Repository</Label>
              <Input defaultValue="org/chaosops" className="bg-secondary border-border font-mono text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs">Container Registry</Label>
              <Input defaultValue="ghcr.io/org/chaosops" className="bg-secondary border-border font-mono text-sm" />
            </div>
          </div>
        </section>

        {/* Integrations */}
        <section className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Webhook className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Integrations</h2>
          </div>
          <div className="space-y-4">
            {integrations.map(intg => {
              const Icon = intg.icon;
              return (
                <div key={intg.id} className="border border-border rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                        <Icon className={`w-4 h-4 ${intg.color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground">{intg.name}</p>
                          {intg.connected && (
                            <Badge className="bg-success/10 text-success border-success/20 text-[10px] px-1.5 py-0 gap-1">
                              <CheckCircle className="w-2.5 h-2.5" /> Connected
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{intg.description}</p>
                      </div>
                    </div>
                    <Switch checked={intg.connected} onCheckedChange={() => toggleIntegration(intg.id)} />
                  </div>
                  {intg.connected && (
                    <div className="flex items-center gap-2">
                      <Key className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <Input
                        placeholder={intg.placeholder}
                        value={apiKeys[intg.id] || ''}
                        onChange={e => setApiKeys(prev => ({ ...prev, [intg.id]: e.target.value }))}
                        className="bg-secondary border-border font-mono text-xs h-8"
                        type="password"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <div className="flex justify-end">
          <Button className="gap-2">Save Settings</Button>
        </div>

        <section className="bg-card border border-destructive/30 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <UserX className="w-4 h-4 text-destructive" />
            <h2 className="text-sm font-semibold text-foreground">Account Management</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <Button variant="destructive" className="gap-2">
            <UserX className="w-4 h-4" /> Delete Account
          </Button>
        </section>
      </div>
    </div>
  );
}