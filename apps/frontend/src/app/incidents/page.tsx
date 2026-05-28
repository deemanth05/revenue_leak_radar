import { Filter, Plus } from 'lucide-react';
import { RevenueRiskTable } from '@/components/dashboard/RevenueRiskTable';
import { incidentsApi, getMockIncidents } from '@/lib/api';
import { getSeverityClass } from '@/lib/utils';
import { IncidentSeverity, IncidentStatus, type Incident } from '@rlr/schemas';

export const metadata = {
  title: 'Incidents — Revenue Leak Radar',
  description: 'All operational incidents ranked by business impact and revenue risk',
};

export default async function IncidentsPage() {
  let incidents: Incident[];
  try {
    const listRes = await incidentsApi.list();
    incidents = listRes.items;
  } catch (error) {
    console.warn('Backend API connection failed, using mock data. Error:', error);
    incidents = getMockIncidents();
  }

  const statusFilters = [
    { label: 'All', value: 'all', count: incidents.length },
    { label: 'Active', value: IncidentStatus.ACTIVE, count: incidents.filter((i) => i.status === IncidentStatus.ACTIVE).length },
    { label: 'Investigating', value: IncidentStatus.INVESTIGATING, count: incidents.filter((i) => i.status === IncidentStatus.INVESTIGATING).length },
    { label: 'Mitigating', value: IncidentStatus.MITIGATING, count: incidents.filter((i) => i.status === IncidentStatus.MITIGATING).length },
    { label: 'Resolved', value: IncidentStatus.RESOLVED, count: incidents.filter((i) => i.status === IncidentStatus.RESOLVED).length },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Incidents</h1>
          <p className="text-sm text-text-muted mt-1">
            {incidents.length} active incidents · Ordered by revenue impact
          </p>
        </div>
        <button id="create-incident-btn" className="btn-primary">
          <Plus className="w-4 h-4" /> New Incident
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-surface border border-surface-border">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              id={`filter-status-${f.value}`}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors text-text-secondary hover:text-text-primary hover:bg-surface-elevated data-[active=true]:bg-primary-muted data-[active=true]:text-primary"
              data-active={f.value === 'all'}
            >
              {f.label}
              {f.count > 0 && (
                <span className="text-2xs font-bold opacity-70">{f.count}</span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-text-muted">Severity:</span>
          {Object.values(IncidentSeverity).map((sev) => (
            <button
              key={sev}
              id={`filter-severity-${sev}`}
              className={`${getSeverityClass(sev)} cursor-pointer`}
            >
              {sev}
            </button>
          ))}
        </div>

        <button id="filter-btn" className="btn-secondary">
          <Filter className="w-3.5 h-3.5" /> Filter
        </button>
      </div>

      {/* Main table */}
      <RevenueRiskTable incidents={incidents} />

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>Showing {incidents.length} of {incidents.length} incidents</span>
        <div className="flex items-center gap-1">
          <button id="page-prev" className="px-2 py-1 rounded border border-surface-border hover:border-border-accent disabled:opacity-40" disabled>
            ← Prev
          </button>
          <button id="page-1" className="px-2 py-1 rounded bg-primary-muted border border-primary/20 text-primary">1</button>
          <button id="page-next" className="px-2 py-1 rounded border border-surface-border hover:border-border-accent">
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
