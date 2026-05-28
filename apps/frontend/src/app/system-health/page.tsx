import { CheckCircle, AlertTriangle, XCircle, Activity } from 'lucide-react';

export const metadata = {
  title: 'System Health — Revenue Leak Radar',
  description: 'Real-time service health monitoring across all integrated systems',
};

interface ServiceStatus {
  name: string;
  category: string;
  status: 'healthy' | 'degraded' | 'down';
  latency: number | null;
  errorRate: number | null;
  uptime: number | null;
  lastChecked: string;
}

const SERVICES: ServiceStatus[] = [
  { name: 'Checkout Service', category: 'Application', status: 'degraded', latency: 4820, errorRate: 34.2, uptime: 97.8, lastChecked: '12s ago' },
  { name: 'Auth Service', category: 'Application', status: 'degraded', latency: 2940, errorRate: 4.5, uptime: 99.1, lastChecked: '8s ago' },
  { name: 'Payment Processor', category: 'Application', status: 'degraded', latency: 6800, errorRate: 28.1, uptime: 98.2, lastChecked: '15s ago' },
  { name: 'API Gateway', category: 'Infrastructure', status: 'healthy', latency: 45, errorRate: 0.1, uptime: 99.97, lastChecked: '5s ago' },
  { name: 'PostgreSQL (Primary)', category: 'Database', status: 'healthy', latency: 2, errorRate: 0.0, uptime: 99.99, lastChecked: '10s ago' },
  { name: 'Redis Cache', category: 'Infrastructure', status: 'healthy', latency: 1, errorRate: 0.0, uptime: 99.99, lastChecked: '7s ago' },
  { name: 'Stripe API', category: 'External', status: 'degraded', latency: 5200, errorRate: 18.3, uptime: null, lastChecked: '20s ago' },
  { name: 'CDN (EU-WEST-1)', category: 'Infrastructure', status: 'degraded', latency: 890, errorRate: 2.4, uptime: 99.2, lastChecked: '14s ago' },
  { name: 'CDN (US-EAST-1)', category: 'Infrastructure', status: 'healthy', latency: 42, errorRate: 0.2, uptime: 99.98, lastChecked: '6s ago' },
  { name: 'Sentry', category: 'Monitoring', status: 'healthy', latency: 120, errorRate: 0.0, uptime: null, lastChecked: '30s ago' },
  { name: 'GitHub Actions', category: 'CI/CD', status: 'healthy', latency: 850, errorRate: 0.5, uptime: null, lastChecked: '45s ago' },
  { name: 'Slack Webhooks', category: 'Communication', status: 'healthy', latency: 210, errorRate: 0.0, uptime: null, lastChecked: '25s ago' },
];

function StatusIcon({ status }: { status: ServiceStatus['status'] }) {
  if (status === 'healthy') return <CheckCircle className="w-4 h-4 text-success" />;
  if (status === 'degraded') return <AlertTriangle className="w-4 h-4 text-warning" />;
  return <XCircle className="w-4 h-4 text-danger" />;
}

function LatencyBar({ latency }: { latency: number }) {
  const max = 8000;
  const pct = Math.min((latency / max) * 100, 100);
  const color = latency < 200 ? '#10B981' : latency < 1000 ? '#F59E0B' : '#EF4444';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 rounded-full bg-surface-border overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-mono" style={{ color }}>{latency}ms</span>
    </div>
  );
}

export default function SystemHealthPage() {
  const healthyCount = SERVICES.filter((s) => s.status === 'healthy').length;
  const degradedCount = SERVICES.filter((s) => s.status === 'degraded').length;
  const downCount = SERVICES.filter((s) => s.status === 'down').length;

  const categories = [...new Set(SERVICES.map((s) => s.category))];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">System Health</h1>
          <p className="text-sm text-text-muted mt-1">
            Real-time service status across all integrated systems
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <span className="live-indicator">Monitoring active</span>
        </div>
      </div>

      {/* Overall status */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 border-t-2 border-t-success">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-success" />
            <span className="text-2xs uppercase tracking-widest text-text-muted">Healthy</span>
          </div>
          <div className="text-3xl font-bold text-success">{healthyCount}</div>
          <div className="text-xs text-text-muted mt-1">services nominal</div>
        </div>
        <div className="card p-4 border-t-2 border-t-warning">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-warning" />
            <span className="text-2xs uppercase tracking-widest text-text-muted">Degraded</span>
          </div>
          <div className="text-3xl font-bold text-warning">{degradedCount}</div>
          <div className="text-xs text-text-muted mt-1">services affected</div>
        </div>
        <div className="card p-4 border-t-2 border-t-danger">
          <div className="flex items-center gap-2 mb-1">
            <XCircle className="w-4 h-4 text-danger" />
            <span className="text-2xs uppercase tracking-widest text-text-muted">Down</span>
          </div>
          <div className="text-3xl font-bold text-danger">{downCount}</div>
          <div className="text-xs text-text-muted mt-1">services unavailable</div>
        </div>
      </div>

      {/* Services by category */}
      <div className="space-y-4">
        {categories.map((category) => {
          const categoryServices = SERVICES.filter((s) => s.category === category);
          return (
            <div key={category} className="card overflow-hidden">
              <div className="px-4 py-2.5 border-b border-surface-border bg-surface-elevated flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-text-muted" />
                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">{category}</span>
                <span className="text-2xs text-text-muted">· {categoryServices.length} services</span>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Status</th>
                    <th>Latency</th>
                    <th>Error Rate</th>
                    <th>Uptime</th>
                    <th>Last Check</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryServices.map((svc) => (
                    <tr key={svc.name}>
                      <td className="font-medium text-text-primary">{svc.name}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <StatusIcon status={svc.status} />
                          <span className={`text-xs font-medium capitalize ${svc.status === 'healthy' ? 'text-success' : svc.status === 'degraded' ? 'text-warning' : 'text-danger'}`}>
                            {svc.status}
                          </span>
                        </div>
                      </td>
                      <td>
                        {svc.latency !== null ? <LatencyBar latency={svc.latency} /> : <span className="text-text-muted text-xs">—</span>}
                      </td>
                      <td>
                        {svc.errorRate !== null ? (
                          <span className={`text-xs font-mono font-medium ${svc.errorRate === 0 ? 'text-success' : svc.errorRate < 5 ? 'text-warning' : 'text-danger'}`}>
                            {svc.errorRate.toFixed(1)}%
                          </span>
                        ) : <span className="text-text-muted text-xs">—</span>}
                      </td>
                      <td>
                        {svc.uptime !== null ? (
                          <span className={`text-xs font-mono ${svc.uptime >= 99.9 ? 'text-success' : svc.uptime >= 99 ? 'text-warning' : 'text-danger'}`}>
                            {svc.uptime.toFixed(2)}%
                          </span>
                        ) : <span className="text-text-muted text-xs">—</span>}
                      </td>
                      <td className="text-text-muted text-xs">{svc.lastChecked}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}
